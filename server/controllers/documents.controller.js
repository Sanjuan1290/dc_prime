import { db } from '../db/connect.js'
import { safeCreateAuditLog } from '../utils/createAuditLog.js'
import { getClientIp } from '../utils/getClientIp.js'
import { refreshCommissionEligibility } from './commissions.controller.js'
import { PDFDocument } from 'pdf-lib'
import {
  CLOUDINARY_NOT_CONFIGURED_MESSAGE,
  deleteCloudinaryAsset,
  getClientDocumentFolder,
  isCloudinaryConfigured,
  uploadBufferToCloudinary,
} from '../lib/cloudinary.js'
import {
  createClientDocumentChecklistFromListing,
  getDocumentTemplates as loadDocumentTemplates,
  getDocumentTemplateItems,
  replaceDocumentTemplateItems,
} from '../utils/documentRequirements.js'

const allowedClientDocumentStatuses = [
  'not_submitted',
  'submitted',
  'approved',
  'rejected',
]

const allowedClientDocumentStatusTransitions = {
  not_submitted: ['submitted'],
  submitted: ['approved', 'rejected'],
  rejected: ['submitted'],
  approved: ['submitted', 'not_submitted'],
}

const sendCloudinaryNotConfigured = (res) => {
  return res.status(503).json({
    message: CLOUDINARY_NOT_CONFIGURED_MESSAGE,
  })
}

const canTransitionClientDocumentStatus = (currentStatus, nextStatus) => {
  if (currentStatus === nextStatus) return true

  return (
    allowedClientDocumentStatusTransitions[currentStatus] || []
  ).includes(nextStatus)
}

const isMissing = (value) => {
  return value === undefined || value === null || value === ''
}

const nullableValue = (value) => {
  if (isMissing(value)) return null
  return value
}

const getUploadedFilesFromRequest = (req) => {
  const files = []

  if (req.file) files.push(req.file)

  if (Array.isArray(req.files)) {
    files.push(...req.files)
  } else if (req.files && typeof req.files === 'object') {
    Object.values(req.files).forEach((fileGroup) => {
      if (Array.isArray(fileGroup)) files.push(...fileGroup)
    })
  }

  return files.filter(Boolean)
}

const sanitizeInlineFileName = (value = 'document') => {
  return String(value || 'document')
    .replace(/[\r\n"]/g, '')
    .replace(/[\/\\]/g, '-')
    .trim() || 'document'
}

const sendRemoteFileInline = async ({ res, fileUrl, fileName, mimeType }) => {
  const response = await fetch(fileUrl)

  if (!response.ok) {
    return res.redirect(fileUrl)
  }

  const buffer = Buffer.from(await response.arrayBuffer())
  const resolvedMimeType = mimeType || response.headers.get('content-type') || 'application/octet-stream'

  res.setHeader('Content-Type', resolvedMimeType)
  res.setHeader('Content-Disposition', `inline; filename="${sanitizeInlineFileName(fileName)}"`)
  res.setHeader('Cache-Control', 'private, max-age=60')
  return res.send(buffer)
}

const booleanValue = (value, defaultValue = false) => {
  if (isMissing(value)) return defaultValue ? 1 : 0

  if (typeof value === 'boolean') {
    return value ? 1 : 0
  }

  if (typeof value === 'number') {
    return value === 1 ? 1 : 0
  }

  return String(value).toLowerCase() === 'true' || value === '1' ? 1 : 0
}

const documentFields = `
  id,
  name,
  description,
  is_required,
  can_reuse,
  status,
  created_at,
  updated_at
`

const getClientUnitById = async (clientUnitId, connectionOrDb = db) => {
  const [rows] = await connectionOrDb.query(
    `
    SELECT
      id,
      client_id,
      listing_id,
      status
    FROM client_units
    WHERE id = ?
    LIMIT 1
    `,
    [clientUnitId]
  )

  return rows[0]
}


export const getDocumentTemplates = async (req, res) => {
  const templates = await loadDocumentTemplates(db)

  res.status(200).json({
    message: 'Document templates fetched successfully',
    templates,
    documentTemplates: templates,
    data: templates,
  })
}

export const getDocumentTemplate = async (req, res) => {
  const { id } = req.params

  const [rows] = await db.query(
    `
    SELECT
      dt.id,
      dt.name,
      dt.description,
      dt.status,
      dt.created_by,
      creator.full_name AS created_by_name,
      dt.created_at,
      dt.updated_at
    FROM document_templates dt
    LEFT JOIN users creator ON creator.id = dt.created_by
    WHERE dt.id = ?
    LIMIT 1
    `,
    [id]
  )

  const template = rows[0]

  if (!template) {
    return res.status(404).json({ message: 'Document template not found' })
  }

  const items = await getDocumentTemplateItems(db, id)

  res.status(200).json({
    message: 'Document template fetched successfully',
    template: {
      ...template,
      items,
      document_requirements: items,
      documentRequirements: items,
    },
  })
}

export const createDocumentTemplate = async (req, res) => {
  const {
    name,
    description,
    status = 'active',
    items,
    document_requirements,
    documentRequirements,
  } = req.body

  if (isMissing(name)) {
    return res.status(400).json({ message: 'Template name is required' })
  }

  const requirements = items || document_requirements || documentRequirements || []
  const connection = await db.getConnection()

  try {
    await connection.beginTransaction()

    const [result] = await connection.query(
      `
      INSERT INTO document_templates (
        name,
        description,
        status,
        created_by
      ) VALUES (?, ?, ?, ?)
      `,
      [name, nullableValue(description), status || 'active', req.user.id]
    )

    const templateId = result.insertId
    const sync = await replaceDocumentTemplateItems(connection, templateId, requirements)

    await connection.commit()

    await safeCreateAuditLog({
      userId: req.user.id,
      action: 'create',
      module: 'Document Templates',
      description: `Created document template ${name}`,
      ipAddress: getClientIp(req),
    })

    res.status(201).json({
      message: 'Document template created successfully',
      templateId,
      data: { templateId, ...sync },
    })
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

export const updateDocumentTemplate = async (req, res) => {
  const { id } = req.params
  const {
    name,
    description,
    status = 'active',
    items,
    document_requirements,
    documentRequirements,
  } = req.body

  if (isMissing(name)) {
    return res.status(400).json({ message: 'Template name is required' })
  }

  const requirements = items || document_requirements || documentRequirements || []
  const connection = await db.getConnection()

  try {
    await connection.beginTransaction()

    const [result] = await connection.query(
      `
      UPDATE document_templates
      SET
        name = ?,
        description = ?,
        status = ?
      WHERE id = ?
      `,
      [name, nullableValue(description), status || 'active', id]
    )

    if (result.affectedRows === 0) {
      await connection.rollback()
      return res.status(404).json({ message: 'Document template not found' })
    }

    const sync = await replaceDocumentTemplateItems(connection, id, requirements)

    await connection.commit()

    await safeCreateAuditLog({
      userId: req.user.id,
      action: 'update',
      module: 'Document Templates',
      description: `Updated document template ${name}`,
      ipAddress: getClientIp(req),
    })

    res.status(200).json({
      message: 'Document template updated successfully',
      data: sync,
    })
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

export const deleteDocumentTemplate = async (req, res) => {
  const { id } = req.params

  const [rows] = await db.query(
    `SELECT id, name FROM document_templates WHERE id = ? LIMIT 1`,
    [id]
  )

  const template = rows[0]

  if (!template) {
    return res.status(404).json({ message: 'Document template not found' })
  }

  const connection = await db.getConnection()

  try {
    await connection.beginTransaction()

    await connection.query(
      `UPDATE projects SET document_template_id = NULL WHERE document_template_id = ?`,
      [id]
    )

    await connection.query(
      `DELETE FROM document_template_items WHERE template_id = ?`,
      [id]
    )

    await connection.query(
      `DELETE FROM document_templates WHERE id = ?`,
      [id]
    )

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
    module: 'Document Templates',
    description: `Deleted document template ${template.name}`,
    ipAddress: getClientIp(req),
  })

  res.status(200).json({ message: 'Document template deleted successfully' })
}

export const getDocuments = async (req, res) => {
  const {
    search,
    status,
    is_required,
    can_reuse,
  } = req.query

  const conditions = []
  const params = []

  if (!isMissing(search)) {
    const searchTerm = `%${search}%`

    conditions.push(`
      (
        name LIKE ?
        OR description LIKE ?
        OR status LIKE ?
      )
    `)

    params.push(searchTerm, searchTerm, searchTerm)
  }

  if (!isMissing(status) && status !== 'all') {
    conditions.push('status = ?')
    params.push(status)
  }

  if (!isMissing(is_required) && is_required !== 'all') {
    conditions.push('is_required = ?')
    params.push(booleanValue(is_required))
  }

  if (!isMissing(can_reuse) && can_reuse !== 'all') {
    conditions.push('can_reuse = ?')
    params.push(booleanValue(can_reuse))
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const [documents] = await db.query(
    `
    SELECT
      ${documentFields}
    FROM documents
    ${whereClause}
    ORDER BY id ASC
    `,
    params
  )

  res.status(200).json({
    message: 'Documents fetched successfully',
    documents,
    data: documents,
  })
}

export const getDocument = async (req, res) => {
  const { id } = req.params

  const [rows] = await db.query(
    `
    SELECT
      ${documentFields}
    FROM documents
    WHERE id = ?
    LIMIT 1
    `,
    [id]
  )

  const document = rows[0]

  if (!document) {
    return res.status(404).json({
      message: 'Document not found',
    })
  }

  res.status(200).json({
    message: 'Document fetched successfully',
    document,
    data: document,
  })
}

export const createDocument = async (req, res) => {
  const {
    name,
    description,
    is_required,
    can_reuse,
    status = 'active',
  } = req.body

  if (isMissing(name)) {
    return res.status(400).json({
      message: 'Document name is required',
    })
  }

  const [result] = await db.query(
    `
    INSERT INTO documents (
      name,
      description,
      is_required,
      can_reuse,
      status
    ) VALUES (?, ?, ?, ?, ?)
    `,
    [
      name,
      nullableValue(description),
      booleanValue(is_required, true),
      booleanValue(can_reuse),
      status || 'active',
    ]
  )

  await safeCreateAuditLog({
    userId: req.user.id,
    action: 'create',
    module: 'Documents',
    description: `Created document ${name}`,
    ipAddress: getClientIp(req),
  })

  res.status(201).json({
    message: 'Document created successfully',
    documentId: result.insertId,
    data: {
      documentId: result.insertId,
    },
  })
}

export const updateDocument = async (req, res) => {
  const { id } = req.params
  const {
    name,
    description,
    is_required,
    can_reuse,
    status,
  } = req.body

  if (isMissing(name)) {
    return res.status(400).json({
      message: 'Document name is required',
    })
  }

  const [result] = await db.query(
    `
    UPDATE documents
    SET
      name = ?,
      description = ?,
      is_required = ?,
      can_reuse = ?,
      status = ?
    WHERE id = ?
    `,
    [
      name,
      nullableValue(description),
      booleanValue(is_required),
      booleanValue(can_reuse),
      status || 'active',
      id,
    ]
  )

  if (result.affectedRows === 0) {
    return res.status(404).json({
      message: 'Document not found',
    })
  }

  await safeCreateAuditLog({
    userId: req.user.id,
    action: 'update',
    module: 'Documents',
    description: `Updated document ${name}`,
    ipAddress: getClientIp(req),
  })

  res.status(200).json({
    message: 'Document updated successfully',
  })
}

export const getClientUnitDocuments = async (req, res) => {
  const { clientUnitId } = req.params

  const clientUnit = await getClientUnitById(clientUnitId)

  if (!clientUnit) {
    return res.status(404).json({
      message: 'Client unit not found',
    })
  }

  const [documents] = await db.query(
    `
    SELECT
      cdl.id,
      cdl.client_unit_id,
      cdl.document_id,
      d.name,
      d.description,
      COALESCE(cdl.is_required, d.is_required) AS is_required,
      cdl.requirement_source,
      d.can_reuse,
      cdl.file_url,
      cdl.storage_provider,
      cdl.cloudinary_asset_id,
      cdl.cloudinary_public_id,
      cdl.cloudinary_folder,
      cdl.cloudinary_resource_type,
      cdl.cloudinary_secure_url,
      cdl.drive_file_id,
      cdl.drive_folder_id,
      cdl.file_name,
      cdl.original_file_name,
      cdl.mime_type,
      cdl.file_size,
      cdl.web_view_link,
      cdl.uploaded_at,
      cdl.uploaded_by,
      uploader.full_name AS uploaded_by_name,
      cdl.status,
      cdl.reviewed_by,
      reviewer.full_name AS reviewed_by_name,
      cdl.reviewed_at,
      cdl.created_at,
      cdl.updated_at
    FROM client_document_list cdl
    INNER JOIN documents d ON d.id = cdl.document_id
    LEFT JOIN users reviewer ON reviewer.id = cdl.reviewed_by
    LEFT JOIN users uploader ON uploader.id = cdl.uploaded_by
    WHERE cdl.client_unit_id = ?
    ORDER BY cdl.id ASC
    `,
    [clientUnitId]
  )

  const documentIds = documents.map((document) => document.id)
  let filesByDocumentId = new Map()

  if (documentIds.length > 0) {
    const [fileRows] = await db.query(
      `
      SELECT
        cdf.id,
        cdf.client_document_id,
        cdf.client_unit_id,
        cdf.document_id,
        cdf.storage_provider,
        cdf.cloudinary_asset_id,
        cdf.cloudinary_public_id,
        cdf.cloudinary_folder,
        cdf.cloudinary_resource_type,
        cdf.cloudinary_secure_url,
        cdf.drive_file_id,
        cdf.drive_folder_id,
        cdf.file_name,
        cdf.original_file_name,
        cdf.mime_type,
        cdf.file_size,
        cdf.web_view_link,
        cdf.file_url,
        cdf.uploaded_at,
        cdf.uploaded_by,
        uploader.full_name AS uploaded_by_name,
        cdf.is_primary,
        cdf.file_status,
        cdf.created_at,
        cdf.updated_at
      FROM client_document_files cdf
      LEFT JOIN users uploader ON uploader.id = cdf.uploaded_by
      WHERE cdf.client_document_id IN (?)
        AND cdf.file_status = 'active'
      ORDER BY cdf.client_document_id ASC, cdf.is_primary DESC, cdf.uploaded_at DESC, cdf.id DESC
      `,
      [documentIds]
    )

    filesByDocumentId = fileRows.reduce((map, file) => {
      const list = map.get(file.client_document_id) || []
      list.push(file)
      map.set(file.client_document_id, list)
      return map
    }, new Map())
  }

  const normalizedDocuments = documents.map((document) => {
    const files = filesByDocumentId.get(document.id) || []
    const legacyFile = document.file_url || document.cloudinary_secure_url || document.web_view_link
      ? [{
          id: null,
          client_document_id: document.id,
          client_unit_id: document.client_unit_id,
          document_id: document.document_id,
          file_name: document.file_name,
          original_file_name: document.original_file_name,
          mime_type: document.mime_type,
          file_size: document.file_size,
          file_url: document.file_url || document.cloudinary_secure_url || document.web_view_link,
          web_view_link: document.web_view_link,
          uploaded_at: document.uploaded_at,
          uploaded_by: document.uploaded_by,
          uploaded_by_name: document.uploaded_by_name,
          is_primary: 1,
          file_status: 'active',
          legacy: true,
        }]
      : []

    const resolvedFiles = files.length > 0 ? files : legacyFile

    return {
      ...document,
      files: resolvedFiles,
      upload_count: resolvedFiles.length,
    }
  })

  res.status(200).json({
    message: 'Client unit documents fetched successfully',
    documents: normalizedDocuments,
    clientDocuments: normalizedDocuments,
    data: normalizedDocuments,
  })
}

export const createChecklistForClientUnit = async (req, res) => {
  const { clientUnitId } = req.params

  const clientUnit = await getClientUnitById(clientUnitId)

  if (!clientUnit) {
    return res.status(404).json({
      message: 'Client unit not found',
    })
  }

  const result = await createClientDocumentChecklistFromListing(db, clientUnit)

  await safeCreateAuditLog({
    userId: req.user.id,
    action: 'create',
    module: 'Client Documents',
    description: `Created listing-based document checklist for client unit ${clientUnitId}`,
    ipAddress: getClientIp(req),
  })

  res.status(201).json({
    message:
      result.insertedCount > 0
        ? 'Document checklist created successfully'
        : 'No listing document requirements found or checklist already exists',
    data: {
      clientUnitId: Number(clientUnitId),
      insertedDocuments: result.insertedCount,
    },
  })
}

export const updateClientDocumentStatus = async (req, res) => {
  const { id } = req.params
  const { status, file_url } = req.body

  if (!allowedClientDocumentStatuses.includes(status)) {
    return res.status(400).json({
      message: 'Invalid document status',
    })
  }

  const [existingRows] = await db.query(
    `
    SELECT
      cdl.id,
      cdl.client_unit_id,
      cdl.document_id,
      cdl.file_url,
      cdl.storage_provider,
      cdl.cloudinary_asset_id,
      cdl.cloudinary_public_id,
      cdl.cloudinary_folder,
      cdl.cloudinary_resource_type,
      cdl.cloudinary_secure_url,
      cdl.drive_file_id,
      cdl.drive_folder_id,
      cdl.file_name,
      cdl.original_file_name,
      cdl.mime_type,
      cdl.file_size,
      cdl.web_view_link,
      cdl.uploaded_at,
      cdl.uploaded_by,
      uploader.full_name AS uploaded_by_name,
      cdl.status,
      d.name AS document_name
    FROM client_document_list cdl
    INNER JOIN documents d ON d.id = cdl.document_id
    WHERE cdl.id = ?
    LIMIT 1
    `,
    [id]
  )

  const existingDocument = existingRows[0]

  if (!existingDocument) {
    return res.status(404).json({
      message: 'Client document not found',
    })
  }

  if (!canTransitionClientDocumentStatus(existingDocument.status, status)) {
    return res.status(400).json({
      message: `Invalid document status transition from ${existingDocument.status} to ${status}. Submit the document before approving or rejecting it.`,
    })
  }

  const nextFileUrl =
    file_url !== undefined
      ? nullableValue(file_url)
      : existingDocument.file_url

  const connection = await db.getConnection()

  try {
    await connection.beginTransaction()

    await connection.query(
      `
      UPDATE client_document_list
      SET
        status = ?,
        file_url = ?,
        reviewed_by = ?,
        reviewed_at = CASE
          WHEN ? = 'not_submitted' THEN NULL
          ELSE NOW()
        END
      WHERE id = ?
      `,
      [
        status,
        nextFileUrl,
        status === 'not_submitted' ? null : req.user.id,
        status,
        id,
      ]
    )

    const eligibilitySummary = await refreshCommissionEligibility(
      existingDocument.client_unit_id,
      connection,
      { actorRole: req.user.role }
    )

    await connection.commit()

    await safeCreateAuditLog({
      userId: req.user.id,
      action: 'document_check',
      module: 'Client Documents',
      description: `Updated client document ${id} to ${status}`,
      ipAddress: getClientIp(req),
    })

    res.status(200).json({
      message: 'Client document updated successfully',
      data: {
        clientDocumentId: Number(id),
        client_unit_id: existingDocument.client_unit_id,
        eligibilitySummary,
      },
    })
  } catch (err) {
    await connection.rollback()
    throw err
  } finally {
    connection.release()
  }
}

export const applyExistingReusableDocuments = async (req, res) => {
  const { clientUnitId } = req.params

  const clientUnit = await getClientUnitById(clientUnitId)

  if (!clientUnit) {
    return res.status(404).json({
      message: 'Client unit not found',
    })
  }

  const connection = await db.getConnection()

  try {
    await connection.beginTransaction()

    const [result] = await connection.query(
      `
      UPDATE client_document_list target
      INNER JOIN documents target_document
        ON target_document.id = target.document_id
        AND target_document.can_reuse = TRUE
      INNER JOIN (
        SELECT
          source.document_id,
          CASE
            WHEN MAX(CASE WHEN source.status = 'approved' THEN 2 ELSE 1 END) = 2
            THEN 'approved'
            ELSE 'submitted'
          END AS source_status
        FROM client_document_list source
        INNER JOIN client_units source_unit
          ON source_unit.id = source.client_unit_id
        INNER JOIN documents source_document
          ON source_document.id = source.document_id
          AND source_document.can_reuse = TRUE
        WHERE source_unit.client_id = ?
          AND source_unit.id <> ?
          AND source.status IN ('submitted', 'approved')
        GROUP BY source.document_id
      ) reusable_source
        ON reusable_source.document_id = target.document_id
      SET
        target.status = CASE
          WHEN target.status = 'approved' THEN 'approved'
          WHEN target.status = 'submitted' THEN reusable_source.source_status
          ELSE 'submitted'
        END,
        target.reviewed_by = ?,
        target.reviewed_at = NOW()
      WHERE target.client_unit_id = ?
      `,
      [
        clientUnit.client_id,
        clientUnitId,
        req.user.id,
        clientUnitId,
      ]
    )

    const eligibilitySummary = await refreshCommissionEligibility(
      clientUnitId,
      connection,
      { actorRole: req.user.role }
    )

    await connection.commit()

    await safeCreateAuditLog({
      userId: req.user.id,
      action: 'document_check',
      module: 'Client Documents',
      description: `Applied reusable documents to client unit ${clientUnitId}`,
      ipAddress: getClientIp(req),
    })

    res.status(200).json({
      message: 'Reusable documents applied successfully',
      data: {
        clientUnitId: Number(clientUnitId),
        updatedDocuments: result.affectedRows,
        eligibilitySummary,
      },
    })
  } catch (err) {
    await connection.rollback()
    throw err
  } finally {
    connection.release()
  }
}


const allowedUploadMimeTypes = new Set([
  'image/jpeg',
  'image/png',
])

const getClientDocumentForFile = async (id, connectionOrDb = db) => {
  const [rows] = await connectionOrDb.query(
    `
    SELECT
      cdl.*,
      d.name AS document_name,
      cu.client_id,
      c.full_name AS client_name,
      l.unit_id,
      p.name AS project_name
    FROM client_document_list cdl
    JOIN documents d ON d.id = cdl.document_id
    JOIN client_units cu ON cu.id = cdl.client_unit_id
    JOIN clients c ON c.id = cu.client_id
    JOIN listings l ON l.id = cu.listing_id
    JOIN projects p ON p.id = l.project_id
    WHERE cdl.id = ?
    LIMIT 1
    `,
    [id]
  )

  return rows[0] || null
}

const getClientDocumentFiles = async (clientDocumentId, connectionOrDb = db) => {
  const [rows] = await connectionOrDb.query(
    `
    SELECT
      cdf.*,
      uploader.full_name AS uploaded_by_name
    FROM client_document_files cdf
    LEFT JOIN users uploader ON uploader.id = cdf.uploaded_by
    WHERE cdf.client_document_id = ?
      AND cdf.file_status = 'active'
    ORDER BY cdf.is_primary DESC, cdf.uploaded_at DESC, cdf.id DESC
    `,
    [clientDocumentId]
  )

  return rows
}

const getClientDocumentFileForOpen = async (fileId, connectionOrDb = db) => {
  const [rows] = await connectionOrDb.query(
    `
    SELECT
      cdf.*,
      d.name AS document_name,
      cu.client_id,
      c.full_name AS client_name,
      l.unit_id,
      p.name AS project_name
    FROM client_document_files cdf
    JOIN client_document_list cdl ON cdl.id = cdf.client_document_id
    JOIN documents d ON d.id = cdf.document_id
    JOIN client_units cu ON cu.id = cdf.client_unit_id
    JOIN clients c ON c.id = cu.client_id
    JOIN listings l ON l.id = cu.listing_id
    JOIN projects p ON p.id = l.project_id
    WHERE cdf.id = ?
      AND cdf.file_status = 'active'
    LIMIT 1
    `,
    [fileId]
  )

  return rows[0] || null
}

export const uploadClientDocumentFile = async (req, res) => {
  const { id } = req.params
  const files = getUploadedFilesFromRequest(req)

  if (files.length === 0) {
    return res.status(400).json({ message: 'At least one file is required' })
  }

  const invalidFile = files.find((file) => !allowedUploadMimeTypes.has(file.mimetype))

  if (invalidFile) {
    return res.status(400).json({
      message: 'Unsupported file type. Upload JPG or PNG images only.',
    })
  }

  if (!isCloudinaryConfigured()) {
    return sendCloudinaryNotConfigured(res)
  }

  const documentRow = await getClientDocumentForFile(id)
  if (!documentRow) {
    return res.status(404).json({ message: 'Client document not found' })
  }

  const folder = getClientDocumentFolder(documentRow)
  const uploadedFiles = []
  const connection = await db.getConnection()

  try {
    await connection.beginTransaction()

    await connection.query(
      `UPDATE client_document_files SET is_primary = 0 WHERE client_document_id = ?`,
      [id]
    )

    for (let index = 0; index < files.length; index += 1) {
      const file = files[index]
      const uploaded = await uploadBufferToCloudinary({
        buffer: file.buffer,
        fileName: file.originalname,
        mimeType: file.mimetype,
        folder,
      })

      const isPrimary = index === files.length - 1 ? 1 : 0
      const [insertResult] = await connection.query(
        `
        INSERT INTO client_document_files (
          client_document_id,
          client_unit_id,
          document_id,
          storage_provider,
          cloudinary_asset_id,
          cloudinary_public_id,
          cloudinary_folder,
          cloudinary_resource_type,
          cloudinary_secure_url,
          drive_file_id,
          drive_folder_id,
          file_name,
          original_file_name,
          mime_type,
          file_size,
          web_view_link,
          file_url,
          uploaded_by,
          is_primary,
          file_status
        ) VALUES (?, ?, ?, 'cloudinary', ?, ?, ?, ?, ?, NULL, NULL, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
        `,
        [
          id,
          documentRow.client_unit_id,
          documentRow.document_id,
          uploaded.asset_id || null,
          uploaded.public_id || null,
          folder,
          uploaded.resource_type || 'auto',
          uploaded.secure_url || null,
          uploaded.original_filename || file.originalname,
          file.originalname,
          file.mimetype,
          file.size,
          uploaded.secure_url || null,
          uploaded.secure_url || null,
          req.user.id,
          isPrimary,
        ]
      )

      uploadedFiles.push({
        id: insertResult.insertId,
        cloudinary_asset_id: uploaded.asset_id || null,
        cloudinary_public_id: uploaded.public_id || null,
        cloudinary_folder: folder,
        cloudinary_resource_type: uploaded.resource_type || 'auto',
        cloudinary_secure_url: uploaded.secure_url || null,
        file_name: uploaded.original_filename || file.originalname,
        original_file_name: file.originalname,
        mime_type: file.mimetype,
        file_size: file.size,
        web_view_link: uploaded.secure_url || null,
        file_url: uploaded.secure_url || null,
      })
    }

    const primaryFile = uploadedFiles[uploadedFiles.length - 1]
    const nextStatus = documentRow.status === 'not_submitted' ? 'submitted' : documentRow.status

    await connection.query(
      `
      UPDATE client_document_list
      SET
        storage_provider = 'cloudinary',
        cloudinary_asset_id = ?,
        cloudinary_public_id = ?,
        cloudinary_folder = ?,
        cloudinary_resource_type = ?,
        cloudinary_secure_url = ?,
        drive_file_id = NULL,
        drive_folder_id = NULL,
        file_name = ?,
        original_file_name = ?,
        mime_type = ?,
        file_size = ?,
        web_view_link = ?,
        file_url = ?,
        uploaded_at = NOW(),
        uploaded_by = ?,
        status = ?,
        reviewed_by = CASE WHEN ? = 'submitted' THEN ? ELSE reviewed_by END,
        reviewed_at = CASE WHEN ? = 'submitted' THEN NOW() ELSE reviewed_at END
      WHERE id = ?
      `,
      [
        primaryFile.cloudinary_asset_id,
        primaryFile.cloudinary_public_id,
        primaryFile.cloudinary_folder,
        primaryFile.cloudinary_resource_type,
        primaryFile.cloudinary_secure_url,
        primaryFile.file_name,
        primaryFile.original_file_name,
        primaryFile.mime_type,
        primaryFile.file_size,
        primaryFile.web_view_link,
        primaryFile.file_url,
        req.user.id,
        nextStatus,
        nextStatus,
        req.user.id,
        nextStatus,
        id,
      ]
    )

    const eligibilitySummary = await refreshCommissionEligibility(
      documentRow.client_unit_id,
      connection,
      { actorRole: req.user.role }
    )

    await connection.commit()

    await safeCreateAuditLog({
      userId: req.user.id,
      action: 'upload',
      module: 'Client Documents',
      description: `Uploaded ${uploadedFiles.length} file(s) for client document ${id}`,
      ipAddress: getClientIp(req),
    })

    const updatedDocument = await getClientDocumentForFile(id)
    const documentFiles = await getClientDocumentFiles(id)

    return res.status(200).json({
      message: uploadedFiles.length > 1
        ? 'Document files uploaded successfully'
        : 'Document file uploaded successfully',
      document: {
        ...updatedDocument,
        files: documentFiles,
        upload_count: documentFiles.length,
      },
      files: documentFiles,
      data: {
        ...updatedDocument,
        files: documentFiles,
        upload_count: documentFiles.length,
        eligibilitySummary,
      },
    })
  } catch (err) {
    await connection.rollback()
    throw err
  } finally {
    connection.release()
  }
}

export const openClientDocumentFile = async (req, res) => {
  const { id } = req.params
  const documentRow = await getClientDocumentForFile(id)

  if (!documentRow) {
    return res.status(404).json({ message: 'Client document not found' })
  }

  const [fileRows] = await db.query(
    `
    SELECT *
    FROM client_document_files
    WHERE client_document_id = ?
      AND file_status = 'active'
    ORDER BY is_primary DESC, uploaded_at DESC, id DESC
    LIMIT 1
    `,
    [id]
  )

  const latestFile = fileRows[0]
  const fileUrl = latestFile?.cloudinary_secure_url || latestFile?.file_url || latestFile?.web_view_link ||
    documentRow.cloudinary_secure_url || documentRow.file_url || documentRow.web_view_link

  if (!fileUrl) {
    return res.status(404).json({ message: 'Uploaded file not found' })
  }

  return sendRemoteFileInline({
    res,
    fileUrl,
    fileName: latestFile?.original_file_name || latestFile?.file_name || documentRow.original_file_name || documentRow.file_name || 'document',
    mimeType: latestFile?.mime_type || documentRow.mime_type,
  })
}

export const openClientDocumentUploadedFile = async (req, res) => {
  const { fileId } = req.params
  const fileRow = await getClientDocumentFileForOpen(fileId)

  if (!fileRow) {
    return res.status(404).json({ message: 'Uploaded file not found' })
  }

  const fileUrl = fileRow.cloudinary_secure_url || fileRow.file_url || fileRow.web_view_link

  if (!fileUrl) {
    return res.status(404).json({ message: 'Uploaded file not found' })
  }

  return sendRemoteFileInline({
    res,
    fileUrl,
    fileName: fileRow.original_file_name || fileRow.file_name || 'document',
    mimeType: fileRow.mime_type,
  })
}


export const deleteClientDocumentUploadedFile = async (req, res) => {
  const { fileId } = req.params
  const fileRow = await getClientDocumentFileForOpen(fileId)

  if (!fileRow) {
    return res.status(404).json({ message: 'Uploaded file not found' })
  }

  const connection = await db.getConnection()

  try {
    await connection.beginTransaction()

    await connection.query(
      `
      UPDATE client_document_files
      SET
        file_status = 'deleted',
        is_primary = 0
      WHERE id = ?
      `,
      [fileId]
    )

    const [remainingFiles] = await connection.query(
      `
      SELECT *
      FROM client_document_files
      WHERE client_document_id = ?
        AND file_status = 'active'
      ORDER BY uploaded_at DESC, id DESC
      LIMIT 1
      `,
      [fileRow.client_document_id]
    )

    const nextPrimaryFile = remainingFiles[0] || null

    await connection.query(
      `UPDATE client_document_files SET is_primary = 0 WHERE client_document_id = ?`,
      [fileRow.client_document_id]
    )

    if (nextPrimaryFile) {
      await connection.query(
        `UPDATE client_document_files SET is_primary = 1 WHERE id = ?`,
        [nextPrimaryFile.id]
      )

      await connection.query(
        `
        UPDATE client_document_list
        SET
          storage_provider = ?,
          cloudinary_asset_id = ?,
          cloudinary_public_id = ?,
          cloudinary_folder = ?,
          cloudinary_resource_type = ?,
          cloudinary_secure_url = ?,
          drive_file_id = ?,
          drive_folder_id = ?,
          file_name = ?,
          original_file_name = ?,
          mime_type = ?,
          file_size = ?,
          web_view_link = ?,
          file_url = ?,
          uploaded_at = ?,
          uploaded_by = ?
        WHERE id = ?
        `,
        [
          nextPrimaryFile.storage_provider || 'cloudinary',
          nextPrimaryFile.cloudinary_asset_id || null,
          nextPrimaryFile.cloudinary_public_id || null,
          nextPrimaryFile.cloudinary_folder || null,
          nextPrimaryFile.cloudinary_resource_type || null,
          nextPrimaryFile.cloudinary_secure_url || null,
          nextPrimaryFile.drive_file_id || null,
          nextPrimaryFile.drive_folder_id || null,
          nextPrimaryFile.file_name || null,
          nextPrimaryFile.original_file_name || null,
          nextPrimaryFile.mime_type || null,
          nextPrimaryFile.file_size || null,
          nextPrimaryFile.web_view_link || null,
          nextPrimaryFile.file_url || null,
          nextPrimaryFile.uploaded_at || null,
          nextPrimaryFile.uploaded_by || null,
          fileRow.client_document_id,
        ]
      )
    } else {
      await connection.query(
        `
        UPDATE client_document_list
        SET
          storage_provider = NULL,
          cloudinary_asset_id = NULL,
          cloudinary_public_id = NULL,
          cloudinary_folder = NULL,
          cloudinary_resource_type = NULL,
          cloudinary_secure_url = NULL,
          drive_file_id = NULL,
          drive_folder_id = NULL,
          file_name = NULL,
          original_file_name = NULL,
          mime_type = NULL,
          file_size = NULL,
          web_view_link = NULL,
          file_url = NULL,
          uploaded_at = NULL,
          uploaded_by = NULL,
          status = 'not_submitted',
          reviewed_by = NULL,
          reviewed_at = NULL
        WHERE id = ?
        `,
        [fileRow.client_document_id]
      )
    }

    const eligibilitySummary = await refreshCommissionEligibility(
      fileRow.client_unit_id,
      connection,
      { actorRole: req.user.role }
    )

    await connection.commit()

    if (fileRow.cloudinary_public_id) {
      deleteCloudinaryAsset({
        publicId: fileRow.cloudinary_public_id,
        resourceType: fileRow.cloudinary_resource_type || 'image',
      }).catch(() => undefined)
    }

    await safeCreateAuditLog({
      userId: req.user.id,
      action: 'delete',
      module: 'Client Documents',
      description: `Removed uploaded file ${fileId} from client document ${fileRow.client_document_id}`,
      ipAddress: getClientIp(req),
    })

    const documentFiles = await getClientDocumentFiles(fileRow.client_document_id)

    return res.status(200).json({
      message: 'Uploaded file removed successfully',
      files: documentFiles,
      data: {
        clientDocumentId: Number(fileRow.client_document_id),
        client_unit_id: fileRow.client_unit_id,
        upload_count: documentFiles.length,
        eligibilitySummary,
      },
    })
  } catch (err) {
    await connection.rollback()
    throw err
  } finally {
    connection.release()
  }
}

const getRemoteImageBuffer = async (fileUrl) => {
  if (!fileUrl) return null

  try {
    const fileResponse = await fetch(fileUrl)
    if (!fileResponse.ok) return null

    const arrayBuffer = await fileResponse.arrayBuffer()
    if (!arrayBuffer || arrayBuffer.byteLength === 0) return null

    return Buffer.from(arrayBuffer)
  } catch {
    return null
  }
}

const isJpegDocumentImage = (row) => {
  const mimeType = String(row.mime_type || '').toLowerCase()
  const fileName = String(row.original_file_name || row.file_name || '').toLowerCase()
  const fileUrl = String(row.cloudinary_secure_url || row.file_url || row.web_view_link || '').toLowerCase()

  return mimeType === 'image/jpeg' || mimeType === 'image/jpg' ||
    fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') ||
    fileUrl.includes('.jpg') || fileUrl.includes('.jpeg')
}

const isPngDocumentImage = (row) => {
  const mimeType = String(row.mime_type || '').toLowerCase()
  const fileName = String(row.original_file_name || row.file_name || '').toLowerCase()
  const fileUrl = String(row.cloudinary_secure_url || row.file_url || row.web_view_link || '').toLowerCase()

  return mimeType === 'image/png' || fileName.endsWith('.png') || fileUrl.includes('.png')
}

export const downloadClientUnitDocumentsPdf = async (req, res) => {
  const { clientUnitId } = req.params

  const [rows] = await db.query(
    `
    SELECT
      cdf.id,
      cdf.cloudinary_secure_url,
      cdf.file_url,
      cdf.web_view_link,
      cdf.file_name,
      cdf.original_file_name,
      cdf.mime_type,
      cdf.file_status AS status,
      d.name AS document_name,
      l.unit_id
    FROM client_document_files cdf
    JOIN documents d ON d.id = cdf.document_id
    JOIN client_units cu ON cu.id = cdf.client_unit_id
    JOIN listings l ON l.id = cu.listing_id
    WHERE cdf.client_unit_id = ?
      AND cdf.file_status = 'active'
      AND (cdf.cloudinary_secure_url IS NOT NULL OR cdf.file_url IS NOT NULL OR cdf.web_view_link IS NOT NULL)
      AND cdf.mime_type IN ('image/jpeg', 'image/png')
    ORDER BY cdf.client_document_id ASC, cdf.uploaded_at ASC, cdf.id ASC
    `,
    [clientUnitId]
  )

  if (rows.length === 0) {
    return res.status(400).json({ message: 'No uploaded JPG or PNG document images found for this client unit.' })
  }

  const pdf = await PDFDocument.create()
  const pageWidth = 595.28
  const pageHeight = 841.89
  const margin = 18
  let includedImageCount = 0

  for (const row of rows) {
    const fileUrl = row.cloudinary_secure_url || row.file_url || row.web_view_link
    const buffer = await getRemoteImageBuffer(fileUrl)

    if (!buffer) continue

    try {
      const image = isJpegDocumentImage(row)
        ? await pdf.embedJpg(buffer)
        : isPngDocumentImage(row)
          ? await pdf.embedPng(buffer)
          : null

      if (!image) continue

      const page = pdf.addPage([pageWidth, pageHeight])
      const scaled = image.scaleToFit(pageWidth - margin * 2, pageHeight - margin * 2)
      page.drawImage(image, {
        x: (pageWidth - scaled.width) / 2,
        y: (pageHeight - scaled.height) / 2,
        width: scaled.width,
        height: scaled.height,
      })
      includedImageCount += 1
    } catch {
      // Skip broken or mismatched image files instead of adding a blank/error page.
    }
  }

  if (includedImageCount === 0) {
    return res.status(400).json({ message: 'No accessible JPG or PNG document images could be included in the PDF.' })
  }

  const pdfBytes = await pdf.save()
  const unitId = rows[0]?.unit_id || clientUnitId
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="documents-${unitId}.pdf"`)
  res.send(Buffer.from(pdfBytes))
}

export const getClientUnitDocumentStatus = async (req, res) => {
  const { clientUnitId } = req.params

  const clientUnit = await getClientUnitById(clientUnitId)

  if (!clientUnit) {
    return res.status(404).json({
      message: 'Client unit not found',
    })
  }

  const [rows] = await db.query(
    `
    SELECT
      COUNT(d.id) AS total_documents,
      SUM(CASE WHEN COALESCE(cdl.is_required, d.is_required) = TRUE THEN 1 ELSE 0 END) AS required_documents,
      SUM(CASE WHEN cdl.status = 'not_submitted' THEN 1 ELSE 0 END) AS not_submitted_count,
      SUM(CASE WHEN cdl.status = 'submitted' THEN 1 ELSE 0 END) AS submitted_count,
      SUM(CASE WHEN cdl.status = 'approved' THEN 1 ELSE 0 END) AS approved_count,
      SUM(CASE WHEN cdl.status = 'rejected' THEN 1 ELSE 0 END) AS rejected_count,
      SUM(
        CASE
          WHEN COALESCE(cdl.is_required, d.is_required) = TRUE
            AND cdl.status IN ('submitted', 'approved')
          THEN 1
          ELSE 0
        END
      ) AS submitted_required_count
    FROM client_document_list cdl
    INNER JOIN documents d ON d.id = cdl.document_id
    WHERE cdl.client_unit_id = ?
    `,
    [clientUnitId]
  )

  const summary = rows[0] || {}

  const requiredDocuments = Number(summary.required_documents || 0)
  const submittedRequiredCount = Number(summary.submitted_required_count || 0)

  const documentStatus =
    requiredDocuments > 0 && submittedRequiredCount >= requiredDocuments
      ? 'complete'
      : 'incomplete'

  res.status(200).json({
    message: 'Client unit document status fetched successfully',
    status: documentStatus,
    summary: {
      total_documents: Number(summary.total_documents || 0),
      required_documents: requiredDocuments,
      not_submitted_count: Number(summary.not_submitted_count || 0),
      submitted_count: Number(summary.submitted_count || 0),
      approved_count: Number(summary.approved_count || 0),
      rejected_count: Number(summary.rejected_count || 0),
      submitted_required_count: submittedRequiredCount,
      document_status: documentStatus,
    },
    data: {
      total_documents: Number(summary.total_documents || 0),
      required_documents: requiredDocuments,
      not_submitted_count: Number(summary.not_submitted_count || 0),
      submitted_count: Number(summary.submitted_count || 0),
      approved_count: Number(summary.approved_count || 0),
      rejected_count: Number(summary.rejected_count || 0),
      submitted_required_count: submittedRequiredCount,
      document_status: documentStatus,
    },
  })
}


export const deleteDocument = async (req, res) => {
  const { id } = req.params

  const [documentRows] = await db.query(
    `SELECT id, name FROM documents WHERE id = ? LIMIT 1`,
    [id]
  )

  const document = documentRows[0]

  if (!document) {
    return res.status(404).json({ message: 'Document not found' })
  }

  const connection = await db.getConnection()

  try {
    await connection.beginTransaction()

    await connection.query(`DELETE FROM document_template_items WHERE document_id = ?`, [id])
    await connection.query(`DELETE FROM project_document_requirements WHERE document_id = ?`, [id])
    await connection.query(`DELETE FROM listing_document_requirements WHERE document_id = ?`, [id])

    const [clientDocumentRows] = await connection.query(
      `SELECT id FROM client_document_list WHERE document_id = ? LIMIT 1`,
      [id]
    )

    let message = 'Document deleted successfully'
    let action = 'delete'

    if (clientDocumentRows.length > 0) {
      await connection.query(`UPDATE documents SET status = 'inactive' WHERE id = ?`, [id])
      message = 'Document is used by existing client records, so it was removed from active lists instead of hard-deleted'
      action = 'delete_requested'
    } else {
      await connection.query(`DELETE FROM documents WHERE id = ?`, [id])
    }

    await connection.commit()

    await safeCreateAuditLog({
      userId: req.user.id,
      action,
      module: 'Documents',
      description: `${message}: ${document.name}`,
      ipAddress: getClientIp(req)
    })

    res.status(200).json({ message })
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}
