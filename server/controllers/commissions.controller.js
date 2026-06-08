import { db } from '../db/connect.js'
import { createAuditLog } from '../utils/createAuditLog.js'
import { getClientIp } from '../utils/getClientIp.js'

const allowedCommissionStatuses = [
  'pending',
  'payable',
  'released',
  'cancelled',
]

const allowedCommissionRoles = [
  'agent',
  'unit_manager',
  'broker',
  'broker_network_manager',
]

const isMissing = (value) => {
  return value === undefined || value === null || value === ''
}

const nullableValue = (value) => {
  if (isMissing(value)) return null
  return value
}

const normalizeMoney = (value) => {
  return Number(Number(value || 0).toFixed(2))
}

const validateNonNegativeNumber = (value) => {
  const parsedValue = Number(value)

  return {
    isValid: !Number.isNaN(parsedValue) && parsedValue >= 0,
    value: parsedValue,
  }
}

const getCommissionBase = (clientUnit) => {
  const totalContractPrice = Number(clientUnit.total_contract_price || 0)

  if (totalContractPrice > 0) {
    return totalContractPrice
  }

  return (
    Number(clientUnit.net_selling_price || 0) +
    Number(clientUnit.legal_misc_fee || 0)
  )
}

export const computeCommissionAmount = (commissionBase, rate) => {
  return normalizeMoney(Number(commissionBase || 0) * (Number(rate || 0) / 100))
}

const commissionFields = `
  cm.id,
  cm.client_unit_id,
  cm.seller_id,
  cm.commission_role,
  seller.full_name AS seller_name,
  seller.seller_role,
  COALESCE(parent.full_name, seller.custom_reports_under, 'None') AS reports_under,
  client.full_name AS client_name,
  listing.unit_id,
  project.name AS project_name,
  listing.net_selling_price,
  listing.legal_misc_fee,
  listing.total_contract_price,
  CASE
    WHEN listing.total_contract_price IS NOT NULL
      AND listing.total_contract_price > 0
    THEN listing.total_contract_price
    ELSE listing.net_selling_price + listing.legal_misc_fee
  END AS commission_base,
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
  LEFT JOIN accredited_sellers parent ON parent.id = seller.parent_seller_id
`

const getClientUnitWithListing = async (connectionOrDb, clientUnitId) => {
  const [rows] = await connectionOrDb.query(
    `
    SELECT
      cu.id,
      cu.client_id,
      cu.listing_id,
      cu.seller_id,
      client.full_name AS client_name,
      listing.unit_id,
      listing.net_selling_price,
      listing.legal_misc_fee,
      listing.total_contract_price
    FROM client_units cu
    INNER JOIN clients client ON client.id = cu.client_id
    INNER JOIN listings listing ON listing.id = cu.listing_id
    WHERE cu.id = ?
    LIMIT 1
    `,
    [clientUnitId]
  )

  return rows[0]
}

const getSeller = async (connectionOrDb, sellerId) => {
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
  commissionRole,
  currentCommissionId = null
) => {
  const conditions = [
    'client_unit_id = ?',
    'seller_id = ?',
    'commission_role = ?',
  ]

  const params = [clientUnitId, sellerId, commissionRole]

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
    commission_role,
    rate,
    released_amount,
    status,
    currentCommissionId = null,
    allowInactiveSeller = false,
    defaultStatus = 'pending',
  }
) => {
  if (isMissing(client_unit_id)) {
    return {
      isValid: false,
      statusCode: 400,
      message: 'Client unit ID is required',
    }
  }

  if (isMissing(seller_id)) {
    return {
      isValid: false,
      statusCode: 400,
      message: 'Seller ID is required',
    }
  }

  const nextCommissionRole = isMissing(commission_role)
    ? 'agent'
    : commission_role

  if (!allowedCommissionRoles.includes(nextCommissionRole)) {
    return {
      isValid: false,
      statusCode: 400,
      message: 'Invalid commission role',
    }
  }

  if (isMissing(rate)) {
    return {
      isValid: false,
      statusCode: 400,
      message: 'Commission rate is required',
    }
  }

  const rateValidation = validateNonNegativeNumber(rate)

  if (!rateValidation.isValid) {
    return {
      isValid: false,
      statusCode: 400,
      message: 'Commission rate must be greater than or equal to 0',
    }
  }

  const releasedAmountValidation = validateNonNegativeNumber(
    isMissing(released_amount) ? 0 : released_amount
  )

  if (!releasedAmountValidation.isValid) {
    return {
      isValid: false,
      statusCode: 400,
      message: 'Released amount cannot be less than 0',
    }
  }

  const nextStatus = isMissing(status) ? defaultStatus : status

  if (!allowedCommissionStatuses.includes(nextStatus)) {
    return {
      isValid: false,
      statusCode: 400,
      message: 'Invalid commission status',
    }
  }

  const clientUnit = await getClientUnitWithListing(connectionOrDb, client_unit_id)

  if (!clientUnit) {
    return {
      isValid: false,
      statusCode: 404,
      message: 'Client unit not found',
    }
  }

  const seller = await getSeller(connectionOrDb, seller_id)

  if (!seller) {
    return {
      isValid: false,
      statusCode: 404,
      message: 'Seller not found',
    }
  }

  if (!allowInactiveSeller && seller.status !== 'active') {
    return {
      isValid: false,
      statusCode: 403,
      message: 'Seller is inactive',
    }
  }

  const duplicate = await hasDuplicateCommission(
    connectionOrDb,
    client_unit_id,
    seller_id,
    nextCommissionRole,
    currentCommissionId
  )

  if (duplicate) {
    return {
      isValid: false,
      statusCode: 409,
      message: 'Commission already exists for this unit, seller, and role',
    }
  }

  const commissionBase = getCommissionBase(clientUnit)
  const amount = computeCommissionAmount(commissionBase, rateValidation.value)

  if (releasedAmountValidation.value > amount) {
    return {
      isValid: false,
      statusCode: 400,
      message: 'Released amount cannot be greater than commission amount',
    }
  }

  return {
    isValid: true,
    clientUnit,
    seller,
    commissionRole: nextCommissionRole,
    rate: rateValidation.value,
    releasedAmount: releasedAmountValidation.value,
    status: nextStatus,
    commissionBase,
    amount,
  }
}

export const getCommissions = async (req, res) => {
  const {
    search,
    status,
    seller_role,
    commission_role,
    client_unit_id,
  } = req.query

  const conditions = []
  const params = []

  if (!isMissing(search)) {
    const searchTerm = `%${search}%`

    conditions.push(`
      (
        seller.full_name LIKE ?
        OR seller.seller_role LIKE ?
        OR cm.commission_role LIKE ?
        OR client.full_name LIKE ?
        OR listing.unit_id LIKE ?
        OR project.name LIKE ?
        OR cm.status LIKE ?
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
    conditions.push('cm.status = ?')
    params.push(status)
  }

  if (!isMissing(seller_role) && seller_role !== 'all') {
    conditions.push('seller.seller_role = ?')
    params.push(seller_role)
  }

  if (!isMissing(commission_role) && commission_role !== 'all') {
    conditions.push('cm.commission_role = ?')
    params.push(commission_role)
  }

  if (!isMissing(client_unit_id)) {
    conditions.push('cm.client_unit_id = ?')
    params.push(client_unit_id)
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

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
    commissions,
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
      message: 'Commission not found',
    })
  }

  res.status(200).json({
    commission,
  })
}

export const getCommissionsByClientUnit = async (req, res) => {
  const { clientUnitId } = req.params

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
    commissions,
  })
}

export const createCommission = async (req, res) => {
  const {
    client_unit_id,
    seller_id,
    commission_role,
    rate,
    released_amount = 0,
    status = 'pending',
  } = req.body

  const validation = await validateCommissionPayload(db, {
    client_unit_id,
    seller_id,
    commission_role,
    rate,
    released_amount,
    status,
  })

  if (!validation.isValid) {
    return res.status(validation.statusCode).json({
      message: validation.message,
    })
  }

  const [result] = await db.query(
    `
    INSERT INTO commissions (
      client_unit_id,
      seller_id,
      commission_role,
      rate,
      amount,
      released_amount,
      status
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [
      client_unit_id,
      seller_id,
      validation.commissionRole,
      validation.rate,
      validation.amount,
      validation.releasedAmount,
      validation.status,
    ]
  )

  await createAuditLog({
    userId: req.user.id,
    action: 'create',
    module: 'Commissions',
    description: `Created ${validation.commissionRole} commission for ${validation.seller.full_name}`,
    ipAddress: getClientIp(req),
  })

  res.status(201).json({
    message: 'Commission created successfully',
    commissionId: result.insertId,
    commissionBase: validation.commissionBase,
    amount: validation.amount,
  })
}

export const updateCommission = async (req, res) => {
  const { id } = req.params

  const [existingRows] = await db.query(
    `
    SELECT
      id,
      client_unit_id,
      seller_id,
      commission_role,
      rate,
      released_amount,
      status
    FROM commissions
    WHERE id = ?
    LIMIT 1
    `,
    [id]
  )

  const existingCommission = existingRows[0]

  if (!existingCommission) {
    return res.status(404).json({
      message: 'Commission not found',
    })
  }

  const nextPayload = {
    client_unit_id: isMissing(req.body.client_unit_id)
      ? existingCommission.client_unit_id
      : req.body.client_unit_id,
    seller_id: isMissing(req.body.seller_id)
      ? existingCommission.seller_id
      : req.body.seller_id,
    commission_role: isMissing(req.body.commission_role)
      ? existingCommission.commission_role
      : req.body.commission_role,
    rate: isMissing(req.body.rate)
      ? existingCommission.rate
      : req.body.rate,
    released_amount: isMissing(req.body.released_amount)
      ? existingCommission.released_amount
      : req.body.released_amount,
    status: isMissing(req.body.status)
      ? existingCommission.status
      : req.body.status,
  }

  const validation = await validateCommissionPayload(db, {
    ...nextPayload,
    currentCommissionId: id,
    allowInactiveSeller: true,
  })

  if (!validation.isValid) {
    return res.status(validation.statusCode).json({
      message: validation.message,
    })
  }

  await db.query(
    `
    UPDATE commissions
    SET
      client_unit_id = ?,
      seller_id = ?,
      commission_role = ?,
      rate = ?,
      amount = ?,
      released_amount = ?,
      status = ?
    WHERE id = ?
    `,
    [
      nextPayload.client_unit_id,
      nextPayload.seller_id,
      validation.commissionRole,
      validation.rate,
      validation.amount,
      validation.releasedAmount,
      validation.status,
      id,
    ]
  )

  await createAuditLog({
    userId: req.user.id,
    action: 'update',
    module: 'Commissions',
    description: `Updated commission ${id}`,
    ipAddress: getClientIp(req),
  })

  res.status(200).json({
    message: 'Commission updated successfully',
    commissionBase: validation.commissionBase,
    amount: validation.amount,
  })
}

export const getCommissionSummary = async (req, res) => {
  const [rows] = await db.query(
    `
    SELECT
      COUNT(*) AS total_commissions,
      COALESCE(SUM(amount), 0) AS total_amount,
      COALESCE(SUM(released_amount), 0) AS total_released,
      COALESCE(SUM(GREATEST(amount - released_amount, 0)), 0) AS total_remaining,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_count,
      SUM(CASE WHEN status = 'payable' THEN 1 ELSE 0 END) AS payable_count,
      SUM(CASE WHEN status = 'released' THEN 1 ELSE 0 END) AS released_count,
      SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_count
    FROM commissions
    `
  )

  res.status(200).json({
    summary: rows[0],
  })
}

export const createHierarchyCommissions = async (req, res) => {
  const { clientUnitId } = req.params
  const {
    agent_rate = 7,
    broker_rate = 5,
    broker_network_manager_rate = 2,
  } = req.body

  const connection = await db.getConnection()

  try {
    await connection.beginTransaction()

    const clientUnit = await getClientUnitWithListing(connection, clientUnitId)

    if (!clientUnit) {
      await connection.rollback()
      return res.status(404).json({
        message: 'Client unit not found',
      })
    }

    if (isMissing(clientUnit.seller_id)) {
      await connection.rollback()
      return res.status(400).json({
        message: 'This client unit has no seller assigned',
      })
    }

    const primarySeller = await getSeller(connection, clientUnit.seller_id)

    if (!primarySeller || primarySeller.status !== 'active') {
      await connection.rollback()
      return res.status(404).json({
        message: 'Client unit seller not found or inactive',
      })
    }

    const commissionBase = getCommissionBase(clientUnit)
    const createdCommissions = []

    const addCommissionIfMissing = async ({
      seller,
      commissionRole,
      rate,
    }) => {
      if (!seller || seller.status !== 'active') return

      const duplicate = await hasDuplicateCommission(
        connection,
        clientUnit.id,
        seller.id,
        commissionRole
      )

      if (duplicate) return

      const amount = computeCommissionAmount(commissionBase, rate)

      const [result] = await connection.query(
        `
        INSERT INTO commissions (
          client_unit_id,
          seller_id,
          commission_role,
          rate,
          amount,
          released_amount,
          status
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        [
          clientUnit.id,
          seller.id,
          commissionRole,
          rate,
          amount,
          0,
          'pending',
        ]
      )

      createdCommissions.push({
        id: result.insertId,
        seller_id: seller.id,
        seller_name: seller.full_name,
        commission_role: commissionRole,
        rate,
        amount,
      })
    }

    const primaryCommissionRole = allowedCommissionRoles.includes(
      primarySeller.seller_role
    )
      ? primarySeller.seller_role
      : 'agent'

    const primaryRate =
      primaryCommissionRole === 'broker_network_manager'
        ? broker_network_manager_rate
        : primaryCommissionRole === 'broker'
          ? broker_rate
          : agent_rate

    await addCommissionIfMissing({
      seller: primarySeller,
      commissionRole: primaryCommissionRole,
      rate: primaryRate,
    })

    if (primarySeller.parent_seller_id) {
      const parentSeller = await getSeller(connection, primarySeller.parent_seller_id)

      if (parentSeller) {
        const parentRole = allowedCommissionRoles.includes(parentSeller.seller_role)
          ? parentSeller.seller_role
          : 'broker'

        const parentRate =
          parentRole === 'broker_network_manager'
            ? broker_network_manager_rate
            : broker_rate

        await addCommissionIfMissing({
          seller: parentSeller,
          commissionRole: parentRole,
          rate: parentRate,
        })
      }
    }

    await connection.commit()

    await createAuditLog({
      userId: req.user.id,
      action: 'create',
      module: 'Commissions',
      description: `Generated hierarchy commissions for client unit ${clientUnitId}`,
      ipAddress: getClientIp(req),
    })

    res.status(201).json({
      message: 'Hierarchy commissions generated successfully',
      commissionBase,
      createdCommissions,
    })
  } catch (err) {
    await connection.rollback()
    throw err
  } finally {
    connection.release()
  }
}