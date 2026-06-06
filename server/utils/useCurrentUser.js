import jwt from 'jsonwebtoken'
import { db } from '../db/connect.js'

const useCurrentUser = async (req, res) => {
  try {
    const token = req.cookies.token

    if (!token) {
      return res.status(401).json({
        message: 'Not authorized. Please login first.',
        isLoggedIn: false
      })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    const [rows] = await db.query(
      `
      SELECT 
        id,
        full_name,
        email,
        role,
        status,
        last_login,
        created_at,
        updated_at
      FROM users
      WHERE id = ?
      LIMIT 1
      `,
      [decoded.id]
    )

    const user = rows[0]

    if (!user) {
      return res.status(401).json({
        message: 'User not found.',
        isLoggedIn: false
      })
    }

    return res.status(200).json({
      message: 'Already logged in',
      user,
      isLoggedIn: true
    })
  } catch (err) {
    return res.status(401).json({
      message: 'Invalid or expired token.',
      isLoggedIn: false
    })
  }
}

export default useCurrentUser