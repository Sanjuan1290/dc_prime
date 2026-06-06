import { db } from '../db/connect.js'
import { createAuditLog } from '../utils/createAuditLog.js'

export const getProjects = async (req, res) => {
  const [projects] = await db.query(
    `
    SELECT
      id,
      name,
      location,
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

  const [result] = await db.query(
    `
    INSERT INTO projects (
      name,
      location,
      administrator,
      tax_declaration_no,
      pin,
      status
    ) VALUES (?, ?, ?, ?, ?, ?)
    `,
    [
      name,
      location || null,
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

  const [result] = await db.query(
    `
    UPDATE projects
    SET
      name = ?,
      location = ?,
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