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