import { db } from '../db/connect.js'
import { formatIpForDisplay } from '../utils/getClientIp.js'
import {
  addDateRangeConditions,
  buildPagination,
  getDateRangeFromQuery,
  getPaginationOptions,
  getSortOptions,
} from '../utils/queryOptions.js'

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
  } = req.query
  const { page, limit, offset } = getPaginationOptions(req.query)
  const { dateFrom, dateTo } = getDateRangeFromQuery(req.query)
  const { sortColumn, sortDir } = getSortOptions(
    req.query,
    {
      id: 'al.id',
      created_at: 'al.created_at',
      action: 'al.action',
      module: 'al.module',
      user_name: 'u.full_name',
    },
    { defaultSortBy: 'created_at', defaultSortDir: 'DESC' }
  )

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

  addDateRangeConditions({
    conditions,
    params,
    column: 'al.created_at',
    dateFrom,
    dateTo,
  })

  const whereClause = conditions.length > 0
    ? `WHERE ${conditions.join(' AND ')}`
    : ''

  const [[countRow]] = await db.query(
    `
    SELECT COUNT(*) AS totalRows
    ${auditLogJoins}
    ${whereClause}
    `,
    params
  )

  const [auditRows] = await db.query(
    `
    SELECT
      ${auditLogFields}
    ${auditLogJoins}
    ${whereClause}
    ORDER BY ${sortColumn} ${sortDir}, al.id DESC
    LIMIT ? OFFSET ?
    `,
    [...params, limit, offset]
  )

  const auditLogs = mapAuditLogs(auditRows)
  const pagination = buildPagination({
    page,
    limit,
    totalRows: countRow.totalRows,
  })

  res.status(200).json({
    auditLogs,
    data: auditLogs,
    pagination,
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
