import { db } from '../db/connect.js'
import { safeCreateAuditLog } from '../utils/createAuditLog.js'
import { getClientIp } from '../utils/getClientIp.js'

const allowedSellerRoles = ['broker_network_manager', 'broker', 'manager', 'agent']
const allowedStatuses = ['active', 'inactive']

const sellerParentRoleMap = {
  broker_network_manager: [],
  broker: ['broker_network_manager'],
  manager: ['broker'],
  agent: ['manager'],
}

const isMissing = (value) => {
  return value === undefined || value === null || value === ''
}

const nullableValue = (value) => {
  if (isMissing(value)) return null
  return value
}

const normalizeRate = (value) => {
  if (isMissing(value)) return null
  const parsed = Number(value)
  if (Number.isNaN(parsed)) return null
  return Number(parsed.toFixed(2))
}

const validateRateRange = (rate, label) => {
  if (rate === null) return null
  if (rate < 0 || rate > 100) {
    return `${label} must be between 0 and 100`
  }
  return null
}

const validateCommissionPoolFields = ({
  sellerRole,
  commissionPoolRate,
  personalCommissionRate,
  overrideCommissionRate,
}) => {
  const errors = [
    validateRateRange(commissionPoolRate, 'Commission pool rate'),
    validateRateRange(personalCommissionRate, 'Personal commission rate'),
    validateRateRange(overrideCommissionRate, 'Override commission rate'),
  ].filter(Boolean)

  if (sellerRole === 'agent' && commissionPoolRate !== null) {
    errors.push('Agents cannot have a commission pool rate')
  }

  if (sellerRole === 'broker_network_manager' && overrideCommissionRate !== null) {
    errors.push('Broker network managers should use commission pool rate, not override rate')
  }

  if (errors.length > 0) {
    return {
      isValid: false,
      message: errors.join('. '),
    }
  }

  return { isValid: true }
}

const normalizeMoney = (value) => {
  return Number(Number(value || 0).toFixed(2))
}

const sellerFields = `
  seller.id,
  seller.user_id,
  user.full_name AS user_full_name,
  seller.full_name,
  seller.email,
  seller.contact_no,
  seller.seller_role,
  seller.parent_seller_id,
  parent.full_name AS parent_seller_name,
  seller.custom_reports_under,
  COALESCE(parent.full_name, seller.custom_reports_under, 'None') AS reports_under_display,
  seller.status,
  seller.accreditation_date,
  seller.commission_rate,
  seller.commission_pool_rate,
  seller.personal_commission_rate,
  seller.override_commission_rate,
  seller.residual_commission_rate,
  seller.max_downline_rate,
  seller.rate_set_by,
  rateSetter.full_name AS rate_set_by_name,
  seller.rate_updated_at,
  seller.created_at,
  seller.updated_at
`

const sellerJoins = `
  FROM accredited_sellers seller
  LEFT JOIN users user ON user.id = seller.user_id
  LEFT JOIN accredited_sellers parent ON parent.id = seller.parent_seller_id
  LEFT JOIN users rateSetter ON rateSetter.id = seller.rate_set_by
`

const getSellerById = async (sellerId, connectionOrDb = db) => {
  const [rows] = await connectionOrDb.query(
    `
    SELECT
      ${sellerFields}
    ${sellerJoins}
    WHERE seller.id = ?
    LIMIT 1
    `,
    [sellerId]
  )

  return rows[0] || null
}

const validateSellerRole = (sellerRole) => {
  if (isMissing(sellerRole)) return 'agent'
  if (!allowedSellerRoles.includes(sellerRole)) return null
  return sellerRole
}

const validateStatus = (status) => {
  if (isMissing(status)) return 'active'
  if (!allowedStatuses.includes(status)) return null
  return status
}

const validateParentSeller = async ({
  connectionOrDb = db,
  sellerId = null,
  sellerRole = 'agent',
  parentSellerId,
}) => {
  const allowedParentRoles = sellerParentRoleMap[sellerRole] || []

  if (isMissing(parentSellerId)) {
    if (allowedParentRoles.length === 0) return null
    return { isValid: false, message: `A ${sellerRole.replaceAll('_', ' ')} must report under a ${allowedParentRoles.join(' or ').replaceAll('_', ' ')}` }
  }

  if (!isMissing(sellerId) && Number(sellerId) === Number(parentSellerId)) {
    return {
      isValid: false,
      message: 'Seller cannot report under themselves',
    }
  }

  const parentSeller = await getSellerById(parentSellerId, connectionOrDb)

  if (!parentSeller) {
    return {
      isValid: false,
      message: 'Parent seller not found',
    }
  }

  if (parentSeller.status !== 'active') {
    return {
      isValid: false,
      message: 'Parent seller is inactive',
    }
  }

  if (!allowedParentRoles.includes(parentSeller.seller_role)) {
    return {
      isValid: false,
      message: `A ${sellerRole.replaceAll('_', ' ')} can only report under: ${allowedParentRoles.join(', ').replaceAll('_', ' ') || 'none'}`,
    }
  }

  return null
}

const syncOpenCommissionsForSellerRate = async ({
  connection,
  sellerId,
  commissionRate,
}) => {
  const finalRate = normalizeRate(commissionRate)

  if (isMissing(sellerId) || finalRate === null) {
    return {
      updatedCommissions: 0,
      updatedReleases: 0,
    }
  }

  const [commissionRows] = await connection.query(
    `
    SELECT
      cm.id,
      cm.client_unit_id,
      cm.commission_base
    FROM commissions cm
    WHERE cm.seller_id = ?
      AND cm.status IN ('active', 'partially_released', 'on_hold')
      AND NOT EXISTS (
        SELECT 1
        FROM commission_releases cr
        WHERE cr.commission_id = cm.id
          AND cr.status = 'released'
      )
    `,
    [sellerId]
  )

  let updatedReleases = 0

  for (const commission of commissionRows) {
    const nextGrossCommission = normalizeMoney(
      normalizeMoney(commission.commission_base) * (finalRate / 100)
    )

    await connection.query(
      `
      UPDATE commissions
      SET
        rate = ?,
        gross_commission = ?,
        amount = ?
      WHERE id = ?
      `,
      [
        finalRate,
        nextGrossCommission,
        nextGrossCommission,
        commission.id,
      ]
    )

    const [releaseResult] = await connection.query(
      `
      UPDATE commission_releases
      SET
        gross_release_amount = ROUND(? * (release_percent / 100), 2),
        net_release_amount = GREATEST(
          ROUND(? * (release_percent / 100), 2) - cash_advance_deduction,
          0
        )
      WHERE commission_id = ?
        AND status IN ('pending', 'eligible', 'on_hold')
      `,
      [
        nextGrossCommission,
        nextGrossCommission,
        commission.id,
      ]
    )

    updatedReleases += releaseResult.affectedRows
  }

  return {
    updatedCommissions: commissionRows.length,
    updatedReleases,
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

  const [sellers] = await db.query(
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
    message: 'Accredited sellers fetched successfully',
    accreditedSellers: sellers,
    sellers,
    data: sellers,
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
    message: 'Accredited seller fetched successfully',
    seller,
    accreditedSeller: seller,
    data: seller,
  })
}

export const createAccreditedSeller = async (req, res) => {
  const {
    full_name,
    email,
    contact_no,
    seller_role,
    parent_seller_id,
    custom_reports_under,
    status,
    accreditation_date,
    commission_rate,
    commission_pool_rate,
    personal_commission_rate,
    override_commission_rate,
    max_downline_rate,
  } = req.body

  if (isMissing(full_name)) {
    return res.status(400).json({
      message: 'Full name is required',
    })
  }

  const finalSellerRole = validateSellerRole(seller_role)

  if (!finalSellerRole) {
    return res.status(400).json({
      message: 'Invalid seller role',
    })
  }

  const finalStatus = validateStatus(status)

  if (!finalStatus) {
    return res.status(400).json({
      message: 'Invalid seller status',
    })
  }

  const parentValidation = await validateParentSeller({
    sellerRole: finalSellerRole,
    parentSellerId: parent_seller_id,
  })

  if (parentValidation && !parentValidation.isValid) {
    return res.status(400).json({
      message: parentValidation.message,
    })
  }

  const finalCommissionPoolRate = normalizeRate(commission_pool_rate)
  const finalPersonalCommissionRate = normalizeRate(personal_commission_rate)
  const finalOverrideCommissionRate = normalizeRate(override_commission_rate)
  const finalMaxDownlineRate = normalizeRate(max_downline_rate)

  const rateValidation = validateCommissionPoolFields({
    sellerRole: finalSellerRole,
    commissionPoolRate: finalCommissionPoolRate,
    personalCommissionRate: finalPersonalCommissionRate,
    overrideCommissionRate: finalOverrideCommissionRate,
  })

  if (!rateValidation.isValid) {
    return res.status(400).json({
      message: rateValidation.message,
    })
  }

  const connection = await db.getConnection()

  try {
    await connection.beginTransaction()

    const [result] = await connection.query(
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
        accreditation_date,
        commission_rate,
        commission_pool_rate,
        personal_commission_rate,
        override_commission_rate,
        max_downline_rate,
        rate_set_by,
        rate_updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `,
      [
        null,
        full_name,
        nullableValue(email),
        nullableValue(contact_no),
        finalSellerRole,
        nullableValue(parent_seller_id),
        nullableValue(custom_reports_under),
        finalStatus,
        nullableValue(accreditation_date),
        normalizeRate(commission_rate),
        finalCommissionPoolRate,
        finalPersonalCommissionRate,
        finalOverrideCommissionRate,
        finalMaxDownlineRate,
        req.user?.id || null,
      ]
    )

    await connection.commit()

    await safeCreateAuditLog({
      userId: req.user.id,
      action: 'create',
      module: 'Accredited Sellers',
      description: `Created accredited seller ${full_name}`,
      ipAddress: getClientIp(req),
    })

    res.status(201).json({
      message: 'Accredited seller created successfully',
      sellerId: result.insertId,
      data: {
        sellerId: result.insertId,
      },
    })
  } catch (err) {
    await connection.rollback()
    throw err
  } finally {
    connection.release()
  }
}

export const updateAccreditedSeller = async (req, res) => {
  const { id } = req.params

  const {
    full_name,
    email,
    contact_no,
    seller_role,
    parent_seller_id,
    custom_reports_under,
    status,
    accreditation_date,
    commission_rate,
    commission_pool_rate,
    personal_commission_rate,
    override_commission_rate,
    max_downline_rate,
  } = req.body

  if (isMissing(full_name)) {
    return res.status(400).json({
      message: 'Full name is required',
    })
  }

  const existingSeller = await getSellerById(id)

  if (!existingSeller) {
    return res.status(404).json({
      message: 'Accredited seller not found',
    })
  }

  // Accredited Sellers page now edits basic seller information only.
  // Role, reports-under, and commission rates are managed from User Management.
  // These fallbacks prevent basic edits from accidentally resetting hierarchy/rates.
  const finalSellerRole = validateSellerRole(
    isMissing(seller_role) ? existingSeller.seller_role : seller_role
  )

  if (!finalSellerRole) {
    return res.status(400).json({
      message: 'Invalid seller role',
    })
  }

  const finalStatus = validateStatus(status)

  if (!finalStatus) {
    return res.status(400).json({
      message: 'Invalid seller status',
    })
  }

  const finalParentSellerId = isMissing(parent_seller_id)
    ? existingSeller.parent_seller_id
    : parent_seller_id
  const finalCustomReportsUnder = custom_reports_under === undefined
    ? existingSeller.custom_reports_under
    : custom_reports_under

  const parentValidation = await validateParentSeller({
    sellerId: id,
    sellerRole: finalSellerRole,
    parentSellerId: finalParentSellerId,
  })

  if (parentValidation && !parentValidation.isValid) {
    return res.status(400).json({
      message: parentValidation.message,
    })
  }

  const oldRate =
    existingSeller.commission_rate === null ||
    existingSeller.commission_rate === undefined
      ? null
      : normalizeRate(existingSeller.commission_rate)

  const newRate = commission_rate === undefined
    ? oldRate
    : normalizeRate(commission_rate)
  const finalCommissionPoolRate = commission_pool_rate === undefined
    ? normalizeRate(existingSeller.commission_pool_rate)
    : normalizeRate(commission_pool_rate)
  const finalPersonalCommissionRate = personal_commission_rate === undefined
    ? normalizeRate(existingSeller.personal_commission_rate)
    : normalizeRate(personal_commission_rate)
  const finalOverrideCommissionRate = override_commission_rate === undefined
    ? normalizeRate(existingSeller.override_commission_rate)
    : normalizeRate(override_commission_rate)
  const finalMaxDownlineRate = max_downline_rate === undefined
    ? normalizeRate(existingSeller.max_downline_rate)
    : normalizeRate(max_downline_rate)

  const rateValidation = validateCommissionPoolFields({
    sellerRole: finalSellerRole,
    commissionPoolRate: finalCommissionPoolRate,
    personalCommissionRate: finalPersonalCommissionRate,
    overrideCommissionRate: finalOverrideCommissionRate,
  })

  if (!rateValidation.isValid) {
    return res.status(400).json({
      message: rateValidation.message,
    })
  }

  const rateChanged = String(oldRate ?? '') !== String(newRate ?? '')

  const connection = await db.getConnection()

  try {
    await connection.beginTransaction()

    await connection.query(
      `
      UPDATE accredited_sellers
      SET
        full_name = ?,
        email = ?,
        contact_no = ?,
        seller_role = ?,
        parent_seller_id = ?,
        custom_reports_under = ?,
        status = ?,
        accreditation_date = ?,
        commission_rate = ?,
        commission_pool_rate = ?,
        personal_commission_rate = ?,
        override_commission_rate = ?,
        max_downline_rate = ?,
        rate_set_by = ?,
        rate_updated_at = CASE
          WHEN ? = 1 THEN NOW()
          ELSE rate_updated_at
        END
      WHERE id = ?
      `,
      [
        full_name,
        nullableValue(email),
        nullableValue(contact_no),
        finalSellerRole,
        nullableValue(finalParentSellerId),
        nullableValue(finalCustomReportsUnder),
        finalStatus,
        nullableValue(accreditation_date),
        newRate,
        finalCommissionPoolRate,
        finalPersonalCommissionRate,
        finalOverrideCommissionRate,
        finalMaxDownlineRate,
        req.user?.id || null,
        rateChanged ? 1 : 0,
        id,
      ]
    )

    let commissionSync = {
      updatedCommissions: 0,
      updatedReleases: 0,
    }

    if (rateChanged && newRate !== null) {
      commissionSync = await syncOpenCommissionsForSellerRate({
        connection,
        sellerId: id,
        commissionRate: newRate,
      })
    }

    await connection.commit()

    await safeCreateAuditLog({
      userId: req.user.id,
      action: 'update',
      module: 'Accredited Sellers',
      description: `Updated accredited seller ${full_name}. Synced ${commissionSync.updatedCommissions} open commission(s).`,
      ipAddress: getClientIp(req),
    })

    res.status(200).json({
      message: 'Accredited seller updated successfully',
      data: {
        sellerId: Number(id),
        commissionSync,
      },
    })
  } catch (err) {
    await connection.rollback()
    throw err
  } finally {
    connection.release()
  }
}

export const getSellerHierarchy = async (req, res) => {
  const [sellers] = await db.query(
    `
    SELECT
      ${sellerFields}
    ${sellerJoins}
    ORDER BY
      CASE seller.seller_role
        WHEN 'broker_network_manager' THEN 1
        WHEN 'broker' THEN 2
        WHEN 'manager' THEN 3
        WHEN 'agent' THEN 4
        ELSE 5
      END,
      seller.full_name ASC
    `
  )

  const sellerMap = new Map()

  sellers.forEach((seller) => {
    sellerMap.set(seller.id, {
      ...seller,
      children: [],
    })
  })

  const hierarchy = []

  sellerMap.forEach((seller) => {
    if (seller.parent_seller_id && sellerMap.has(seller.parent_seller_id)) {
      sellerMap.get(seller.parent_seller_id).children.push(seller)
    } else {
      hierarchy.push(seller)
    }
  })

  res.status(200).json({
    message: 'Seller hierarchy fetched successfully',
    hierarchy,
    data: hierarchy,
  })
}

export const getPossibleParentSellers = async (req, res) => {
  const { exclude_id, seller_role } = req.query

  const conditions = [
    `seller.status = 'active'`,
  ]

  const params = []

  if (!isMissing(exclude_id)) {
    conditions.push('seller.id <> ?')
    params.push(exclude_id)
  }

  const allowedParentRoles = sellerParentRoleMap[seller_role] || []
  if (!isMissing(seller_role)) {
    if (allowedParentRoles.length === 0) {
      return res.status(200).json({
        message: 'No parent sellers required for this role',
        possibleParentSellers: [],
        data: [],
      })
    }
    conditions.push(`seller.seller_role IN (${allowedParentRoles.map(() => '?').join(',')})`)
    params.push(...allowedParentRoles)
  }

  const [sellers] = await db.query(
    `
    SELECT
      ${sellerFields}
    ${sellerJoins}
    WHERE ${conditions.join(' AND ')}
    ORDER BY
      CASE seller.seller_role
        WHEN 'broker_network_manager' THEN 1
        WHEN 'broker' THEN 2
        WHEN 'manager' THEN 3
        WHEN 'agent' THEN 4
        ELSE 5
      END,
      seller.full_name ASC
    `,
    params
  )

  res.status(200).json({
    message: 'Possible parent sellers fetched successfully',
    possibleParentSellers: sellers,
    data: sellers,
  })
}


export const deleteAccreditedSeller = async (req, res) => {
  const { id } = req.params

  const seller = await getSellerById(id)

  if (!seller) {
    return res.status(404).json({ message: 'Accredited seller not found' })
  }

  const [commissionRows] = await db.query(
    `SELECT id FROM commissions WHERE seller_id = ? LIMIT 1`,
    [id]
  )

  if (commissionRows.length > 0) {
    return res.status(400).json({
      message: 'Cannot delete a seller with existing commissions. Set them to inactive instead.'
    })
  }

  const [unitRows] = await db.query(
    `SELECT id FROM client_units WHERE seller_id = ? LIMIT 1`,
    [id]
  )

  if (unitRows.length > 0) {
    return res.status(400).json({
      message: 'Cannot delete a seller assigned to a client unit. Reassign or set inactive instead.'
    })
  }

  const [childRows] = await db.query(
    `SELECT id FROM accredited_sellers WHERE parent_seller_id = ? LIMIT 1`,
    [id]
  )

  if (childRows.length > 0) {
    return res.status(400).json({
      message: 'Cannot delete a seller that has sub-sellers reporting under them.'
    })
  }

  const [clientRows] = await db.query(
    `SELECT id FROM clients WHERE default_seller_id = ? LIMIT 1`,
    [id]
  )

  if (clientRows.length > 0) {
    return res.status(400).json({
      message: 'Cannot delete a seller used as the default seller for existing clients. Reassign or set inactive instead.'
    })
  }

  await db.query(`DELETE FROM accredited_sellers WHERE id = ?`, [id])

  await safeCreateAuditLog({
    userId: req.user.id,
    action: 'delete',
    module: 'Accredited Sellers',
    description: `Deleted accredited seller ${seller.full_name}`,
    ipAddress: getClientIp(req)
  })

  res.status(200).json({ message: 'Accredited seller deleted successfully' })
}

