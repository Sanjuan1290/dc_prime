import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { db } from '../db/connect.js'
import { createAuditLog } from '../utils/createAuditLog.js'

const allowedRoles = ['super_admin', 'admin', 'personnel']

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
  'settings'
]

export const login = async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({
      message: 'Email and password are required'
    })
  }

  const [rows] = await db.query(
    `
    SELECT
      id,
      full_name,
      email,
      password_hash,
      role,
      status
    FROM users
    WHERE email = ?
    LIMIT 1
    `,
    [email]
  )

  const user = rows[0]

  if (!user) {
    return res.status(401).json({
      message: 'Invalid email or password'
    })
  }

  if (user.status !== 'active') {
    return res.status(403).json({
      message: 'Account is not active'
    })
  }

  if (!allowedRoles.includes(user.role)) {
    return res.status(403).json({
      message: 'Role is not allowed to login'
    })
  }

  const isPasswordCorrect = await bcrypt.compare(password, user.password_hash)

  if (!isPasswordCorrect) {
    return res.status(401).json({
      message: 'Invalid email or password'
    })
  }

  const features = ['super_admin', 'admin'].includes(user.role)
    ? adminFeatures
    : []

  const token = jwt.sign(
    {
      id: user.id,
      role: user.role
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '7d'
    }
  )

  res.cookie('token', token, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 7
  })

  await db.query(
    `UPDATE users SET last_login = NOW() WHERE id = ?`,
    [user.id]
  )

  await createAuditLog({
    userId: user.id,
    action: 'login',
    module: 'Auth',
    description: `${user.full_name} logged in`,
    ipAddress: req.ip
  })

  res.status(200).json({
    message: 'Login successful',
    user: {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      status: user.status,
      features
    }
  })
}

export const logout = async (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: false,
    sameSite: 'lax'
  })

  res.status(200).json({
    message: 'Logout successful'
  })
}
