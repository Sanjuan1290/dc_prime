import jwt from 'jsonwebtoken'
import { db } from '../db/connect.js'

export const auth = async (req, res, next) => {
  const token = req.cookies.token

  if (!token) {
    return res.status(401).json({
      message: 'Not authorized. Please login first.'
    })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    const [rows] = await db.query(
      `
      SELECT 
        id,
        full_name,
        email,
        role,
        status
      FROM users
      WHERE id = ?
      LIMIT 1
      `,
      [decoded.id]
    )

    const user = rows[0]

    if (!user) {
      return res.status(401).json({
        message: 'User not found.'
      })
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        message: 'Account is not active.'
      })
    }

    req.user = user
    next()
  } catch (err) {
    return res.status(401).json({
      message: 'Invalid or expired token.'
    })
  }
}

export const adminOnly = (req, res, next) => {
  if (!['super_admin', 'admin'].includes(req.user.role)) {
    return res.status(403).json({
      message: 'Admin access only.'
    })
  }

  next()
}
