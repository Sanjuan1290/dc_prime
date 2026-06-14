const isMissing = (value) => value === undefined || value === null || value === ''

export const booleanValue = (value, defaultValue = false) => {
  if (isMissing(value)) return defaultValue ? 1 : 0
  if (typeof value === 'boolean') return value ? 1 : 0
  if (typeof value === 'number') return value === 1 ? 1 : 0
  const normalized = String(value).trim().toLowerCase()
  return ['1', 'true', 'yes', 'required'].includes(normalized) ? 1 : 0
}

export const nullableValue = (value) => (isMissing(value) ? null : value)

export const normalizeRequirementPayload = (requirements = []) => {
  if (!Array.isArray(requirements)) return []

  return requirements
    .map((item, index) => ({
      document_id: item.document_id ? Number(item.document_id) : null,
      name: String(item.name || '').trim(),
      description: nullableValue(item.description),
      can_reuse: booleanValue(item.can_reuse, false),
      is_required: booleanValue(item.is_required, true),
      status: item.status || 'active',
      sort_order: Number.isFinite(Number(item.sort_order))
        ? Number(item.sort_order)
        : index + 1,
      source: item.source || item.requirement_source || 'manual',
    }))
    .filter((item) => item.document_id || item.name)
}

export const ensureDocument = async (connectionOrDb, item) => {
  if (item.document_id) {
    const [rows] = await connectionOrDb.query(
      `SELECT id, name, description, can_reuse, status FROM documents WHERE id = ? LIMIT 1`,
      [item.document_id]
    )

    if (rows[0]) return rows[0]
  }

  if (!item.name) return null

  const [existingRows] = await connectionOrDb.query(
    `SELECT id, name, description, can_reuse, status FROM documents WHERE LOWER(name) = LOWER(?) LIMIT 1`,
    [item.name]
  )

  if (existingRows[0]) return existingRows[0]

  const [result] = await connectionOrDb.query(
    `
    INSERT INTO documents (
      name,
      description,
      is_required,
      can_reuse,
      status
    ) VALUES (?, ?, 0, ?, ?)
    `,
    [item.name, nullableValue(item.description), booleanValue(item.can_reuse), item.status || 'active']
  )

  return {
    id: result.insertId,
    name: item.name,
    description: nullableValue(item.description),
    can_reuse: booleanValue(item.can_reuse),
    status: item.status || 'active',
  }
}

export const getProjectDocumentRequirements = async (connectionOrDb, projectId) => {
  const [rows] = await connectionOrDb.query(
    `
    SELECT
      pdr.id,
      pdr.project_id,
      pdr.document_id,
      d.name,
      d.description,
      d.can_reuse,
      pdr.is_required,
      pdr.status,
      pdr.sort_order,
      pdr.created_at,
      pdr.updated_at
    FROM project_document_requirements pdr
    INNER JOIN documents d ON d.id = pdr.document_id
    WHERE pdr.project_id = ?
    ORDER BY pdr.sort_order ASC, pdr.id ASC
    `,
    [projectId]
  )

  return rows
}

export const replaceProjectDocumentRequirements = async (
  connectionOrDb,
  projectId,
  requirements = []
) => {
  const normalized = normalizeRequirementPayload(requirements)

  await connectionOrDb.query(
    `DELETE FROM project_document_requirements WHERE project_id = ?`,
    [projectId]
  )

  let insertedCount = 0

  for (const item of normalized) {
    const document = await ensureDocument(connectionOrDb, item)
    if (!document) continue

    await connectionOrDb.query(
      `
      INSERT INTO project_document_requirements (
        project_id,
        document_id,
        is_required,
        status,
        sort_order
      ) VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        is_required = VALUES(is_required),
        status = VALUES(status),
        sort_order = VALUES(sort_order)
      `,
      [
        projectId,
        document.id,
        booleanValue(item.is_required, true),
        item.status || 'active',
        item.sort_order || insertedCount + 1,
      ]
    )

    insertedCount += 1
  }

  return { insertedCount }
}

export const getListingDocumentRequirements = async (connectionOrDb, listingId) => {
  const [rows] = await connectionOrDb.query(
    `
    SELECT
      ldr.id,
      ldr.listing_id,
      ldr.document_id,
      d.name,
      d.description,
      d.can_reuse,
      ldr.is_required,
      ldr.status,
      ldr.sort_order,
      ldr.source,
      ldr.created_at,
      ldr.updated_at
    FROM listing_document_requirements ldr
    INNER JOIN documents d ON d.id = ldr.document_id
    WHERE ldr.listing_id = ?
    ORDER BY ldr.sort_order ASC, ldr.id ASC
    `,
    [listingId]
  )

  return rows
}

export const replaceListingDocumentRequirements = async (
  connectionOrDb,
  listingId,
  requirements = [],
  source = 'listing_override'
) => {
  const normalized = normalizeRequirementPayload(requirements)

  await connectionOrDb.query(
    `DELETE FROM listing_document_requirements WHERE listing_id = ?`,
    [listingId]
  )

  let insertedCount = 0

  for (const item of normalized) {
    const document = await ensureDocument(connectionOrDb, item)
    if (!document) continue

    await connectionOrDb.query(
      `
      INSERT INTO listing_document_requirements (
        listing_id,
        document_id,
        is_required,
        status,
        sort_order,
        source
      ) VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        is_required = VALUES(is_required),
        status = VALUES(status),
        sort_order = VALUES(sort_order),
        source = VALUES(source)
      `,
      [
        listingId,
        document.id,
        booleanValue(item.is_required, true),
        item.status || 'active',
        item.sort_order || insertedCount + 1,
        source || item.source || 'listing_override',
      ]
    )

    insertedCount += 1
  }

  return { insertedCount }
}

export const copyProjectRequirementsToListing = async (
  connectionOrDb,
  listingId,
  projectId,
  { overwrite = false } = {}
) => {
  if (overwrite) {
    await connectionOrDb.query(
      `DELETE FROM listing_document_requirements WHERE listing_id = ?`,
      [listingId]
    )
  }

  const [existingRows] = await connectionOrDb.query(
    `SELECT COUNT(*) AS count FROM listing_document_requirements WHERE listing_id = ?`,
    [listingId]
  )

  if (!overwrite && Number(existingRows[0]?.count || 0) > 0) {
    return { insertedCount: 0, skipped: true }
  }

  const [result] = await connectionOrDb.query(
    `
    INSERT INTO listing_document_requirements (
      listing_id,
      document_id,
      is_required,
      status,
      sort_order,
      source
    )
    SELECT
      ? AS listing_id,
      pdr.document_id,
      pdr.is_required,
      pdr.status,
      pdr.sort_order,
      'project_default' AS source
    FROM project_document_requirements pdr
    INNER JOIN documents d ON d.id = pdr.document_id
    WHERE pdr.project_id = ?
      AND pdr.status = 'active'
      AND d.status = 'active'
    ORDER BY pdr.sort_order ASC, pdr.id ASC
    ON DUPLICATE KEY UPDATE
      is_required = VALUES(is_required),
      status = VALUES(status),
      sort_order = VALUES(sort_order),
      source = VALUES(source)
    `,
    [listingId, projectId]
  )

  return { insertedCount: result.affectedRows, skipped: false }
}

export const createClientDocumentChecklistFromListing = async (
  connectionOrDb,
  clientUnit
) => {
  if (!clientUnit?.id || !clientUnit?.listing_id) {
    return { insertedCount: 0 }
  }

  let [requirements] = await connectionOrDb.query(
    `
    SELECT
      ldr.document_id,
      ldr.is_required,
      ldr.source
    FROM listing_document_requirements ldr
    INNER JOIN documents d ON d.id = ldr.document_id
    WHERE ldr.listing_id = ?
      AND ldr.status = 'active'
      AND d.status = 'active'
    ORDER BY ldr.sort_order ASC, ldr.id ASC
    `,
    [clientUnit.listing_id]
  )

  if (requirements.length === 0) {
    const [listingRows] = await connectionOrDb.query(
      `SELECT id, project_id FROM listings WHERE id = ? LIMIT 1`,
      [clientUnit.listing_id]
    )

    const listing = listingRows[0]

    if (listing?.project_id) {
      await copyProjectRequirementsToListing(
        connectionOrDb,
        clientUnit.listing_id,
        listing.project_id,
        { overwrite: false }
      )

      ;[requirements] = await connectionOrDb.query(
        `
        SELECT
          ldr.document_id,
          ldr.is_required,
          ldr.source
        FROM listing_document_requirements ldr
        INNER JOIN documents d ON d.id = ldr.document_id
        WHERE ldr.listing_id = ?
          AND ldr.status = 'active'
          AND d.status = 'active'
        ORDER BY ldr.sort_order ASC, ldr.id ASC
        `,
        [clientUnit.listing_id]
      )
    }
  }

  if (requirements.length === 0) {
    return { insertedCount: 0 }
  }

  const values = requirements.map((requirement) => [
    clientUnit.id,
    requirement.document_id,
    booleanValue(requirement.is_required, true),
    requirement.source || 'listing_snapshot',
    'not_submitted',
  ])

  const [result] = await connectionOrDb.query(
    `
    INSERT IGNORE INTO client_document_list (
      client_unit_id,
      document_id,
      is_required,
      requirement_source,
      status
    ) VALUES ?
    `,
    [values]
  )

  return { insertedCount: result.affectedRows }
}


export const ensureClientDocumentChecklistForClientUnit = async (
  connectionOrDb,
  clientUnitId
) => {
  if (isMissing(clientUnitId)) return { insertedCount: 0 }

  const [clientUnitRows] = await connectionOrDb.query(
    `SELECT id, listing_id FROM client_units WHERE id = ? LIMIT 1`,
    [clientUnitId]
  )

  const clientUnit = clientUnitRows[0]

  if (!clientUnit) return { insertedCount: 0 }

  return createClientDocumentChecklistFromListing(connectionOrDb, clientUnit)
}

export const ensureClientDocumentChecklistsForClient = async (
  connectionOrDb,
  clientId
) => {
  if (isMissing(clientId)) return { insertedCount: 0 }

  const [clientUnitRows] = await connectionOrDb.query(
    `SELECT id, listing_id FROM client_units WHERE client_id = ?`,
    [clientId]
  )

  let insertedCount = 0

  for (const clientUnit of clientUnitRows) {
    const result = await createClientDocumentChecklistFromListing(
      connectionOrDb,
      clientUnit
    )
    insertedCount += Number(result.insertedCount || 0)
  }

  return { insertedCount }
}

export const getDocumentTemplateItems = async (connectionOrDb, templateId) => {
  const [rows] = await connectionOrDb.query(
    `
    SELECT
      dti.id,
      dti.template_id,
      dti.document_id,
      d.name,
      d.description,
      d.can_reuse,
      dti.is_required,
      dti.status,
      dti.sort_order,
      dti.created_at,
      dti.updated_at
    FROM document_template_items dti
    INNER JOIN documents d ON d.id = dti.document_id
    WHERE dti.template_id = ?
    ORDER BY dti.sort_order ASC, dti.id ASC
    `,
    [templateId]
  )

  return rows
}

export const replaceDocumentTemplateItems = async (
  connectionOrDb,
  templateId,
  requirements = []
) => {
  const normalized = normalizeRequirementPayload(requirements)

  await connectionOrDb.query(
    `DELETE FROM document_template_items WHERE template_id = ?`,
    [templateId]
  )

  let insertedCount = 0

  for (const item of normalized) {
    const document = await ensureDocument(connectionOrDb, {
      ...item,
      can_reuse: true,
      status: item.status || 'active',
    })
    if (!document) continue

    await connectionOrDb.query(
      `
      INSERT INTO document_template_items (
        template_id,
        document_id,
        is_required,
        status,
        sort_order
      ) VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        is_required = VALUES(is_required),
        status = VALUES(status),
        sort_order = VALUES(sort_order)
      `,
      [
        templateId,
        document.id,
        booleanValue(item.is_required, true),
        item.status || 'active',
        item.sort_order || insertedCount + 1,
      ]
    )

    insertedCount += 1
  }

  return { insertedCount }
}

export const getDocumentTemplates = async (connectionOrDb) => {
  const [templates] = await connectionOrDb.query(
    `
    SELECT
      dt.id,
      dt.name,
      dt.description,
      dt.status,
      dt.created_by,
      creator.full_name AS created_by_name,
      COALESCE(summary.document_count, 0) AS document_count,
      COALESCE(summary.required_count, 0) AS required_document_count,
      dt.created_at,
      dt.updated_at
    FROM document_templates dt
    LEFT JOIN users creator ON creator.id = dt.created_by
    LEFT JOIN (
      SELECT
        template_id,
        COUNT(*) AS document_count,
        SUM(CASE WHEN is_required = TRUE THEN 1 ELSE 0 END) AS required_count
      FROM document_template_items
      WHERE status = 'active'
      GROUP BY template_id
    ) summary ON summary.template_id = dt.id
    ORDER BY dt.id DESC
    `
  )

  const hydrated = []

  for (const template of templates) {
    const items = await getDocumentTemplateItems(connectionOrDb, template.id)
    hydrated.push({
      ...template,
      items,
      document_requirements: items,
      documentRequirements: items,
    })
  }

  return hydrated
}



