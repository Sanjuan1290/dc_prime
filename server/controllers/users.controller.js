import bcrypt from 'bcrypt'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import { db } from '../db/connect.js'
import { safeCreateAuditLog } from '../utils/createAuditLog.js'
import { sendSystemEmail } from '../lib/mailer.js'

const allowedRoles = ['super_admin', 'admin', 'broker_network_manager', 'broker', 'manager', 'agent']

const adminFeatures = [
  'users',
  'clients',
  'projects',
  'listings',
  'payments',
  'documents',
  'employees',
  'attendance',
  'reports',
  'settings',
]

const sellerFeatures = ['seller-dashboard', 'available-units', 'team-sales']

const getFeaturesForRole = (role) => {
  if (['super_admin', 'admin'].includes(role)) return adminFeatures
  if (allowedRoles.includes(role)) return sellerFeatures
  return []
}

export const login = async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' })
  }

  const [rows] = await db.query(
    `
    SELECT
      id,
      full_name,
      email,
      password_hash,
      role,
      status,
      must_change_password
    FROM users
    WHERE email = ?
    LIMIT 1
    `,
    [String(email).trim()]
  )

  const user = rows[0]

  if (!user) {
    return res.status(401).json({ message: 'Invalid email or password' })
  }

  if (user.status !== 'active') {
    return res.status(403).json({ message: 'Account is not active' })
  }

  if (!allowedRoles.includes(user.role)) {
    return res.status(403).json({ message: 'Role is not allowed to login' })
  }

  const isPasswordCorrect = await bcrypt.compare(password, user.password_hash)

  if (!isPasswordCorrect) {
    return res.status(401).json({ message: 'Invalid email or password' })
  }

  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  )

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 7,
  })

  await db.query(`UPDATE users SET last_login = NOW() WHERE id = ?`, [user.id])

  await safeCreateAuditLog({
    userId: user.id,
    action: 'login',
    module: 'Auth',
    description: `${user.full_name} logged in`,
    ipAddress: req.ip,
  })

  const responseUser = {
    id: user.id,
    full_name: user.full_name,
    email: user.email,
    role: user.role,
    status: user.status,
    must_change_password: Boolean(user.must_change_password),
    features: getFeaturesForRole(user.role),
  }

  res.status(200).json({
    message: user.must_change_password
      ? 'Login successful. Password change is required.'
      : 'Login successful',
    user: responseUser,
  })
}

export const changePassword = async (req, res) => {
  const { current_password, new_password, confirm_password } = req.body

  if (!current_password || !new_password || !confirm_password) {
    return res.status(400).json({ message: 'Current password, new password, and confirmation are required' })
  }

  if (String(new_password).length < 8) {
    return res.status(400).json({ message: 'New password must be at least 8 characters' })
  }

  if (new_password !== confirm_password) {
    return res.status(400).json({ message: 'Password confirmation does not match' })
  }

  const [rows] = await db.query(
    `SELECT id, full_name, password_hash FROM users WHERE id = ? LIMIT 1`,
    [req.user.id]
  )

  const user = rows[0]
  if (!user) return res.status(404).json({ message: 'User not found' })

  const isCurrentPasswordCorrect = await bcrypt.compare(current_password, user.password_hash)
  if (!isCurrentPasswordCorrect) {
    return res.status(401).json({ message: 'Current password is incorrect' })
  }

  const isSamePassword = await bcrypt.compare(new_password, user.password_hash)
  if (isSamePassword) {
    return res.status(400).json({ message: 'New password must be different from the temporary password' })
  }

  const passwordHash = await bcrypt.hash(new_password, 10)

  await db.query(
    `
    UPDATE users
    SET
      password_hash = ?,
      must_change_password = 0,
      password_changed_at = NOW()
    WHERE id = ?
    `,
    [passwordHash, req.user.id]
  )

  await safeCreateAuditLog({
    userId: req.user.id,
    action: 'change_password',
    module: 'Auth',
    description: `${user.full_name} changed password`,
    ipAddress: req.ip,
  })

  res.status(200).json({ message: 'Password changed successfully' })
}

export const sendTemporaryPasswordEmail = async ({ email, fullName, temporaryPassword }) => {
  const loginUrl = process.env.CLIENT_URL || process.env.CORS_ORIGIN || 'http://localhost:5173'

  try {
    await sendSystemEmail({
      to: email,
      subject: 'D&C Prime Realty - Temporary Password',
      text: `Hello ${fullName},\n\nYour D&C Prime Realty account has been created.\n\nEmail: ${email}\nTemporary password: ${temporaryPassword}\n\nLogin here: ${loginUrl}\n\nYou will be asked to change your password after signing in.\n\nD&C Prime Realty`,
      html: `
        <p>Hello ${fullName},</p>
        <p>Your D&amp;C Prime Realty account has been created.</p>
        <p><strong>Email:</strong> ${email}<br/><strong>Temporary password:</strong> ${temporaryPassword}</p>
        <p>Login here: <a href="${loginUrl}">${loginUrl}</a></p>
        <p>You will be asked to change your password after signing in.</p>
        <p>D&amp;C Prime Realty</p>
      `,
    })

    return { sent: true }
  } catch (error) {
    console.error('Temporary password email failed:', error)
    return { sent: false, error }
  }
}

export const generateTemporaryPassword = () => {
  return `DC-${crypto.randomBytes(4).toString('hex').toUpperCase()}`
}

export const logout = async (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  })

  res.status(200).json({ message: 'Logout successful' })
}

