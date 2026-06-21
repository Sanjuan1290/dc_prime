import { db } from '../db/connect.js'
import { safeCreateAuditLog } from '../utils/createAuditLog.js'
import { getClientIp } from '../utils/getClientIp.js'
import {
  getProjectDocumentRequirements as loadProjectDocumentRequirements,
  replaceProjectDocumentRequirements,
  getDocumentTemplateItems,
} from '../utils/documentRequirements.js'

const isMissing = (value) => {
  return value === undefined || value === null || value === ''
}

const nullableValue = (value) => {
  return isMissing(value) ? null : value
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
      value: locationCode,
    }
  }

  if (locationCode.length > 10) {
    return {
      isValid: false,
      message: 'Location code must be 1 to 10 characters',
      value: locationCode,
    }
  }

  return {
    isValid: true,
    message: null,
    value: locationCode,
  }
}

const allowedProjectTypes = ['lot_only', 'house_and_lot', 'mixed']

const normalizeProjectType = (value) => {
  if (isMissing(value)) return 'lot_only'
  return allowedProjectTypes.includes(value) ? value : 'lot_only'
}

const ensureProjectUpgradeSchema = async (connectionOrDb = db) => {
  const [columns] = await connectionOrDb.query(
    `
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'projects'
      AND COLUMN_NAME = 'project_type'
    `,
  )

  if (columns.length > 0) return

  await connectionOrDb.query(
    `
    ALTER TABLE projects
    ADD COLUMN project_type ENUM('lot_only','house_and_lot','mixed') NOT NULL DEFAULT 'lot_only' AFTER location_code
    `,
  )
}

const projectSelectFields = `
  p.id,
  p.name,
  p.location,
  p.location_code,
  COALESCE(p.project_type, 'lot_only') AS project_type,
  p.administrator,
  p.tax_declaration_no,
  p.pin,
  p.status,
  p.document_template_id,
  template.name AS document_template_name,
  p.ended_at,
  COALESCE(document_summary.document_count, 0) AS document_count,
  COALESCE(document_summary.required_count, 0) AS required_document_count,
  p.created_at,
  p.updated_at
`

const hydrateProjectRequirements = async (project) => {
  if (!project) return null

  const documentRequirements = await loadProjectDocumentRequirements(db, project.id)

  return {
    ...project,
    document_requirements: documentRequirements,
    documentRequirements,
  }
}

export const getProjects = async (req, res) => {
  await ensureProjectUpgradeSchema()

  const [projects] = await db.query(
    `
    SELECT
      ${projectSelectFields}
    FROM projects p
    LEFT JOIN document_templates template ON template.id = p.document_template_id
    LEFT JOIN (
      SELECT
        project_id,
        COUNT(*) AS document_count,
        SUM(CASE WHEN is_required = TRUE THEN 1 ELSE 0 END) AS required_count
      FROM project_document_requirements
      WHERE status = 'active'
      GROUP BY project_id
    ) document_summary ON document_summary.project_id = p.id
    ORDER BY p.id DESC
    `
  )

  res.status(200).json({
    projects,
  })
}

export const getProject = async (req, res) => {
  const { id } = req.params

  await ensureProjectUpgradeSchema()

  const [rows] = await db.query(
    `
    SELECT
      ${projectSelectFields}
    FROM projects p
    LEFT JOIN document_templates template ON template.id = p.document_template_id
    LEFT JOIN (
      SELECT
        project_id,
        COUNT(*) AS document_count,
        SUM(CASE WHEN is_required = TRUE THEN 1 ELSE 0 END) AS required_count
      FROM project_document_requirements
      WHERE status = 'active'
      GROUP BY project_id
    ) document_summary ON document_summary.project_id = p.id
    WHERE p.id = ?
    LIMIT 1
    `,
    [id]
  )

  const project = rows[0]

  if (!project) {
    return res.status(404).json({
      message: 'Project not found',
    })
  }

  res.status(200).json({
    project: await hydrateProjectRequirements(project),
  })
}

export const getProjectDocumentRequirements = async (req, res) => {
  const { id } = req.params

  const [projectRows] = await db.query(
    `SELECT id FROM projects WHERE id = ? LIMIT 1`,
    [id]
  )

  if (!projectRows[0]) {
    return res.status(404).json({ message: 'Project not found' })
  }

  const requirements = await loadProjectDocumentRequirements(db, id)

  res.status(200).json({
    message: 'Project document requirements fetched successfully',
    requirements,
    documentRequirements: requirements,
    data: requirements,
  })
}

export const updateProjectDocumentRequirements = async (req, res) => {
  const { id } = req.params
  const { document_requirements, documentRequirements } = req.body

  const [projectRows] = await db.query(
    `SELECT id, name FROM projects WHERE id = ? LIMIT 1`,
    [id]
  )

  const project = projectRows[0]

  if (!project) {
    return res.status(404).json({ message: 'Project not found' })
  }

  const requirements = document_requirements || documentRequirements || []
  const result = await replaceProjectDocumentRequirements(db, id, requirements)

  await safeCreateAuditLog({
    userId: req.user.id,
    action: 'update',
    module: 'Project Documents',
    description: `Updated default documents for project ${project.name}`,
    ipAddress: getClientIp(req),
  })

  res.status(200).json({
    message: 'Project document requirements updated successfully',
    data: result,
  })
}

export const createProject = async (req, res) => {
  const {
    name,
    location,
    location_code,
    project_type,
    administrator,
    tax_declaration_no,
    pin,
    status,
    document_template_id,
    document_requirements,
    documentRequirements,
  } = req.body

  if (!name) {
    return res.status(400).json({
      message: 'Project name is required',
    })
  }

  const locationCodeValidation = validateLocationCode(location_code)
  const finalProjectType = normalizeProjectType(project_type)

  if (!locationCodeValidation.isValid) {
    return res.status(400).json({
      message: locationCodeValidation.message,
    })
  }

  const connection = await db.getConnection()

  try {
    await connection.beginTransaction()
    await ensureProjectUpgradeSchema(connection)

    const [result] = await connection.query(
      `
      INSERT INTO projects (
        name,
        location,
        location_code,
        project_type,
        administrator,
        tax_declaration_no,
        pin,
        status,
        document_template_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        name,
        location || null,
        locationCodeValidation.value,
        finalProjectType,
        administrator || null,
        tax_declaration_no || null,
        pin || null,
        status || 'active',
        nullableValue(document_template_id),
      ]
    )

    const projectId = result.insertId
    let requirements = document_requirements || documentRequirements || []

    if ((!Array.isArray(requirements) || requirements.length === 0) && !isMissing(document_template_id)) {
      requirements = await getDocumentTemplateItems(connection, document_template_id)
    }

    if (Array.isArray(requirements) && requirements.length > 0) {
      await replaceProjectDocumentRequirements(connection, projectId, requirements)
    }

    await connection.commit()

    await safeCreateAuditLog({
      userId: req.user.id,
      action: 'create',
      module: 'Projects',
      description: `Created project ${name}`,
      ipAddress: getClientIp(req),
    })

    res.status(201).json({
      message: 'Project created successfully',
      projectId,
    })
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

export const updateProject = async (req, res) => {
  const { id } = req.params

  const {
    name,
    location,
    location_code,
    project_type,
    administrator,
    tax_declaration_no,
    pin,
    status,
    document_template_id,
    ended_at,
    document_requirements,
    documentRequirements,
  } = req.body

  if (!name) {
    return res.status(400).json({
      message: 'Project name is required',
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
      message: 'Project not found',
    })
  }

  const hasLocationCode = Object.prototype.hasOwnProperty.call(
    req.body,
    'location_code'
  )

  let finalLocationCode = existingProject.location_code || ''
  const finalProjectType = normalizeProjectType(project_type)

  if (hasLocationCode) {
    const locationCodeValidation = validateLocationCode(location_code)

    if (!locationCodeValidation.isValid) {
      return res.status(400).json({
        message: locationCodeValidation.message,
      })
    }

    finalLocationCode = locationCodeValidation.value
  }

  const connection = await db.getConnection()

  try {
    await connection.beginTransaction()
    await ensureProjectUpgradeSchema(connection)

    const [result] = await connection.query(
      `
      UPDATE projects
      SET
        name = ?,
        location = ?,
        location_code = ?,
        project_type = ?,
        administrator = ?,
        tax_declaration_no = ?,
        pin = ?,
        status = ?,
        document_template_id = ?,
        ended_at = ?
      WHERE id = ?
      `,
      [
        name,
        location || null,
        finalLocationCode,
        finalProjectType,
        administrator || null,
        tax_declaration_no || null,
        pin || null,
        status || 'active',
        nullableValue(document_template_id),
        ended_at || null,
        id,
      ]
    )

    if (result.affectedRows === 0) {
      await connection.rollback()
      return res.status(404).json({
        message: 'Project not found',
      })
    }

    const hasRequirements =
      Array.isArray(document_requirements) || Array.isArray(documentRequirements)

    if (hasRequirements) {
      await replaceProjectDocumentRequirements(
        connection,
        id,
        document_requirements || documentRequirements || []
      )
    } else if (!isMissing(document_template_id)) {
      const templateRequirements = await getDocumentTemplateItems(connection, document_template_id)
      if (templateRequirements.length > 0) {
        await replaceProjectDocumentRequirements(connection, id, templateRequirements)
      }
    }

    await connection.commit()

    await safeCreateAuditLog({
      userId: req.user.id,
      action: 'update',
      module: 'Projects',
      description: `Updated project ${name}`,
      ipAddress: getClientIp(req),
    })

    res.status(200).json({
      message: 'Project updated successfully',
    })
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
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
      message: 'Cannot delete a project that has listings. Remove all listings first.',
    })
  }

  const connection = await db.getConnection()

  try {
    await connection.beginTransaction()
    await connection.query(`DELETE FROM project_document_requirements WHERE project_id = ?`, [id])
    await connection.query(`DELETE FROM projects WHERE id = ?`, [id])
    await connection.commit()
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }

  await safeCreateAuditLog({
    userId: req.user.id,
    action: 'delete',
    module: 'Projects',
    description: `Deleted project ${project.name}`,
    ipAddress: getClientIp(req),
  })

  res.status(200).json({ message: 'Project deleted successfully' })
}
