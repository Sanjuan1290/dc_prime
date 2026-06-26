import { db } from '../db/connect.js'

export const sellerRoles = ['broker_network_manager', 'broker', 'manager', 'agent']
export const officeRoles = ['super_admin', 'admin']

export const isSellerRole = (role) => sellerRoles.includes(role)
export const isOfficeRole = (role) => officeRoles.includes(role)

export const getSellerForUser = async (userId, connectionOrDb = db) => {
  const [rows] = await connectionOrDb.query(
    `
    SELECT *
    FROM accredited_sellers
    WHERE user_id = ?
      AND status = 'active'
    ORDER BY id DESC
    LIMIT 1
    `,
    [userId]
  )

  return rows[0] || null
}

export const getVisibleSellerIdsForUser = async (user, connectionOrDb = db) => {
  if (!user) return []

  if (isOfficeRole(user.role)) {
    return null
  }

  if (!isSellerRole(user.role)) {
    return []
  }

  const seller = await getSellerForUser(user.id, connectionOrDb)
  if (!seller) return []

  const [rows] = await connectionOrDb.query(
    `
    WITH RECURSIVE seller_tree AS (
      SELECT id
      FROM accredited_sellers
      WHERE id = ?

      UNION ALL

      SELECT child.id
      FROM accredited_sellers child
      INNER JOIN seller_tree parent_tree ON parent_tree.id = child.parent_seller_id
      WHERE child.status = 'active'
    )
    SELECT id FROM seller_tree
    `,
    [seller.id]
  )

  return rows.map((row) => Number(row.id)).filter(Boolean)
}

export const applySellerScope = async ({
  user,
  conditions,
  params,
  sellerColumn = 'seller.id',
  connectionOrDb = db,
}) => {
  const visibleSellerIds = await getVisibleSellerIdsForUser(user, connectionOrDb)

  if (visibleSellerIds === null) {
    return { visibleSellerIds: null, scoped: false }
  }

  if (visibleSellerIds.length === 0) {
    conditions.push('1 = 0')
    return { visibleSellerIds: [], scoped: true }
  }

  conditions.push(`${sellerColumn} IN (${visibleSellerIds.map(() => '?').join(', ')})`)
  params.push(...visibleSellerIds)

  return { visibleSellerIds, scoped: true }
}

