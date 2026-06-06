import { db } from '../db/connect.js'
import { createAuditLog } from '../utils/createAuditLog.js'

const allowedSellerRoles = [
  'broker_network_manager',
  'broker',
  'manager',
  'agent'
]

const allowedStatuses = [
  'active',
  'inactive'
]

const parentRoleBySellerRole = {
  broker_network_manager: null,
  broker: 'broker_network_manager',
  manager: 'broker',
  agent: 'manager'
}

const isMissing = (value) => {
  return value === undefined || value === null || value === ''
}

const nullableValue = (value) => {
  if (isMissing(value)) {
    return null
  }

  return value
}

const sellerFields = `
  s.id,
  s.user_id,
  linked_user.full_name AS linked_user_name,
  s.full_name,
  s.email,
  s.contact_no,
  s.seller_role,
  s.parent_seller_id,
  parent_seller.full_name AS parent_seller_name,
  parent_seller.seller_role AS parent_seller_role,
  s.status,
  s.created_at,
  s.updated_at
`

const sellerJoins = `
  FROM accredited_sellers s
  LEFT JOIN users linked_user ON linked_user.id = s.user_id
  LEFT JOIN accredited_sellers parent_seller ON parent_seller.id = s.parent_seller_id
`

const userExists = async (connectionOrDb, userId) => {
  const [rows] = await connectionOrDb.query(
    `
    SELECT id
    FROM users
    WHERE id = ?
    LIMIT 1
    `,
    [userId]
  )

  return rows.length > 0
}

export const validateSellerParent = async (
  connectionOrDb,
  sellerRole,
  parentSellerId,
  currentSellerId = null
) => {
  if (sellerRole === 'broker_network_manager') {
    if (!isMissing(parentSellerId)) {
      return {
        isValid: false,
        message: 'Broker network manager cannot have a parent seller'
      }
    }

    return {
      isValid: true
    }
  }

  const requiredParentRole = parentRoleBySellerRole[sellerRole]

  if (isMissing(parentSellerId)) {
    return {
      isValid: false,
      message: `${sellerRole} must have a parent seller`
    }
  }

  if (!isMissing(currentSellerId) && String(parentSellerId) === String(currentSellerId)) {
    return {
      isValid: false,
      message: 'Seller cannot be its own parent'
    }
  }

  const [parentRows] = await connectionOrDb.query(
    `
    SELECT
      id,
      seller_role
    FROM accredited_sellers
    WHERE id = ?
    LIMIT 1
    `,
    [parentSellerId]
  )

  const parentSeller = parentRows[0]

  if (!parentSeller) {
    return {
      isValid: false,
      message: 'Parent seller not found'
    }
  }

  if (parentSeller.seller_role !== requiredParentRole) {
    return {
      isValid: false,
      message: `${sellerRole} must report under ${requiredParentRole}`
    }
  }

  return {
    isValid: true
  }
}

const wouldCreateHierarchyCycle = async (connectionOrDb, currentSellerId, parentSellerId) => {
  if (isMissing(parentSellerId)) {
    return false
  }

  let cursorId = parentSellerId
  const visitedSellerIds = new Set()

  while (!isMissing(cursorId)) {
    if (String(cursorId) === String(currentSellerId)) {
      return true
    }

    if (visitedSellerIds.has(String(cursorId))) {
      return true
    }

    visitedSellerIds.add(String(cursorId))

    const [rows] = await connectionOrDb.query(
      `
      SELECT parent_seller_id
      FROM accredited_sellers
      WHERE id = ?
      LIMIT 1
      `,
      [cursorId]
    )

    const seller = rows[0]

    if (!seller) {
      return false
    }

    cursorId = seller.parent_seller_id
  }

  return false
}

export const getAccreditedSellers = async (req, res) => {
  const {
    search,
    status,
    seller_role,
    parent_seller_id
  } = req.query

  const conditions = []
  const params = []

  if (!isMissing(search)) {
    const searchTerm = `%${search}%`

    conditions.push(`
      (
        s.full_name LIKE ?
        OR s.email LIKE ?
        OR s.contact_no LIKE ?
        OR s.seller_role LIKE ?
        OR s.status LIKE ?
        OR parent_seller.full_name LIKE ?
      )
    `)

    params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm)
  }

  if (!isMissing(status)) {
    conditions.push('s.status = ?')
    params.push(status)
  }

  if (!isMissing(seller_role)) {
    conditions.push('s.seller_role = ?')
    params.push(seller_role)
  }

  if (!isMissing(parent_seller_id)) {
    conditions.push('s.parent_seller_id = ?')
    params.push(parent_seller_id)
  }

  const whereClause = conditions.length > 0
    ? `WHERE ${conditions.join(' AND ')}`
    : ''

  const [sellers] = await db.query(
    `
    SELECT
      ${sellerFields}
    ${sellerJoins}
    ${whereClause}
    ORDER BY s.id ASC
    `,
    params
  )

  res.status(200).json({
    sellers
  })
}

export const getAccreditedSeller = async (req, res) => {
  const { id } = req.params

  const [rows] = await db.query(
    `
    SELECT
      ${sellerFields}
    ${sellerJoins}
    WHERE s.id = ?
    LIMIT 1
    `,
    [id]
  )

  const seller = rows[0]

  if (!seller) {
    return res.status(404).json({
      message: 'Accredited seller not found'
    })
  }

  res.status(200).json({
    seller
  })
}

export const createAccreditedSeller = async (req, res) => {
  const {
    user_id,
    full_name,
    email,
    contact_no,
    seller_role,
    parent_seller_id,
    status
  } = req.body

  if (isMissing(full_name)) {
    return res.status(400).json({
      message: 'Seller full name is required'
    })
  }

  const nextSellerRole = seller_role || 'agent'
  const nextStatus = status || 'active'
  const nextParentSellerId = nextSellerRole === 'broker_network_manager'
    ? null
    : nullableValue(parent_seller_id)

  if (!allowedSellerRoles.includes(nextSellerRole)) {
    return res.status(400).json({
      message: 'Invalid seller role'
    })
  }

  if (!allowedStatuses.includes(nextStatus)) {
    return res.status(400).json({
      message: 'Invalid seller status'
    })
  }

  if (!isMissing(user_id) && !(await userExists(db, user_id))) {
    return res.status(404).json({
      message: 'Linked user not found'
    })
  }

  const parentValidation = await validateSellerParent(
    db,
    nextSellerRole,
    nextParentSellerId
  )

  if (!parentValidation.isValid) {
    return res.status(400).json({
      message: parentValidation.message
    })
  }

  const [result] = await db.query(
    `
    INSERT INTO accredited_sellers (
      user_id,
      full_name,
      email,
      contact_no,
      seller_role,
      parent_seller_id,
      status
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [
      nullableValue(user_id),
      full_name,
      nullableValue(email),
      nullableValue(contact_no),
      nextSellerRole,
      nextParentSellerId,
      nextStatus
    ]
  )

  await createAuditLog({
    userId: req.user.id,
    action: 'create',
    module: 'Accredited Sellers',
    description: `Created accredited seller ${full_name}`,
    ipAddress: req.ip
  })

  res.status(201).json({
    message: 'Accredited seller created successfully',
    sellerId: result.insertId
  })
}

export const updateAccreditedSeller = async (req, res) => {
  const { id } = req.params
  const {
    user_id,
    full_name,
    email,
    contact_no,
    seller_role,
    parent_seller_id,
    status
  } = req.body

  const [existingRows] = await db.query(
    `
    SELECT id
    FROM accredited_sellers
    WHERE id = ?
    LIMIT 1
    `,
    [id]
  )

  if (!existingRows[0]) {
    return res.status(404).json({
      message: 'Accredited seller not found'
    })
  }

  if (isMissing(full_name)) {
    return res.status(400).json({
      message: 'Seller full name is required'
    })
  }

  if (!allowedSellerRoles.includes(seller_role)) {
    return res.status(400).json({
      message: 'Invalid seller role'
    })
  }

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({
      message: 'Invalid seller status'
    })
  }

  const nextParentSellerId = seller_role === 'broker_network_manager'
    ? null
    : nullableValue(parent_seller_id)

  if (!isMissing(user_id) && !(await userExists(db, user_id))) {
    return res.status(404).json({
      message: 'Linked user not found'
    })
  }

  const parentValidation = await validateSellerParent(
    db,
    seller_role,
    nextParentSellerId,
    id
  )

  if (!parentValidation.isValid) {
    return res.status(400).json({
      message: parentValidation.message
    })
  }

  if (await wouldCreateHierarchyCycle(db, id, nextParentSellerId)) {
    return res.status(400).json({
      message: 'Parent seller cannot be a descendant of this seller'
    })
  }

  const [result] = await db.query(
    `
    UPDATE accredited_sellers
    SET
      user_id = ?,
      full_name = ?,
      email = ?,
      contact_no = ?,
      seller_role = ?,
      parent_seller_id = ?,
      status = ?
    WHERE id = ?
    `,
    [
      nullableValue(user_id),
      full_name,
      nullableValue(email),
      nullableValue(contact_no),
      seller_role,
      nextParentSellerId,
      status,
      id
    ]
  )

  if (result.affectedRows === 0) {
    return res.status(404).json({
      message: 'Accredited seller not found'
    })
  }

  await createAuditLog({
    userId: req.user.id,
    action: 'update',
    module: 'Accredited Sellers',
    description: `Updated accredited seller ${full_name}`,
    ipAddress: req.ip
  })

  res.status(200).json({
    message: 'Accredited seller updated successfully'
  })
}

export const getSellerHierarchy = async (req, res) => {
  const [sellers] = await db.query(
    `
    SELECT
      id,
      full_name,
      seller_role,
      parent_seller_id,
      status
    FROM accredited_sellers
    ORDER BY id ASC
    `
  )

  const sellerMap = new Map()
  const hierarchy = []

  sellers.forEach((seller) => {
    sellerMap.set(seller.id, {
      id: seller.id,
      full_name: seller.full_name,
      seller_role: seller.seller_role,
      status: seller.status,
      children: []
    })
  })

  sellers.forEach((seller) => {
    const hierarchySeller = sellerMap.get(seller.id)

    if (isMissing(seller.parent_seller_id)) {
      hierarchy.push(hierarchySeller)
      return
    }

    const parentSeller = sellerMap.get(seller.parent_seller_id)

    if (parentSeller) {
      parentSeller.children.push(hierarchySeller)
      return
    }

    hierarchy.push(hierarchySeller)
  })

  res.status(200).json({
    hierarchy
  })
}

export const getPossibleParentSellers = async (req, res) => {
  const {
    seller_role,
    current_seller_id
  } = req.query

  if (!allowedSellerRoles.includes(seller_role)) {
    return res.status(400).json({
      message: 'Invalid seller role'
    })
  }

  const requiredParentRole = parentRoleBySellerRole[seller_role]

  if (!requiredParentRole) {
    return res.status(200).json({
      sellers: []
    })
  }

  const conditions = [
    'seller_role = ?',
    'status = ?'
  ]
  const params = [
    requiredParentRole,
    'active'
  ]

  if (!isMissing(current_seller_id)) {
    conditions.push('id <> ?')
    params.push(current_seller_id)
  }

  const [sellers] = await db.query(
    `
    SELECT
      id,
      full_name,
      seller_role,
      parent_seller_id,
      status
    FROM accredited_sellers
    WHERE ${conditions.join(' AND ')}
    ORDER BY id ASC
    `,
    params
  )

  if (!isMissing(current_seller_id)) {
    const filteredSellers = []

    for (const seller of sellers) {
      if (!(await wouldCreateHierarchyCycle(db, current_seller_id, seller.id))) {
        filteredSellers.push(seller)
      }
    }

    return res.status(200).json({
      sellers: filteredSellers
    })
  }

  res.status(200).json({
    sellers
  })
}
