import { db } from '../db/connect.js'
import { createAuditLog } from '../utils/createAuditLog.js'

const allowedClientDocumentStatuses = [
  'not_submitted',
  'submitted',
  'approved',
  'rejected'
]

const isMissing = (value) => {
  return value === undefined || value === null || value === ''
}

const nullableValue = (value) => {
  if (isMissing(value)) {
    return null
  }

  return value
}

const booleanValue = (value, defaultValue = false) => {
  if (isMissing(value)) {
    return defaultValue ? 1 : 0
  }

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

const getClientUnitById = async (clientUnitId) => {
  const [rows] = await db.query(
    `
    SELECT
      id,
      client_id,
      listing_id
    FROM client_units
    WHERE id = ?
    LIMIT 1
    `,
    [clientUnitId]
  )

  return rows[0]
}

export const getDocuments = async (req, res) => {
  const {
    search,
    status,
    is_required,
    can_reuse
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

  if (!isMissing(status)) {
    conditions.push('status = ?')
    params.push(status)
  }

  if (!isMissing(is_required)) {
    conditions.push('is_required = ?')
    params.push(booleanValue(is_required))
  }

  if (!isMissing(can_reuse)) {
    conditions.push('can_reuse = ?')
    params.push(booleanValue(can_reuse))
  }

  const whereClause = conditions.length > 0
    ? `WHERE ${conditions.join(' AND ')}`
    : ''

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
    documents
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
      message: 'Document not found'
    })
  }

  res.status(200).json({
    document
  })
}

export const createDocument = async (req, res) => {
  const {
    name,
    description,
    is_required,
    can_reuse,
    status
  } = req.body

  if (isMissing(name)) {
    return res.status(400).json({
      message: 'Document name is required'
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
      booleanValue(is_required),
      booleanValue(can_reuse),
      status || 'active'
    ]
  )

  await createAuditLog({
    userId: req.user.id,
    action: 'create',
    module: 'Documents',
    description: `Created document ${name}`,
    ipAddress: req.ip
  })

  res.status(201).json({
    message: 'Document created successfully',
    documentId: result.insertId
  })
}

export const updateDocument = async (req, res) => {
  const { id } = req.params
  const {
    name,
    description,
    is_required,
    can_reuse,
    status
  } = req.body

  if (isMissing(name)) {
    return res.status(400).json({
      message: 'Document name is required'
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
      id
    ]
  )

  if (result.affectedRows === 0) {
    return res.status(404).json({
      message: 'Document not found'
    })
  }

  await createAuditLog({
    userId: req.user.id,
    action: 'update',
    module: 'Documents',
    description: `Updated document ${name}`,
    ipAddress: req.ip
  })

  res.status(200).json({
    message: 'Document updated successfully'
  })
}

export const getClientUnitDocuments = async (req, res) => {
  const { clientUnitId } = req.params
  const clientUnit = await getClientUnitById(clientUnitId)

  if (!clientUnit) {
    return res.status(404).json({
      message: 'Client unit not found'
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
      d.is_required,
      d.can_reuse,
      cdl.file_url,
      cdl.status,
      cdl.reviewed_by,
      u.full_name AS reviewed_by_name,
      cdl.reviewed_at,
      cdl.created_at,
      cdl.updated_at
    FROM client_document_list cdl
    INNER JOIN documents d ON d.id = cdl.document_id
    LEFT JOIN users u ON u.id = cdl.reviewed_by
    WHERE cdl.client_unit_id = ?
    ORDER BY d.id ASC
    `,
    [clientUnitId]
  )

  res.status(200).json({
    documents
  })
}

export const createChecklistForClientUnit = async (req, res) => {
  const { clientUnitId } = req.params
  const clientUnit = await getClientUnitById(clientUnitId)

  if (!clientUnit) {
    return res.status(404).json({
      message: 'Client unit not found'
    })
  }

  await db.query(
    `
    INSERT IGNORE INTO client_document_list (
      client_unit_id,
      document_id,
      file_url,
      status,
      reviewed_by,
      reviewed_at
    )
    SELECT
      ?,
      id,
      NULL,
      'not_submitted',
      NULL,
      NULL
    FROM documents
    WHERE status = ?
    `,
    [clientUnitId, 'active']
  )

  await createAuditLog({
    userId: req.user.id,
    action: 'create',
    module: 'Client Documents',
    description: `Created document checklist for client unit ${clientUnitId}`,
    ipAddress: req.ip
  })

  res.status(200).json({
    message: 'Document checklist created successfully'
  })
}

export const updateClientDocumentStatus = async (req, res) => {
  const { id } = req.params
  const {
    status,
    file_url
  } = req.body

  if (isMissing(status)) {
    return res.status(400).json({
      message: 'Status is required'
    })
  }

  if (!allowedClientDocumentStatuses.includes(status)) {
    return res.status(400).json({
      message: 'Invalid client document status'
    })
  }

  const [rows] = await db.query(
    `
    SELECT
      id,
      file_url
    FROM client_document_list
    WHERE id = ?
    LIMIT 1
    `,
    [id]
  )

  const clientDocument = rows[0]

  if (!clientDocument) {
    return res.status(404).json({
      message: 'Client document not found'
    })
  }

  const nextFileUrl = Object.prototype.hasOwnProperty.call(req.body, 'file_url')
    ? nullableValue(file_url)
    : clientDocument.file_url

  await db.query(
    `
    UPDATE client_document_list
    SET
      status = ?,
      file_url = ?,
      reviewed_by = ?,
      reviewed_at = CASE WHEN ? = 'not_submitted' THEN NULL ELSE NOW() END
    WHERE id = ?
    `,
    [
      status,
      nextFileUrl,
      status === 'not_submitted' ? null : req.user.id,
      status,
      id
    ]
  )

  await createAuditLog({
    userId: req.user.id,
    action: 'document_check',
    module: 'Client Documents',
    description: `Updated client document ${id} to ${status}`,
    ipAddress: req.ip
  })

  res.status(200).json({
    message: 'Client document updated successfully'
  })
}

export const applyExistingReusableDocuments = async (req, res) => {
  const { clientUnitId } = req.params
  const clientUnit = await getClientUnitById(clientUnitId)

  if (!clientUnit) {
    return res.status(404).json({
      message: 'Client unit not found'
    })
  }

  await db.query(
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
      target.status = reusable_source.source_status,
      target.reviewed_by = ?,
      target.reviewed_at = NOW()
    WHERE target.client_unit_id = ?
    `,
    [
      clientUnit.client_id,
      clientUnitId,
      req.user.id,
      clientUnitId
    ]
  )

  await createAuditLog({
    userId: req.user.id,
    action: 'document_check',
    module: 'Client Documents',
    description: `Applied reusable documents to client unit ${clientUnitId}`,
    ipAddress: req.ip
  })

  res.status(200).json({
    message: 'Reusable documents applied successfully'
  })
}

export const getClientUnitDocumentStatus = async (req, res) => {
  const { clientUnitId } = req.params
  const clientUnit = await getClientUnitById(clientUnitId)

  if (!clientUnit) {
    return res.status(404).json({
      message: 'Client unit not found'
    })
  }

  const [rows] = await db.query(
    `
    SELECT
      COUNT(d.id) AS required_count,
      COALESCE(SUM(
        CASE
          WHEN cdl.status IN ('submitted', 'approved') THEN 1
          ELSE 0
        END
      ), 0) AS submitted_required_count
    FROM documents d
    LEFT JOIN client_document_list cdl
      ON cdl.document_id = d.id
      AND cdl.client_unit_id = ?
    WHERE d.is_required = TRUE
      AND d.status = ?
    `,
    [clientUnitId, 'active']
  )

  const counts = rows[0]
  const requiredCount = Number(counts.required_count)
  const submittedRequiredCount = Number(counts.submitted_required_count)
  const missingRequiredCount = requiredCount - submittedRequiredCount
  const documentStatus = requiredCount > 0 && submittedRequiredCount === requiredCount
    ? 'complete'
    : 'incomplete'

  res.status(200).json({
    documentStatus,
    requiredCount,
    submittedRequiredCount,
    missingRequiredCount
  })
}
