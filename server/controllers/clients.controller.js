import { db } from '../db/connect.js'
import { createAuditLog } from '../utils/createAuditLog.js'
import { getClientIp } from '../utils/getClientIp.js'

const isMissing = (value) => {
  return value === undefined || value === null || value === ''
}

const nullableValue = (value) => {
  if (isMissing(value)) return null
  return value
}

const clientFields = `
  c.id,
  c.full_name,
  c.spouse_co_owner_name,
  c.email,
  c.contact_no,
  c.address,
  c.region,
  c.default_seller_id,
  seller.full_name AS default_seller_name,
  seller.seller_role AS default_seller_role,
  COALESCE(COUNT(DISTINCT cu.id), 0) AS units_count,
  COALESCE(
    SUM(
      GREATEST(
        COALESCE(l.total_contract_price, 0) - COALESCE(payment_totals.total_paid, 0),
        0
      )
    ),
    0
  ) AS balance,
  c.created_at,
  c.updated_at
`

const clientJoins = `
  FROM clients c
  LEFT JOIN accredited_sellers seller
    ON seller.id = c.default_seller_id
  LEFT JOIN client_units cu
    ON cu.client_id = c.id
  LEFT JOIN listings l
    ON l.id = cu.listing_id
  LEFT JOIN (
    SELECT client_unit_id, SUM(amount) AS total_paid
    FROM payments
    WHERE status = 'verified'
    GROUP BY client_unit_id
  ) payment_totals ON payment_totals.client_unit_id = cu.id
`

const getClientById = async (id) => {
  const [rows] = await db.query(
    `
    SELECT
      ${clientFields}
    ${clientJoins}
    WHERE c.id = ?
    GROUP BY
      c.id,
      c.full_name,
      c.spouse_co_owner_name,
      c.email,
      c.contact_no,
      c.address,
      c.region,
      c.default_seller_id,
      seller.full_name,
      seller.seller_role,
      c.created_at,
      c.updated_at
    LIMIT 1
    `,
    [id]
  )

  return rows[0] || null
}

const validateDefaultSeller = async (defaultSellerId) => {
  if (isMissing(defaultSellerId)) {
    return {
      isValid: true,
      message: null,
    }
  }

  const [rows] = await db.query(
    `
    SELECT id
    FROM accredited_sellers
    WHERE id = ?
      AND status = 'active'
    LIMIT 1
    `,
    [defaultSellerId]
  )

  if (rows.length === 0) {
    return {
      isValid: false,
      message: 'Default seller not found or inactive',
    }
  }

  return {
    isValid: true,
    message: null,
  }
}

export const getClients = async (req, res) => {
  const { search, region, default_seller_id } = req.query

  const conditions = []
  const params = []

  if (!isMissing(search)) {
    const searchTerm = `%${search}%`

    conditions.push(`
      (
        c.full_name LIKE ?
        OR c.spouse_co_owner_name LIKE ?
        OR c.email LIKE ?
        OR c.contact_no LIKE ?
        OR c.address LIKE ?
        OR c.region LIKE ?
        OR seller.full_name LIKE ?
        OR seller.seller_role LIKE ?
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

  if (!isMissing(region) && region !== 'all') {
    conditions.push('c.region = ?')
    params.push(region)
  }

  if (!isMissing(default_seller_id) && default_seller_id !== 'all') {
    conditions.push('c.default_seller_id = ?')
    params.push(default_seller_id)
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const [clients] = await db.query(
    `
    SELECT
      ${clientFields}
    ${clientJoins}
    ${whereClause}
    GROUP BY
      c.id,
      c.full_name,
      c.spouse_co_owner_name,
      c.email,
      c.contact_no,
      c.address,
      c.region,
      c.default_seller_id,
      seller.full_name,
      seller.seller_role,
      c.created_at,
      c.updated_at
    ORDER BY c.id DESC
    `,
    params
  )

  res.status(200).json({
    clients,
  })
}

export const getClient = async (req, res) => {
  const { id } = req.params

  const client = await getClientById(id)

  if (!client) {
    return res.status(404).json({
      message: 'Client not found',
    })
  }

  res.status(200).json({
    client,
  })
}

export const createClient = async (req, res) => {
  const {
    full_name,
    spouse_co_owner_name,
    email,
    contact_no,
    address,
    region,
    default_seller_id,
  } = req.body

  if (isMissing(full_name)) {
    return res.status(400).json({
      message: 'Client name is required',
    })
  }

  const sellerValidation = await validateDefaultSeller(default_seller_id)

  if (!sellerValidation.isValid) {
    return res.status(400).json({
      message: sellerValidation.message,
    })
  }

  const [result] = await db.query(
    `
    INSERT INTO clients (
      full_name,
      spouse_co_owner_name,
      email,
      contact_no,
      address,
      region,
      default_seller_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [
      full_name,
      nullableValue(spouse_co_owner_name),
      nullableValue(email),
      nullableValue(contact_no),
      nullableValue(address),
      nullableValue(region),
      nullableValue(default_seller_id),
    ]
  )

  await createAuditLog({
    userId: req.user.id,
    action: 'create',
    module: 'Clients',
    description: `Created client ${full_name}`,
    ipAddress: getClientIp(req),
  })

  res.status(201).json({
    message: 'Client created successfully',
    clientId: result.insertId,
  })
}

export const updateClient = async (req, res) => {
  const { id } = req.params

  const {
    full_name,
    spouse_co_owner_name,
    email,
    contact_no,
    address,
    region,
    default_seller_id,
  } = req.body

  if (isMissing(full_name)) {
    return res.status(400).json({
      message: 'Client name is required',
    })
  }

  const existingClient = await getClientById(id)

  if (!existingClient) {
    return res.status(404).json({
      message: 'Client not found',
    })
  }

  const sellerValidation = await validateDefaultSeller(default_seller_id)

  if (!sellerValidation.isValid) {
    return res.status(400).json({
      message: sellerValidation.message,
    })
  }

  await db.query(
    `
    UPDATE clients
    SET
      full_name = ?,
      spouse_co_owner_name = ?,
      email = ?,
      contact_no = ?,
      address = ?,
      region = ?,
      default_seller_id = ?
    WHERE id = ?
    `,
    [
      full_name,
      nullableValue(spouse_co_owner_name),
      nullableValue(email),
      nullableValue(contact_no),
      nullableValue(address),
      nullableValue(region),
      nullableValue(default_seller_id),
      id,
    ]
  )

  await createAuditLog({
    userId: req.user.id,
    action: 'update',
    module: 'Clients',
    description: `Updated client ${full_name}`,
    ipAddress: getClientIp(req),
  })

  res.status(200).json({
    message: 'Client updated successfully',
  })
}


export const deleteClient = async (req, res) => {
  const { id } = req.params

  const existingClient = await getClientById(id)

  if (!existingClient) {
    return res.status(404).json({
      message: 'Client not found',
    })
  }

  const [unitRows] = await db.query(
    `
    SELECT id
    FROM client_units
    WHERE client_id = ?
    LIMIT 1
    `,
    [id]
  )

  if (unitRows.length > 0) {
    return res.status(400).json({
      message: 'Cannot delete a client that has active or historical reservations.',
    })
  }

  await db.query(`DELETE FROM clients WHERE id = ?`, [id])

  await createAuditLog({
    userId: req.user.id,
    action: 'delete',
    module: 'Clients',
    description: `Deleted client ${existingClient.full_name}`,
    ipAddress: getClientIp(req),
  })

  res.status(200).json({
    message: 'Client deleted successfully',
  })
}
