import { db } from '../db/connect.js'
import { createAuditLog } from '../utils/createAuditLog.js'
import { getClientIp } from '../utils/getClientIp.js'

const allowedClientUnitStatuses = [
  'reserved',
  'active',
  'cancelled',
  'fully_paid',
  'closed',
]

const isMissing = (value) => {
  return value === undefined || value === null || value === ''
}

const nullableValue = (value) => {
  if (isMissing(value)) return null
  return value
}

const validateDueDay = (dueDay) => {
  if (isMissing(dueDay)) {
    return {
      isValid: true,
      value: null,
    }
  }

  const parsedDueDay = Number(dueDay)

  return {
    isValid:
      Number.isInteger(parsedDueDay) &&
      parsedDueDay >= 1 &&
      parsedDueDay <= 31,
    value: parsedDueDay,
  }
}

const listingStatusFromClientUnitStatus = (status) => {
  if (status === 'cancelled') {
    return 'available'
  }

  if (status === 'reserved') {
    return 'reserved'
  }

  if (status === 'active' || status === 'fully_paid' || status === 'closed') {
    return 'sold'
  }

  return null
}

const validateSeller = async (connection, sellerId) => {
  if (isMissing(sellerId)) {
    return {
      isValid: true,
      message: null,
    }
  }

  const [sellerRows] = await connection.query(
    `
    SELECT id
    FROM accredited_sellers
    WHERE id = ?
      AND status = 'active'
    LIMIT 1
    `,
    [sellerId]
  )

  if (!sellerRows[0]) {
    return {
      isValid: false,
      message: 'Seller not found or inactive',
    }
  }

  return {
    isValid: true,
    message: null,
  }
}

const clientUnitFields = `
  cu.id,
  cu.client_id,
  c.full_name AS client_name,
  cu.listing_id,
  l.unit_id,
  p.name AS project_name,
  l.lot_type,
  l.lot_area_sqm,
  l.net_selling_price,
  l.legal_misc_fee,
  l.total_contract_price,
  COALESCE(payment_summary.paid_amount, 0) AS paid_amount,
  cu.balance,
  cu.due_day,
  cu.status,
  cu.assigned_user_id,
  u.full_name AS assigned_user_name,
  cu.seller_id,
  seller.full_name AS seller_name,
  seller.seller_role AS seller_role,
  COALESCE(parent_seller.full_name, seller.custom_reports_under, 'None') AS reports_under,
  CASE
    WHEN COALESCE(document_summary.required_count, 0) > 0
      AND COALESCE(document_summary.submitted_count, 0) = document_summary.required_count
    THEN 'complete'
    ELSE 'incomplete'
  END AS document_status,
  cu.created_at,
  cu.updated_at
`

const clientUnitJoins = `
  FROM client_units cu
  INNER JOIN clients c ON c.id = cu.client_id
  INNER JOIN listings l ON l.id = cu.listing_id
  INNER JOIN projects p ON p.id = l.project_id
  LEFT JOIN users u ON u.id = cu.assigned_user_id
  LEFT JOIN accredited_sellers seller ON seller.id = cu.seller_id
  LEFT JOIN accredited_sellers parent_seller ON parent_seller.id = seller.parent_seller_id
  LEFT JOIN (
    SELECT
      client_unit_id,
      SUM(amount) AS paid_amount
    FROM payments
    WHERE status = 'verified'
    GROUP BY client_unit_id
  ) payment_summary ON payment_summary.client_unit_id = cu.id
  LEFT JOIN (
    SELECT
      cu_docs.id AS client_unit_id,
      COUNT(d.id) AS required_count,
      SUM(
        CASE
          WHEN cdl.status IN ('submitted', 'approved') THEN 1
          ELSE 0
        END
      ) AS submitted_count
    FROM client_units cu_docs
    LEFT JOIN documents d
      ON d.is_required = TRUE
      AND d.status = 'active'
    LEFT JOIN client_document_list cdl
      ON cdl.client_unit_id = cu_docs.id
      AND cdl.document_id = d.id
    GROUP BY cu_docs.id
  ) document_summary ON document_summary.client_unit_id = cu.id
`

const getClientUnitsForWhereClause = async (whereClause = '', params = []) => {
  const [clientUnits] = await db.query(
    `
    SELECT
      ${clientUnitFields}
    ${clientUnitJoins}
    ${whereClause}
    ORDER BY cu.id DESC
    `,
    params
  )

  return clientUnits
}

export const getClientUnits = async (req, res) => {
  const { search, status, client_id } = req.query

  const conditions = []
  const params = []

  if (!isMissing(search)) {
    const searchTerm = `%${search}%`

    conditions.push(`
      (
        c.full_name LIKE ?
        OR l.unit_id LIKE ?
        OR p.name LIKE ?
        OR cu.status LIKE ?
        OR seller.full_name LIKE ?
        OR seller.seller_role LIKE ?
        OR parent_seller.full_name LIKE ?
        OR seller.custom_reports_under LIKE ?
      )
    `)

    params.push(
      searchTerm,
      searchTerm,
      searchTerm,
      searchTerm,
      searchTerm,
      searchTerm,
      searchTerm,
      searchTerm
    )
  }

  if (!isMissing(status)) {
    conditions.push('cu.status = ?')
    params.push(status)
  }

  if (!isMissing(client_id)) {
    conditions.push('cu.client_id = ?')
    params.push(client_id)
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const clientUnits = await getClientUnitsForWhereClause(whereClause, params)

  res.status(200).json({
    clientUnits,
  })
}

export const getClientUnitsByClient = async (req, res) => {
  const { clientId } = req.params

  if (isMissing(clientId)) {
    return res.status(400).json({
      message: 'Client ID is required',
    })
  }

  const [clientRows] = await db.query(
    `
    SELECT
      c.id,
      c.full_name,
      c.spouse_co_owner_name,
      c.email,
      c.contact_no,
      c.address,
      c.region,
      c.default_seller_id,
      seller.full_name AS default_seller_name,
      seller.seller_role AS default_seller_role
    FROM clients c
    LEFT JOIN accredited_sellers seller
      ON seller.id = c.default_seller_id
    WHERE c.id = ?
    LIMIT 1
    `,
    [clientId]
  )

  const client = clientRows[0]

  if (!client) {
    return res.status(404).json({
      message: 'Client not found',
    })
  }

  const units = await getClientUnitsForWhereClause(
    'WHERE cu.client_id = ?',
    [clientId]
  )

  res.status(200).json({
    client,
    units,
  })
}

export const getClientUnit = async (req, res) => {
  const { id } = req.params

  const [rows] = await db.query(
    `
    SELECT
      ${clientUnitFields}
    ${clientUnitJoins}
    WHERE cu.id = ?
    LIMIT 1
    `,
    [id]
  )

  const clientUnit = rows[0]

  if (!clientUnit) {
    return res.status(404).json({
      message: 'Client unit not found',
    })
  }

  res.status(200).json({
    clientUnit,
  })
}

export const getAvailableListings = async (req, res) => {
  const { search, project_id, lot_type } = req.query

  const conditions = ['l.status = ?']
  const params = ['available']

  if (!isMissing(search)) {
    const searchTerm = `%${search}%`

    conditions.push(`
      (
        l.unit_id LIKE ?
        OR l.cadastral_lot_no LIKE ?
        OR l.lot_type LIKE ?
        OR p.name LIKE ?
      )
    `)

    params.push(searchTerm, searchTerm, searchTerm, searchTerm)
  }

  if (!isMissing(project_id)) {
    conditions.push('l.project_id = ?')
    params.push(project_id)
  }

  if (!isMissing(lot_type)) {
    conditions.push('l.lot_type = ?')
    params.push(lot_type)
  }

  const [listings] = await db.query(
    `
    SELECT
      l.id,
      l.project_id,
      p.name AS project_name,
      l.cadastral_lot_no,
      l.unit_id,
      l.lot_type,
      l.lot_area_sqm,
      l.price_per_sqm,
      l.net_selling_price,
      l.legal_misc_fee,
      l.total_contract_price,
      l.status,
      l.created_at,
      l.updated_at
    FROM listings l
    INNER JOIN projects p ON p.id = l.project_id
    WHERE ${conditions.join(' AND ')}
    ORDER BY l.id DESC
    `,
    params
  )

  res.status(200).json({
    listings,
  })
}

export const reserveListing = async (req, res) => {
  const { clientId } = req.params

  const {
    listing_id,
    assigned_user_id,
    seller_id,
    due_day,
  } = req.body

  if (isMissing(clientId)) {
    return res.status(400).json({
      message: 'Client ID is required',
    })
  }

  if (isMissing(listing_id)) {
    return res.status(400).json({
      message: 'Listing ID is required',
    })
  }

  const dueDayValidation = validateDueDay(due_day)

  if (!dueDayValidation.isValid) {
    return res.status(400).json({
      message: 'Due day must be between 1 and 31',
    })
  }

  const assignedUserId = isMissing(assigned_user_id)
    ? req.user.id
    : assigned_user_id

  const connection = await db.getConnection()
  let clientUnitId = null
  let auditDescription = null

  try {
    await connection.beginTransaction()

    const [clientRows] = await connection.query(
      `
      SELECT
        id,
        full_name,
        default_seller_id
      FROM clients
      WHERE id = ?
      LIMIT 1
      `,
      [clientId]
    )

    const client = clientRows[0]

    if (!client) {
      await connection.rollback()
      return res.status(404).json({
        message: 'Client not found',
      })
    }

    const finalSellerId = isMissing(seller_id)
      ? client.default_seller_id
      : seller_id

    const sellerValidation = await validateSeller(connection, finalSellerId)

    if (!sellerValidation.isValid) {
      await connection.rollback()
      return res.status(400).json({
        message: sellerValidation.message,
      })
    }

    const [assignedUserRows] = await connection.query(
      `
      SELECT id
      FROM users
      WHERE id = ?
      LIMIT 1
      `,
      [assignedUserId]
    )

    if (!assignedUserRows[0]) {
      await connection.rollback()
      return res.status(404).json({
        message: 'Assigned user not found',
      })
    }

    const [listingRows] = await connection.query(
      `
      SELECT
        id,
        unit_id,
        net_selling_price,
        legal_misc_fee,
        total_contract_price,
        status
      FROM listings
      WHERE id = ?
      LIMIT 1
      FOR UPDATE
      `,
      [listing_id]
    )

    const listing = listingRows[0]

    if (!listing) {
      await connection.rollback()
      return res.status(404).json({
        message: 'Listing not found',
      })
    }

    if (listing.status !== 'available') {
      await connection.rollback()
      return res.status(409).json({
        message: 'Listing is no longer available',
      })
    }

    const contractPrice =
      Number(listing.total_contract_price || 0) > 0
        ? listing.total_contract_price
        : Number(listing.net_selling_price || 0) +
          Number(listing.legal_misc_fee || 0)

    const [result] = await connection.query(
      `
      INSERT INTO client_units (
        client_id,
        listing_id,
        assigned_user_id,
        seller_id,
        status,
        balance,
        due_day
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        clientId,
        listing_id,
        assignedUserId,
        nullableValue(finalSellerId),
        'reserved',
        contractPrice,
        dueDayValidation.value,
      ]
    )

    clientUnitId = result.insertId
    auditDescription = `Reserved ${listing.unit_id} for ${client.full_name}`

    await connection.query(
      `
      UPDATE listings
      SET status = ?
      WHERE id = ?
      `,
      ['reserved', listing_id]
    )

    await connection.query(
      `
      INSERT INTO client_document_list (
        client_unit_id,
        document_id,
        status,
        reviewed_by,
        reviewed_at
      )
      SELECT
        ?,
        id,
        'not_submitted',
        NULL,
        NULL
      FROM documents
      WHERE status = ?
      `,
      [clientUnitId, 'active']
    )

    await connection.commit()
  } catch (err) {
    await connection.rollback()
    throw err
  } finally {
    connection.release()
  }

  await createAuditLog({
    userId: req.user.id,
    action: 'reserve',
    module: 'Client Units',
    description: auditDescription,
    ipAddress: getClientIp(req),
  })

  return res.status(201).json({
    message: 'Listing reserved successfully',
    clientUnitId,
  })
}

export const updateClientUnit = async (req, res) => {
  const { id } = req.params

  const {
    assigned_user_id,
    seller_id,
    status,
    balance,
    due_day,
  } = req.body

  const dueDayValidation = validateDueDay(due_day)

  if (!dueDayValidation.isValid) {
    return res.status(400).json({
      message: 'Due day must be between 1 and 31',
    })
  }

  if (!isMissing(status) && !allowedClientUnitStatuses.includes(status)) {
    return res.status(400).json({
      message: 'Invalid client unit status',
    })
  }

  const connection = await db.getConnection()

  try {
    await connection.beginTransaction()

    const [clientUnitRows] = await connection.query(
      `
      SELECT
        id,
        listing_id,
        assigned_user_id,
        seller_id,
        status,
        balance,
        due_day
      FROM client_units
      WHERE id = ?
      LIMIT 1
      FOR UPDATE
      `,
      [id]
    )

    const clientUnit = clientUnitRows[0]

    if (!clientUnit) {
      await connection.rollback()
      return res.status(404).json({
        message: 'Client unit not found',
      })
    }

    const nextAssignedUserId = isMissing(assigned_user_id)
      ? clientUnit.assigned_user_id
      : assigned_user_id

    if (!isMissing(assigned_user_id)) {
      const [assignedUserRows] = await connection.query(
        `
        SELECT id
        FROM users
        WHERE id = ?
        LIMIT 1
        `,
        [assigned_user_id]
      )

      if (!assignedUserRows[0]) {
        await connection.rollback()
        return res.status(404).json({
          message: 'Assigned user not found',
        })
      }
    }

    const nextSellerId = isMissing(seller_id)
      ? clientUnit.seller_id
      : seller_id

    const sellerValidation = await validateSeller(connection, nextSellerId)

    if (!sellerValidation.isValid) {
      await connection.rollback()
      return res.status(400).json({
        message: sellerValidation.message,
      })
    }

    const nextStatus = isMissing(status) ? clientUnit.status : status
    const nextBalance = isMissing(balance) ? clientUnit.balance : balance
    const nextDueDay = isMissing(due_day)
      ? clientUnit.due_day
      : dueDayValidation.value

    await connection.query(
      `
      UPDATE client_units
      SET
        assigned_user_id = ?,
        seller_id = ?,
        status = ?,
        balance = ?,
        due_day = ?
      WHERE id = ?
      `,
      [
        nextAssignedUserId,
        nullableValue(nextSellerId),
        nextStatus,
        nextBalance,
        nextDueDay,
        id,
      ]
    )

    const nextListingStatus = listingStatusFromClientUnitStatus(nextStatus)

    if (nextListingStatus) {
      await connection.query(
        `
        UPDATE listings
        SET status = ?
        WHERE id = ?
        `,
        [nextListingStatus, clientUnit.listing_id]
      )
    }

    await connection.commit()
  } catch (err) {
    await connection.rollback()
    throw err
  } finally {
    connection.release()
  }

  await createAuditLog({
    userId: req.user.id,
    action: 'update',
    module: 'Client Units',
    description: `Updated client unit ${id}`,
    ipAddress: getClientIp(req),
  })

  return res.status(200).json({
    message: 'Client unit updated successfully',
  })
}