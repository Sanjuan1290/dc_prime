import { db } from '../db/connect.js'
import { createAuditLog } from '../utils/createAuditLog.js'
import { getClientIp } from '../utils/getClientIp.js'
import { refreshCommissionEligibility } from './commissions.controller.js'

const allowedClientDocumentStatuses = [
  'not_submitted',
  'submitted',
  'approved',
  'rejected',
]

const isMissing = (value) => {
  return value === undefined || value === null || value === ''
}

const nullableValue = (value) => {
  if (isMissing(value)) return null
  return value
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

  await createAuditLog({
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

  await createAuditLog({
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
      d.is_required,
      d.can_reuse,
      cdl.file_url,
      cdl.status,
      cdl.reviewed_by,
      reviewer.full_name AS reviewed_by_name,
      cdl.reviewed_at,
      cdl.created_at,
      cdl.updated_at
    FROM client_document_list cdl
    INNER JOIN documents d ON d.id = cdl.document_id
    LEFT JOIN users reviewer ON reviewer.id = cdl.reviewed_by
    WHERE cdl.client_unit_id = ?
    ORDER BY d.id ASC
    `,
    [clientUnitId]
  )

  res.status(200).json({
    message: 'Client unit documents fetched successfully',
    documents,
    clientDocuments: documents,
    data: documents,
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

  const [documents] = await db.query(
    `
    SELECT id
    FROM documents
    WHERE status = 'active'
      AND is_required = TRUE
    ORDER BY id ASC
    `
  )

  if (documents.length === 0) {
    return res.status(200).json({
      message: 'No required documents found',
      data: {
        clientUnitId: Number(clientUnitId),
        insertedDocuments: 0,
      },
    })
  }

  const values = documents.map((document) => [
    clientUnitId,
    document.id,
    'not_submitted',
  ])

  const [result] = await db.query(
    `
    INSERT IGNORE INTO client_document_list (
      client_unit_id,
      document_id,
      status
    ) VALUES ?
    `,
    [values]
  )

  await createAuditLog({
    userId: req.user.id,
    action: 'create',
    module: 'Client Documents',
    description: `Created document checklist for client unit ${clientUnitId}`,
    ipAddress: getClientIp(req),
  })

  res.status(201).json({
    message: 'Document checklist created successfully',
    data: {
      clientUnitId: Number(clientUnitId),
      insertedDocuments: result.affectedRows,
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
      connection
    )

    await connection.commit()

    await createAuditLog({
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
        target.status = reusable_source.source_status,
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
      connection
    )

    await connection.commit()

    await createAuditLog({
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
      SUM(CASE WHEN d.is_required = TRUE THEN 1 ELSE 0 END) AS required_documents,
      SUM(CASE WHEN cdl.status = 'not_submitted' THEN 1 ELSE 0 END) AS not_submitted_count,
      SUM(CASE WHEN cdl.status = 'submitted' THEN 1 ELSE 0 END) AS submitted_count,
      SUM(CASE WHEN cdl.status = 'approved' THEN 1 ELSE 0 END) AS approved_count,
      SUM(CASE WHEN cdl.status = 'rejected' THEN 1 ELSE 0 END) AS rejected_count,
      SUM(
        CASE
          WHEN d.is_required = TRUE
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

  const [usageRows] = await db.query(
    `SELECT id FROM client_document_list WHERE document_id = ? LIMIT 1`,
    [id]
  )

  if (usageRows.length > 0) {
    return res.status(400).json({
      message: 'Cannot delete a document that is already in use. Set it to inactive instead.'
    })
  }

  await db.query(`DELETE FROM documents WHERE id = ?`, [id])

  await createAuditLog({
    userId: req.user.id,
    action: 'delete',
    module: 'Documents',
    description: `Deleted document ${document.name}`,
    ipAddress: getClientIp(req)
  })

  res.status(200).json({ message: 'Document deleted successfully' })
}
