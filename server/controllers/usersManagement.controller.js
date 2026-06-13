import bcrypt from 'bcrypt'
import { db } from '../db/connect.js'
import { createAuditLog } from '../utils/createAuditLog.js'
import { getClientIp } from '../utils/getClientIp.js'

const allowedRoles = [
  'super_admin',
  'admin',
  'treasury',
  'broker_network_manager',
  'broker',
  'manager',
  'agent',
  'client',
]

const isMissing = (value) => value === undefined || value === null || value === ''

const userFields = `
  id,
  full_name,
  email,
  role,
  status,
  last_login,
  created_at,
  updated_at
`

export const getUsers = async (req, res) => {
  const [users] = await db.query(`SELECT ${userFields} FROM users ORDER BY id DESC`)
  res.status(200).json({ message: 'Users fetched successfully', users, data: users })
}

export const createUser = async (req, res) => {
  const { full_name, email, password, role = 'agent', status = 'active' } = req.body

  if (isMissing(full_name) || isMissing(email) || isMissing(password)) {
    return res.status(400).json({ message: 'Full name, email, and password are required' })
  }

  if (!allowedRoles.includes(role)) {
    return res.status(400).json({ message: 'Invalid role' })
  }

  const [existing] = await db.query(`SELECT id FROM users WHERE email = ? LIMIT 1`, [email])
  if (existing.length > 0) {
    return res.status(400).json({ message: 'Email is already used' })
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const [result] = await db.query(
    `INSERT INTO users (full_name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?)`,
    [full_name, email, passwordHash, role, status || 'active']
  )

  await createAuditLog({
    userId: req.user.id,
    action: 'create',
    module: 'Users',
    description: `Created user ${full_name}`,
    ipAddress: getClientIp(req),
  })

  res.status(201).json({ message: 'User created successfully', userId: result.insertId })
}

export const updateUser = async (req, res) => {
  const { id } = req.params
  const { full_name, email, password, role, status } = req.body

  const [rows] = await db.query(`SELECT id FROM users WHERE id = ? LIMIT 1`, [id])
  if (rows.length === 0) return res.status(404).json({ message: 'User not found' })

  if (role && !allowedRoles.includes(role)) {
    return res.status(400).json({ message: 'Invalid role' })
  }

  const fields = []
  const params = []

  if (!isMissing(full_name)) { fields.push('full_name = ?'); params.push(full_name) }
  if (!isMissing(email)) { fields.push('email = ?'); params.push(email) }
  if (!isMissing(role)) { fields.push('role = ?'); params.push(role) }
  if (!isMissing(status)) { fields.push('status = ?'); params.push(status) }
  if (!isMissing(password)) {
    fields.push('password_hash = ?')
    params.push(await bcrypt.hash(password, 10))
  }

  if (fields.length === 0) return res.status(400).json({ message: 'No changes provided' })
  params.push(id)

  await db.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, params)

  await createAuditLog({
    userId: req.user.id,
    action: 'update',
    module: 'Users',
    description: `Updated user ${id}`,
    ipAddress: getClientIp(req),
  })

  res.status(200).json({ message: 'User updated successfully' })
}

export const deactivateUser = async (req, res) => {
  const { id } = req.params

  if (Number(id) === Number(req.user.id)) {
    return res.status(400).json({ message: 'You cannot deactivate your own account' })
  }

  await db.query(`UPDATE users SET status = 'inactive' WHERE id = ?`, [id])

  await createAuditLog({
    userId: req.user.id,
    action: 'deactivate',
    module: 'Users',
    description: `Deactivated user ${id}`,
    ipAddress: getClientIp(req),
  })

  res.status(200).json({ message: 'User deactivated successfully' })
}

export const linkUserToSeller = async (req, res) => {
  const { id } = req.params
  const { seller_id } = req.body

  if (isMissing(seller_id)) {
    return res.status(400).json({ message: 'seller_id is required' })
  }

  const [sellerRows] = await db.query(`SELECT id FROM accredited_sellers WHERE id = ? LIMIT 1`, [seller_id])
  if (sellerRows.length === 0) return res.status(404).json({ message: 'Seller not found' })

  await db.query(`UPDATE accredited_sellers SET user_id = ? WHERE id = ?`, [id, seller_id])

  await createAuditLog({
    userId: req.user.id,
    action: 'link',
    module: 'Users',
    description: `Linked user ${id} to seller ${seller_id}`,
    ipAddress: getClientIp(req),
  })

  res.status(200).json({ message: 'User linked to seller successfully' })
}
