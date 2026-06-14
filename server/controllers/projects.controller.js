import { db } from '../db/connect.js'
import { createAuditLog } from '../utils/createAuditLog.js'
import { getClientIp } from '../utils/getClientIp.js'

const isMissing = (value) => {
  return value === undefined || value === null || value === ''
}

const normalizeLocationCode = (value) => {
  if (isMissing(value)) return ''
  return String(value).trim().toUpperCase()
}

const validateLocationCode = (value) => {
  const locationCode = normalizeLocationCode(value)

  if (locationCode.length === 0) {
    return {
      isValid: false,
      message: 'Location code is required',
      value: locationCode
    }
  }

  if (locationCode.length > 10) {
    return {
      isValid: false,
      message: 'Location code must be 1 to 10 characters',
      value: locationCode
    }
  }

  return {
    isValid: true,
    message: null,
    value: locationCode
  }
}

export const getProjects = async (req, res) => {
  const [projects] = await db.query(
    `
    SELECT
      id,
      name,
      location,
      location_code,
      administrator,
      tax_declaration_no,
      pin,
      status,
      ended_at,
      created_at,
      updated_at
    FROM projects
    ORDER BY id DESC
    `
  )

  res.status(200).json({
    projects
  })
}

export const getProject = async (req, res) => {
  const { id } = req.params

  const [rows] = await db.query(
    `
    SELECT
      id,
      name,
      location,
      location_code,
      administrator,
      tax_declaration_no,
      pin,
      status,
      ended_at,
      created_at,
      updated_at
    FROM projects
    WHERE id = ?
    LIMIT 1
    `,
    [id]
  )

  const project = rows[0]

  if (!project) {
    return res.status(404).json({
      message: 'Project not found'
    })
  }

  res.status(200).json({
    project
  })
}

export const createProject = async (req, res) => {
  const {
    name,
    location,
    location_code,
    administrator,
    tax_declaration_no,
    pin,
    status
  } = req.body

  if (!name) {
    return res.status(400).json({
      message: 'Project name is required'
    })
  }

  const locationCodeValidation = validateLocationCode(location_code)

  if (!locationCodeValidation.isValid) {
    return res.status(400).json({
      message: locationCodeValidation.message
    })
  }

  const [result] = await db.query(
    `
    INSERT INTO projects (
      name,
      location,
      location_code,
      administrator,
      tax_declaration_no,
      pin,
      status
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [
      name,
      location || null,
      locationCodeValidation.value,
      administrator || null,
      tax_declaration_no || null,
      pin || null,
      status || 'active'
    ]
  )

  await createAuditLog({
    userId: req.user.id,
    action: 'create',
    module: 'Projects',
    description: `Created project ${name}`,
    ipAddress: req.ip
  })

  res.status(201).json({
    message: 'Project created successfully',
    projectId: result.insertId
  })
}

export const updateProject = async (req, res) => {
  const { id } = req.params

  const {
    name,
    location,
    location_code,
    administrator,
    tax_declaration_no,
    pin,
    status,
    ended_at
  } = req.body

  if (!name) {
    return res.status(400).json({
      message: 'Project name is required'
    })
  }

  const [existingRows] = await db.query(
    `
    SELECT id, location_code
    FROM projects
    WHERE id = ?
    LIMIT 1
    `,
    [id]
  )

  const existingProject = existingRows[0]

  if (!existingProject) {
    return res.status(404).json({
      message: 'Project not found'
    })
  }

  const hasLocationCode = Object.prototype.hasOwnProperty.call(
    req.body,
    'location_code'
  )

  let finalLocationCode = existingProject.location_code || ''

  if (hasLocationCode) {
    const locationCodeValidation = validateLocationCode(location_code)

    if (!locationCodeValidation.isValid) {
      return res.status(400).json({
        message: locationCodeValidation.message
      })
    }

    finalLocationCode = locationCodeValidation.value
  }

  const [result] = await db.query(
    `
    UPDATE projects
    SET
      name = ?,
      location = ?,
      location_code = ?,
      administrator = ?,
      tax_declaration_no = ?,
      pin = ?,
      status = ?,
      ended_at = ?
    WHERE id = ?
    `,
    [
      name,
      location || null,
      finalLocationCode,
      administrator || null,
      tax_declaration_no || null,
      pin || null,
      status || 'active',
      ended_at || null,
      id
    ]
  )

  if (result.affectedRows === 0) {
    return res.status(404).json({
      message: 'Project not found'
    })
  }

  await createAuditLog({
    userId: req.user.id,
    action: 'update',
    module: 'Projects',
    description: `Updated project ${name}`,
    ipAddress: req.ip
  })

  res.status(200).json({
    message: 'Project updated successfully'
  })
}


export const deleteProject = async (req, res) => {
  const { id } = req.params

  const [projectRows] = await db.query(
    `SELECT id, name FROM projects WHERE id = ? LIMIT 1`,
    [id]
  )

  const project = projectRows[0]

  if (!project) {
    return res.status(404).json({ message: 'Project not found' })
  }

  const [listingRows] = await db.query(
    `SELECT id FROM listings WHERE project_id = ? LIMIT 1`,
    [id]
  )

  if (listingRows.length > 0) {
    return res.status(400).json({
      message: 'Cannot delete a project that has listings. Remove all listings first.'
    })
  }

  await db.query(`DELETE FROM projects WHERE id = ?`, [id])

  await createAuditLog({
    userId: req.user.id,
    action: 'delete',
    module: 'Projects',
    description: `Deleted project ${project.name}`,
    ipAddress: getClientIp(req)
  })

  res.status(200).json({ message: 'Project deleted successfully' })
}
