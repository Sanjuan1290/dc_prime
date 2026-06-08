import { db } from '../db/connect.js'
import { createAuditLog } from '../utils/createAuditLog.js'
import { getClientIp } from '../utils/getClientIp.js'

const sellerRoles = ['broker_network_manager', 'broker', 'agent']

const isMissing = (value) => {
  return value === undefined || value === null || value === ''
}

const nullableValue = (value) => {
  if (isMissing(value)) return null
  return value
}

const normalizeSellerRole = (role) => {
  if (isMissing(role)) return 'agent'
  return String(role)
}

const validateSellerRole = (role) => {
  return sellerRoles.includes(role)
}

const sellerFields = `
  seller.id,
  seller.user_id,
  seller.full_name,
  seller.email,
  seller.contact_no,
  seller.seller_role,
  seller.parent_seller_id,
  parent.full_name AS parent_seller_name,
  parent.seller_role AS parent_seller_role,
  seller.custom_reports_under,
  COALESCE(parent.full_name, seller.custom_reports_under, 'None') AS reports_under_display,
  seller.status,
  seller.accreditation_date,
  seller.created_at,
  seller.updated_at
`

const sellerJoins = `
  FROM accredited_sellers seller
  LEFT JOIN accredited_sellers parent
    ON parent.id = seller.parent_seller_id
`

const mapSeller = (seller) => ({
  ...seller,
  reports_under_display:
    seller.parent_seller_name || seller.custom_reports_under || 'None',
})

const getSellerById = async (id) => {
  const [rows] = await db.query(
    `
    SELECT
      ${sellerFields}
    ${sellerJoins}
    WHERE seller.id = ?
    LIMIT 1
    `,
    [id]
  )

  return rows[0] ? mapSeller(rows[0]) : null
}

const validateParentSeller = async ({ sellerId = null, parentSellerId }) => {
  if (isMissing(parentSellerId)) {
    return {
      isValid: true,
      message: null,
    }
  }

  if (sellerId && Number(sellerId) === Number(parentSellerId)) {
    return {
      isValid: false,
      message: 'Seller cannot report under themselves',
    }
  }

  const [rows] = await db.query(
    `
    SELECT id
    FROM accredited_sellers
    WHERE id = ?
      AND status = 'active'
    LIMIT 1
    `,
    [parentSellerId]
  )

  if (rows.length === 0) {
    return {
      isValid: false,
      message: 'Reports under seller not found or inactive',
    }
  }

  return {
    isValid: true,
    message: null,
  }
}

const buildReportsUnderValues = ({ parent_seller_id, custom_reports_under }) => {
  const hasCustomReportsUnder = !isMissing(custom_reports_under)

  if (hasCustomReportsUnder) {
    return {
      parentSellerId: null,
      customReportsUnder: String(custom_reports_under).trim(),
    }
  }

  return {
    parentSellerId: nullableValue(parent_seller_id),
    customReportsUnder: null,
  }
}

export const getAccreditedSellers = async (req, res) => {
  const { search, status, seller_role } = req.query

  const conditions = []
  const params = []

  if (!isMissing(search)) {
    const searchTerm = `%${search}%`

    conditions.push(`
      (
        seller.full_name LIKE ?
        OR seller.email LIKE ?
        OR seller.contact_no LIKE ?
        OR seller.seller_role LIKE ?
        OR seller.status LIKE ?
        OR parent.full_name LIKE ?
        OR seller.custom_reports_under LIKE ?
      )
    `)

    params.push(
      searchTerm,
      searchTerm,
      searchTerm,
      searchTerm,
      searchTerm,
      searchTerm,
      searchTerm
    )
  }

  if (!isMissing(status) && status !== 'all') {
    conditions.push('seller.status = ?')
    params.push(status)
  }

  if (!isMissing(seller_role) && seller_role !== 'all') {
    conditions.push('seller.seller_role = ?')
    params.push(seller_role)
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const [rows] = await db.query(
    `
    SELECT
      ${sellerFields}
    ${sellerJoins}
    ${whereClause}
    ORDER BY seller.id DESC
    `,
    params
  )

  res.status(200).json({
    accreditedSellers: rows.map(mapSeller),
  })
}

export const getAccreditedSeller = async (req, res) => {
  const { id } = req.params

  const seller = await getSellerById(id)

  if (!seller) {
    return res.status(404).json({
      message: 'Accredited seller not found',
    })
  }

  res.status(200).json({
    accreditedSeller: seller,
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
    custom_reports_under,
    status = 'active',
    accreditation_date,
  } = req.body

  if (isMissing(full_name)) {
    return res.status(400).json({
      message: 'Seller full name is required',
    })
  }

  const finalSellerRole = normalizeSellerRole(seller_role)

  if (!validateSellerRole(finalSellerRole)) {
    return res.status(400).json({
      message: 'Invalid seller role',
    })
  }

  const { parentSellerId, customReportsUnder } = buildReportsUnderValues({
    parent_seller_id,
    custom_reports_under,
  })

  const parentValidation = await validateParentSeller({
    parentSellerId,
  })

  if (!parentValidation.isValid) {
    return res.status(400).json({
      message: parentValidation.message,
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
      custom_reports_under,
      status,
      accreditation_date
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      nullableValue(user_id),
      full_name,
      nullableValue(email),
      nullableValue(contact_no),
      finalSellerRole,
      parentSellerId,
      customReportsUnder,
      status,
      nullableValue(accreditation_date),
    ]
  )

  await createAuditLog({
    userId: req.user.id,
    action: 'create',
    module: 'Accredited Sellers',
    description: `Created accredited seller ${full_name}`,
    ipAddress: getClientIp(req),
  })

  res.status(201).json({
    message: 'Accredited seller created successfully',
    sellerId: result.insertId,
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
    custom_reports_under,
    status = 'active',
    accreditation_date,
  } = req.body

  if (isMissing(full_name)) {
    return res.status(400).json({
      message: 'Seller full name is required',
    })
  }

  const existingSeller = await getSellerById(id)

  if (!existingSeller) {
    return res.status(404).json({
      message: 'Accredited seller not found',
    })
  }

  const finalSellerRole = normalizeSellerRole(seller_role)

  if (!validateSellerRole(finalSellerRole)) {
    return res.status(400).json({
      message: 'Invalid seller role',
    })
  }

  const { parentSellerId, customReportsUnder } = buildReportsUnderValues({
    parent_seller_id,
    custom_reports_under,
  })

  const parentValidation = await validateParentSeller({
    sellerId: id,
    parentSellerId,
  })

  if (!parentValidation.isValid) {
    return res.status(400).json({
      message: parentValidation.message,
    })
  }

  await db.query(
    `
    UPDATE accredited_sellers
    SET
      user_id = ?,
      full_name = ?,
      email = ?,
      contact_no = ?,
      seller_role = ?,
      parent_seller_id = ?,
      custom_reports_under = ?,
      status = ?,
      accreditation_date = ?
    WHERE id = ?
    `,
    [
      nullableValue(user_id),
      full_name,
      nullableValue(email),
      nullableValue(contact_no),
      finalSellerRole,
      parentSellerId,
      customReportsUnder,
      status,
      nullableValue(accreditation_date),
      id,
    ]
  )

  await createAuditLog({
    userId: req.user.id,
    action: 'update',
    module: 'Accredited Sellers',
    description: `Updated accredited seller ${full_name}`,
    ipAddress: getClientIp(req),
  })

  res.status(200).json({
    message: 'Accredited seller updated successfully',
  })
}

export const getPossibleParentSellers = async (req, res) => {
  const { exclude_id } = req.query

  const conditions = ['seller.status = ?']
  const params = ['active']

  if (!isMissing(exclude_id)) {
    conditions.push('seller.id <> ?')
    params.push(exclude_id)
  }

  const [rows] = await db.query(
    `
    SELECT
      seller.id,
      seller.user_id,
      seller.full_name,
      seller.email,
      seller.contact_no,
      seller.seller_role,
      seller.parent_seller_id,
      parent.full_name AS parent_seller_name,
      parent.seller_role AS parent_seller_role,
      seller.custom_reports_under,
      COALESCE(parent.full_name, seller.custom_reports_under, 'None') AS reports_under_display,
      seller.status,
      seller.accreditation_date,
      seller.created_at,
      seller.updated_at
    FROM accredited_sellers seller
    LEFT JOIN accredited_sellers parent
      ON parent.id = seller.parent_seller_id
    WHERE ${conditions.join(' AND ')}
    ORDER BY
      FIELD(seller.seller_role, 'broker_network_manager', 'broker', 'agent'),
      seller.full_name ASC
    `,
    params
  )

  res.status(200).json({
    possibleParentSellers: rows.map(mapSeller),
  })
}

export const getSellerHierarchy = async (req, res) => {
  const [rows] = await db.query(
    `
    SELECT
      ${sellerFields}
    ${sellerJoins}
    ORDER BY
      FIELD(seller.seller_role, 'broker_network_manager', 'broker', 'agent'),
      seller.full_name ASC
    `
  )

  const sellers = rows.map(mapSeller)

  const brokerNetworkManagers = sellers.filter(
    (seller) => seller.seller_role === 'broker_network_manager'
  )

  const brokers = sellers.filter((seller) => seller.seller_role === 'broker')

  const agents = sellers.filter((seller) => seller.seller_role === 'agent')

  res.status(200).json({
    brokerNetworkManagers,
    brokers,
    agents,
    sellers,
  })
}