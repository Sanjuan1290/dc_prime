import { db } from '../db/connect.js'
import { createAuditLog } from '../utils/createAuditLog.js'

const nullableValue = (value) => {
  if (value === undefined || value === null || value === '') {
    return null
  }

  return value
}

const isMissing = (value) => {
  return value === undefined || value === null || value === ''
}

const clientFields = `
  c.id,
  c.full_name,
  c.spouse_co_owner_name,
  c.email,
  c.contact_no,
  c.address,
  c.created_at,
  c.updated_at,
  COUNT(cu.client_id) AS units_count,
  COALESCE(SUM(cu.balance), 0) AS balance
`

const clientGroupBy = `
  c.id,
  c.full_name,
  c.spouse_co_owner_name,
  c.email,
  c.contact_no,
  c.address,
  c.created_at,
  c.updated_at
`

export const getClients = async (req, res) => {
  const { search } = req.query
  const params = []
  let whereClause = ''

  if (!isMissing(search)) {
    const searchTerm = `%${search}%`

    whereClause = `
      WHERE
        c.full_name LIKE ?
        OR c.spouse_co_owner_name LIKE ?
        OR c.email LIKE ?
        OR c.contact_no LIKE ?
        OR c.address LIKE ?
    `

    params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm)
  }

  const [clients] = await db.query(
    `
    SELECT
      ${clientFields}
    FROM clients c
    LEFT JOIN client_units cu ON cu.client_id = c.id
    ${whereClause}
    GROUP BY
      ${clientGroupBy}
    ORDER BY c.id DESC
    `,
    params
  )

  res.status(200).json({
    clients
  })
}

export const getClient = async (req, res) => {
  const { id } = req.params

  const [rows] = await db.query(
    `
    SELECT
      ${clientFields}
    FROM clients c
    LEFT JOIN client_units cu ON cu.client_id = c.id
    WHERE c.id = ?
    GROUP BY
      ${clientGroupBy}
    LIMIT 1
    `,
    [id]
  )

  const client = rows[0]

  if (!client) {
    return res.status(404).json({
      message: 'Client not found'
    })
  }

  res.status(200).json({
    client
  })
}

export const createClient = async (req, res) => {
  const {
    full_name,
    spouse_co_owner_name,
    email,
    contact_no,
    address
  } = req.body

  if (isMissing(full_name)) {
    return res.status(400).json({
      message: 'Client full name is required'
    })
  }

  const [result] = await db.query(
    `
    INSERT INTO clients (
      full_name,
      spouse_co_owner_name,
      email,
      contact_no,
      address
    ) VALUES (?, ?, ?, ?, ?)
    `,
    [
      full_name,
      nullableValue(spouse_co_owner_name),
      nullableValue(email),
      nullableValue(contact_no),
      nullableValue(address)
    ]
  )

  await createAuditLog({
    userId: req.user.id,
    action: 'create',
    module: 'Clients',
    description: `Created client ${full_name}`,
    ipAddress: req.ip
  })

  res.status(201).json({
    message: 'Client created successfully',
    clientId: result.insertId
  })
}

export const updateClient = async (req, res) => {
  const { id } = req.params

  const {
    full_name,
    spouse_co_owner_name,
    email,
    contact_no,
    address
  } = req.body

  if (isMissing(full_name)) {
    return res.status(400).json({
      message: 'Client full name is required'
    })
  }

  const [result] = await db.query(
    `
    UPDATE clients
    SET
      full_name = ?,
      spouse_co_owner_name = ?,
      email = ?,
      contact_no = ?,
      address = ?
    WHERE id = ?
    `,
    [
      full_name,
      nullableValue(spouse_co_owner_name),
      nullableValue(email),
      nullableValue(contact_no),
      nullableValue(address),
      id
    ]
  )

  if (result.affectedRows === 0) {
    return res.status(404).json({
      message: 'Client not found'
    })
  }

  await createAuditLog({
    userId: req.user.id,
    action: 'update',
    module: 'Clients',
    description: `Updated client ${full_name}`,
    ipAddress: req.ip
  })

  res.status(200).json({
    message: 'Client updated successfully'
  })
}
