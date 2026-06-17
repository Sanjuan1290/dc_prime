import { db } from '../db/connect.js'

export const createAuditLog = async ({
  userId = null,
  action,
  module,
  description = null,
  ipAddress = null
}) => {
  await db.query(
    `
    INSERT INTO audit_logs (
      user_id,
      action,
      module,
      description,
      ip_address
    ) VALUES (?, ?, ?, ?, ?)
    `,
    [userId, action, module, description, ipAddress]
  )
}

export const safeCreateAuditLog = async (payload) => {
  try {
    await createAuditLog(payload)
  } catch (error) {
    console.error('Audit log failed:', error.message)
  }
}
