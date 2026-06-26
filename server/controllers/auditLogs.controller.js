import { db } from '../db/connect.js'
import { formatIpForDisplay } from '../utils/getClientIp.js'

const isMissing = (value) => {
  return value === undefined || value === null || value === ''
}

const auditLogFields = `
  al.id,
  al.user_id,
  u.full_name AS user_name,
  u.email AS user_email,
  u.role AS user_role,
  al.action,
  al.module,
  al.description,
  al.ip_address,
  al.created_at
`

const auditLogJoins = `
  FROM audit_logs al
  LEFT JOIN users u ON u.id = al.user_id
`

const mapAuditLogs = (auditLogs) => {
  return auditLogs.map((log) => ({
    ...log,
    ip_address: formatIpForDisplay(log.ip_address)
  }))
}

const getAuditLogsForWhereClause = async (whereClause = '', params = []) => {
  const [auditLogs] = await db.query(
    `
    SELECT
      ${auditLogFields}
    ${auditLogJoins}
    ${whereClause}
    ORDER BY al.id DESC
    `,
    params
  )

  return mapAuditLogs(auditLogs)
}

export const getAuditLogs = async (req, res) => {
  const {
    search,
    action,
    module,
    user_id,
    date_from,
    date_to
  } = req.query

  const conditions = []
  const params = []

  if (!isMissing(search)) {
    const searchTerm = `%${search}%`

    conditions.push(`
      (
        u.full_name LIKE ?
        OR u.email LIKE ?
        OR al.action LIKE ?
        OR al.module LIKE ?
        OR al.description LIKE ?
        OR al.ip_address LIKE ?
      )
    `)

    params.push(
      searchTerm,
      searchTerm,
      searchTerm,
      searchTerm,
      searchTerm,
      searchTerm
    )
  }

  if (!isMissing(action)) {
    conditions.push('al.action = ?')
    params.push(action)
  }

  if (!isMissing(module)) {
    conditions.push('al.module = ?')
    params.push(module)
  }

  if (!isMissing(user_id)) {
    conditions.push('al.user_id = ?')
    params.push(user_id)
  }

  if (!isMissing(date_from)) {
    conditions.push('al.created_at >= ?')
    params.push(date_from)
  }

  if (!isMissing(date_to)) {
    conditions.push('al.created_at <= ?')
    params.push(date_to)
  }

  const whereClause = conditions.length > 0
    ? `WHERE ${conditions.join(' AND ')}`
    : ''

  const auditLogs = await getAuditLogsForWhereClause(whereClause, params)

  res.status(200).json({
    auditLogs
  })
}

export const getAuditLog = async (req, res) => {
  const { id } = req.params

  const auditLogs = await getAuditLogsForWhereClause(
    'WHERE al.id = ?',
    [id]
  )

  const auditLog = auditLogs[0]

  if (!auditLog) {
    return res.status(404).json({
      message: 'Audit log not found'
    })
  }

  res.status(200).json({
    auditLog
  })
}

