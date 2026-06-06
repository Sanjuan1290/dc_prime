import { db } from '../db/connect.js'
import { createAuditLog } from '../utils/createAuditLog.js'

const allowedCommissionStatuses = [
  'pending',
  'payable',
  'released',
  'cancelled'
]

const sellerRoles = [
  'agent',
  'manager',
  'broker',
  'broker_network_manager'
]

const isMissing = (value) => {
  return value === undefined || value === null || value === ''
}

const normalizeMoney = (value) => {
  return Number(Number(value).toFixed(2))
}

const validateNonNegativeNumber = (value) => {
  const parsedValue = Number(value)

  return {
    isValid: !Number.isNaN(parsedValue) && parsedValue >= 0,
    value: parsedValue
  }
}

export const computeCommissionAmount = (netSellingPrice, rate) => {
  return normalizeMoney(Number(netSellingPrice) * (Number(rate) / 100))
}

const commissionFields = `
  cm.id,
  cm.client_unit_id,
  cm.seller_id,
  seller.full_name AS seller_name,
  seller.seller_role,
  client.full_name AS client_name,
  listing.unit_id,
  project.name AS project_name,
  listing.net_selling_price,
  cm.rate,
  cm.amount,
  cm.released_amount,
  GREATEST(cm.amount - cm.released_amount, 0) AS remaining_amount,
  cm.status,
  cm.created_at,
  cm.updated_at
`

const commissionJoins = `
  FROM commissions cm
  INNER JOIN client_units cu ON cu.id = cm.client_unit_id
  INNER JOIN clients client ON client.id = cu.client_id
  INNER JOIN listings listing ON listing.id = cu.listing_id
  INNER JOIN projects project ON project.id = listing.project_id
  INNER JOIN accredited_sellers seller ON seller.id = cm.seller_id
`

const getClientUnitWithListing = async (connectionOrDb, clientUnitId) => {
  const [rows] = await connectionOrDb.query(
    `
    SELECT
      cu.id,
      cu.listing_id,
      listing.net_selling_price
    FROM client_units cu
    INNER JOIN listings listing ON listing.id = cu.listing_id
    WHERE cu.id = ?
    LIMIT 1
    `,
    [clientUnitId]
  )

  return rows[0]
}

const getActiveSeller = async (connectionOrDb, sellerId) => {
  const [rows] = await connectionOrDb.query(
    `
    SELECT
      id,
      full_name,
      seller_role,
      parent_seller_id,
      status
    FROM accredited_sellers
    WHERE id = ?
    LIMIT 1
    `,
    [sellerId]
  )

  return rows[0]
}

const hasDuplicateCommission = async (
  connectionOrDb,
  clientUnitId,
  sellerId,
  currentCommissionId = null
) => {
  const conditions = [
    'client_unit_id = ?',
    'seller_id = ?'
  ]
  const params = [
    clientUnitId,
    sellerId
  ]

  if (!isMissing(currentCommissionId)) {
    conditions.push('id <> ?')
    params.push(currentCommissionId)
  }

  const [rows] = await connectionOrDb.query(
    `
    SELECT id
    FROM commissions
    WHERE ${conditions.join(' AND ')}
    LIMIT 1
    `,
    params
  )

  return rows.length > 0
}

const validateCommissionPayload = async (
  connectionOrDb,
  {
    client_unit_id,
    seller_id,
    rate,
    released_amount,
    status,
    currentCommissionId = null,
    allowInactiveSeller = false,
    defaultStatus = 'pending'
  }
) => {
  if (isMissing(client_unit_id)) {
    return {
      isValid: false,
      statusCode: 400,
      message: 'Client unit ID is required'
    }
  }

  if (isMissing(seller_id)) {
    return {
      isValid: false,
      statusCode: 400,
      message: 'Seller ID is required'
    }
  }

  if (isMissing(rate)) {
    return {
      isValid: false,
      statusCode: 400,
      message: 'Commission rate is required'
    }
  }

  const rateValidation = validateNonNegativeNumber(rate)

  if (!rateValidation.isValid) {
    return {
      isValid: false,
      statusCode: 400,
      message: 'Commission rate must be greater than or equal to 0'
    }
  }

  const releasedAmountValidation = validateNonNegativeNumber(
    isMissing(released_amount) ? 0 : released_amount
  )

  if (!releasedAmountValidation.isValid) {
    return {
      isValid: false,
      statusCode: 400,
      message: 'Released amount cannot be less than 0'
    }
  }

  if (isMissing(status) && isMissing(defaultStatus)) {
    return {
      isValid: false,
      statusCode: 400,
      message: 'Commission status is required'
    }
  }

  const nextStatus = isMissing(status) ? defaultStatus : status

  if (!allowedCommissionStatuses.includes(nextStatus)) {
    return {
      isValid: false,
      statusCode: 400,
      message: 'Invalid commission status'
    }
  }

  const clientUnit = await getClientUnitWithListing(connectionOrDb, client_unit_id)

  if (!clientUnit) {
    return {
      isValid: false,
      statusCode: 404,
      message: 'Client unit not found'
    }
  }

  const seller = await getActiveSeller(connectionOrDb, seller_id)

  if (!seller) {
    return {
      isValid: false,
      statusCode: 404,
      message: 'Seller not found'
    }
  }

  if (!allowInactiveSeller && seller.status !== 'active') {
    return {
      isValid: false,
      statusCode: 403,
      message: 'Seller is not active'
    }
  }

  if (
    await hasDuplicateCommission(
      connectionOrDb,
      client_unit_id,
      seller_id,
      currentCommissionId
    )
  ) {
    return {
      isValid: false,
      statusCode: 409,
      message: 'Commission already exists for this seller and client unit'
    }
  }

  const amount = computeCommissionAmount(clientUnit.net_selling_price, rateValidation.value)
  const releasedAmount = normalizeMoney(releasedAmountValidation.value)

  if (releasedAmount > amount) {
    return {
      isValid: false,
      statusCode: 400,
      message: 'Released amount cannot be greater than commission amount'
    }
  }

  return {
    isValid: true,
    clientUnit,
    seller,
    rate: rateValidation.value,
    releasedAmount,
    amount,
    remainingAmount: normalizeMoney(amount - releasedAmount),
    status: releasedAmount === amount ? 'released' : nextStatus
  }
}

export const getCommissions = async (req, res) => {
  const {
    search,
    client_unit_id,
    seller_id,
    status,
    seller_role
  } = req.query

  const conditions = []
  const params = []

  if (!isMissing(search)) {
    const searchTerm = `%${search}%`

    conditions.push(`
      (
        seller.full_name LIKE ?
        OR client.full_name LIKE ?
        OR listing.unit_id LIKE ?
        OR project.name LIKE ?
        OR cm.status LIKE ?
        OR seller.seller_role LIKE ?
      )
    `)

    params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm)
  }

  if (!isMissing(client_unit_id)) {
    conditions.push('cm.client_unit_id = ?')
    params.push(client_unit_id)
  }

  if (!isMissing(seller_id)) {
    conditions.push('cm.seller_id = ?')
    params.push(seller_id)
  }

  if (!isMissing(status)) {
    conditions.push('cm.status = ?')
    params.push(status)
  }

  if (!isMissing(seller_role)) {
    conditions.push('seller.seller_role = ?')
    params.push(seller_role)
  }

  const whereClause = conditions.length > 0
    ? `WHERE ${conditions.join(' AND ')}`
    : ''

  const [commissions] = await db.query(
    `
    SELECT
      ${commissionFields}
    ${commissionJoins}
    ${whereClause}
    ORDER BY cm.id DESC
    `,
    params
  )

  res.status(200).json({
    commissions
  })
}

export const getCommission = async (req, res) => {
  const { id } = req.params

  const [rows] = await db.query(
    `
    SELECT
      ${commissionFields}
    ${commissionJoins}
    WHERE cm.id = ?
    LIMIT 1
    `,
    [id]
  )

  const commission = rows[0]

  if (!commission) {
    return res.status(404).json({
      message: 'Commission not found'
    })
  }

  res.status(200).json({
    commission
  })
}

export const getCommissionsByClientUnit = async (req, res) => {
  const { clientUnitId } = req.params

  const clientUnit = await getClientUnitWithListing(db, clientUnitId)

  if (!clientUnit) {
    return res.status(404).json({
      message: 'Client unit not found'
    })
  }

  const [commissions] = await db.query(
    `
    SELECT
      ${commissionFields}
    ${commissionJoins}
    WHERE cm.client_unit_id = ?
    ORDER BY cm.id DESC
    `,
    [clientUnitId]
  )

  res.status(200).json({
    commissions
  })
}

export const createCommission = async (req, res) => {
  const {
    client_unit_id,
    seller_id,
    rate,
    released_amount,
    status
  } = req.body

  const validation = await validateCommissionPayload(db, {
    client_unit_id,
    seller_id,
    rate,
    released_amount,
    status
  })

  if (!validation.isValid) {
    return res.status(validation.statusCode).json({
      message: validation.message
    })
  }

  const [result] = await db.query(
    `
    INSERT INTO commissions (
      client_unit_id,
      seller_id,
      rate,
      amount,
      released_amount,
      status
    ) VALUES (?, ?, ?, ?, ?, ?)
    `,
    [
      client_unit_id,
      seller_id,
      validation.rate,
      validation.amount,
      validation.releasedAmount,
      validation.status
    ]
  )

  await createAuditLog({
    userId: req.user.id,
    action: 'create',
    module: 'Commissions',
    description: `Created commission for client unit ${client_unit_id}`,
    ipAddress: req.ip
  })

  res.status(201).json({
    message: 'Commission created successfully',
    commissionId: result.insertId,
    amount: validation.amount,
    remainingAmount: validation.remainingAmount
  })
}

export const updateCommission = async (req, res) => {
  const { id } = req.params
  const {
    client_unit_id,
    seller_id,
    rate,
    released_amount,
    status
  } = req.body

  const [commissionRows] = await db.query(
    `
    SELECT id
    FROM commissions
    WHERE id = ?
    LIMIT 1
    `,
    [id]
  )

  if (!commissionRows[0]) {
    return res.status(404).json({
      message: 'Commission not found'
    })
  }

  const validation = await validateCommissionPayload(db, {
    client_unit_id,
    seller_id,
    rate,
    released_amount,
    status,
    currentCommissionId: id,
    allowInactiveSeller: status === 'cancelled',
    defaultStatus: null
  })

  if (!validation.isValid) {
    return res.status(validation.statusCode).json({
      message: validation.message
    })
  }

  const [result] = await db.query(
    `
    UPDATE commissions
    SET
      client_unit_id = ?,
      seller_id = ?,
      rate = ?,
      amount = ?,
      released_amount = ?,
      status = ?
    WHERE id = ?
    `,
    [
      client_unit_id,
      seller_id,
      validation.rate,
      validation.amount,
      validation.releasedAmount,
      validation.status,
      id
    ]
  )

  if (result.affectedRows === 0) {
    return res.status(404).json({
      message: 'Commission not found'
    })
  }

  await createAuditLog({
    userId: req.user.id,
    action: 'update',
    module: 'Commissions',
    description: `Updated commission ${id}`,
    ipAddress: req.ip
  })

  res.status(200).json({
    message: 'Commission updated successfully',
    amount: validation.amount,
    remainingAmount: validation.remainingAmount
  })
}

export const getCommissionSummary = async (req, res) => {
  const [rows] = await db.query(
    `
    SELECT
      COALESCE(SUM(CASE WHEN status <> 'cancelled' THEN amount ELSE 0 END), 0) AS commission_payable,
      COALESCE(SUM(CASE WHEN status <> 'cancelled' THEN released_amount ELSE 0 END), 0) AS commission_released,
      COALESCE(SUM(CASE WHEN status <> 'cancelled' THEN amount - released_amount ELSE 0 END), 0) AS commission_remaining,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_count,
      SUM(CASE WHEN status = 'payable' THEN 1 ELSE 0 END) AS payable_count,
      SUM(CASE WHEN status = 'released' THEN 1 ELSE 0 END) AS released_count,
      SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_count
    FROM commissions
    `
  )

  const summary = rows[0]

  res.status(200).json({
    summary: {
      commissionPayable: Number(summary.commission_payable),
      commissionReleased: Number(summary.commission_released),
      commissionRemaining: Number(summary.commission_remaining),
      pendingCount: Number(summary.pending_count),
      payableCount: Number(summary.payable_count),
      releasedCount: Number(summary.released_count),
      cancelledCount: Number(summary.cancelled_count)
    }
  })
}

export const createHierarchyCommissions = async (req, res) => {
  const { clientUnitId } = req.params
  const {
    seller_id,
    rates
  } = req.body

  if (isMissing(clientUnitId)) {
    return res.status(400).json({
      message: 'Client unit ID is required'
    })
  }

  if (isMissing(seller_id)) {
    return res.status(400).json({
      message: 'Seller ID is required'
    })
  }

  if (!rates || typeof rates !== 'object' || Array.isArray(rates)) {
    return res.status(400).json({
      message: 'Rates object is required'
    })
  }

  for (const role of sellerRoles) {
    if (!isMissing(rates[role]) && !validateNonNegativeNumber(rates[role]).isValid) {
      return res.status(400).json({
        message: 'Commission rates cannot be negative'
      })
    }
  }

  const connection = await db.getConnection()
  let createdCount = 0

  try {
    await connection.beginTransaction()

    const clientUnit = await getClientUnitWithListing(connection, clientUnitId)

    if (!clientUnit) {
      await connection.rollback()
      return res.status(404).json({
        message: 'Client unit not found'
      })
    }

    let seller = await getActiveSeller(connection, seller_id)

    if (!seller) {
      await connection.rollback()
      return res.status(404).json({
        message: 'Seller not found'
      })
    }

    if (seller.status !== 'active') {
      await connection.rollback()
      return res.status(403).json({
        message: 'Seller is not active'
      })
    }

    const visitedSellerIds = new Set()

    while (seller && !visitedSellerIds.has(String(seller.id))) {
      visitedSellerIds.add(String(seller.id))

      const rateValue = isMissing(rates[seller.seller_role])
        ? 0
        : Number(rates[seller.seller_role])

      if (rateValue > 0) {
        const alreadyExists = await hasDuplicateCommission(
          connection,
          clientUnitId,
          seller.id
        )

        if (!alreadyExists) {
          const amount = computeCommissionAmount(clientUnit.net_selling_price, rateValue)

          await connection.query(
            `
            INSERT INTO commissions (
              client_unit_id,
              seller_id,
              rate,
              amount,
              released_amount,
              status
            ) VALUES (?, ?, ?, ?, ?, ?)
            `,
            [
              clientUnitId,
              seller.id,
              rateValue,
              amount,
              0,
              'pending'
            ]
          )

          createdCount += 1
        }
      }

      if (isMissing(seller.parent_seller_id)) {
        seller = null
      } else {
        seller = await getActiveSeller(connection, seller.parent_seller_id)
      }
    }

    await connection.commit()
  } catch (err) {
    await connection.rollback()
    throw err
  } finally {
    connection.release()
  }

  await createAuditLog({
    userId: req.user.id,
    action: 'create',
    module: 'Commissions',
    description: `Generated hierarchy commissions for client unit ${clientUnitId}`,
    ipAddress: req.ip
  })

  res.status(200).json({
    message: 'Hierarchy commissions generated successfully',
    createdCount
  })
}
