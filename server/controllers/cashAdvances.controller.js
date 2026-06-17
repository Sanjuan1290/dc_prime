import { db } from '../db/connect.js'
import { safeCreateAuditLog } from '../utils/createAuditLog.js'
import { getClientIp } from '../utils/getClientIp.js'
import { getVisibleSellerIdsForUser, isOfficeRole } from '../utils/sellerVisibility.js'

const allowedCashAdvanceStatuses = [
  'pending',
  'approved',
  'partially_deducted',
  'deducted',
  'rejected',
  'cancelled',
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

const validateAmount = (amount) => {
  const parsedAmount = Number(amount)

  return {
    isValid: !Number.isNaN(parsedAmount) && parsedAmount > 0,
    value: normalizeMoney(parsedAmount),
  }
}

const validateStatus = (status) => {
  if (isMissing(status)) return 'pending'
  if (!allowedCashAdvanceStatuses.includes(status)) return null
  return status
}

const cashAdvanceFields = `
  ca.id,
  ca.seller_id,
  seller.full_name AS seller_name,
  seller.seller_role,
  COALESCE(parent_seller.full_name, seller.custom_reports_under, 'None') AS reports_under,
  ca.client_unit_id,
  client.full_name AS client_name,
  listing.unit_id,
  project.name AS project_name,
  ca.commission_id,
  cm.source_type AS commission_source_type,
  cm.commission_role,
  cm.sale_type,
  cm.gross_commission,
  ca.amount,
  ca.remaining_balance,
  (ca.amount - ca.remaining_balance) AS deducted_amount,
  ca.status,
  ca.requested_at,
  ca.approved_at,
  ca.approved_by,
  approver.full_name AS approved_by_name,
  ca.deducted_at,
  ca.rejected_at,
  ca.cancelled_at,
  ca.notes,
  ca.created_at,
  ca.updated_at
`

const cashAdvanceJoins = `
  FROM cash_advances ca
  INNER JOIN accredited_sellers seller ON seller.id = ca.seller_id
  LEFT JOIN accredited_sellers parent_seller ON parent_seller.id = seller.parent_seller_id
  LEFT JOIN client_units cu ON cu.id = ca.client_unit_id
  LEFT JOIN clients client ON client.id = cu.client_id
  LEFT JOIN listings listing ON listing.id = cu.listing_id
  LEFT JOIN projects project ON project.id = listing.project_id
  LEFT JOIN commissions cm ON cm.id = ca.commission_id
  LEFT JOIN users approver ON approver.id = ca.approved_by
`

const getCashAdvanceById = async (id, connectionOrDb = db) => {
  const [rows] = await connectionOrDb.query(
    `
    SELECT
      ${cashAdvanceFields}
    ${cashAdvanceJoins}
    WHERE ca.id = ?
    LIMIT 1
    `,
    [id]
  )

  return rows[0] || null
}

const getSellerById = async (connectionOrDb, sellerId) => {
  const [rows] = await connectionOrDb.query(
    `
    SELECT id, full_name, seller_role, status
    FROM accredited_sellers
    WHERE id = ?
    LIMIT 1
    `,
    [sellerId]
  )

  return rows[0]
}

const getClientUnitById = async (connectionOrDb, clientUnitId) => {
  if (isMissing(clientUnitId)) return null

  const [rows] = await connectionOrDb.query(
    `
    SELECT id
    FROM client_units
    WHERE id = ?
    LIMIT 1
    `,
    [clientUnitId]
  )

  return rows[0]
}

const getCommissionById = async (connectionOrDb, commissionId) => {
  if (isMissing(commissionId)) return null

  const [rows] = await connectionOrDb.query(
    `
    SELECT id, seller_id, client_unit_id
    FROM commissions
    WHERE id = ?
    LIMIT 1
    `,
    [commissionId]
  )

  return rows[0]
}

const releaseStageOrderSql = `
  CASE cr.release_stage
    WHEN '1st_release' THEN 1
    WHEN 'first_20' THEN 1
    WHEN '2nd_release' THEN 2
    WHEN 'second_40' THEN 2
    WHEN '3rd_release' THEN 3
    WHEN 'third_60' THEN 3
    WHEN '4th_release' THEN 4
    WHEN 'fourth_75' THEN 4
    WHEN 'retention' THEN 5
    WHEN 'retention_25' THEN 5
    ELSE 99
  END
`

const buildCommissionScopeConditions = ({ sellerId, clientUnitId, commissionId }) => {
  const conditions = ['cm.seller_id = ?']
  const params = [sellerId]

  if (!isMissing(clientUnitId)) {
    conditions.push('cm.client_unit_id = ?')
    params.push(clientUnitId)
  }

  if (!isMissing(commissionId)) {
    conditions.push('cm.id = ?')
    params.push(commissionId)
  }

  return { conditions, params }
}

const getSellerReleaseSummary = async (connectionOrDb, {
  sellerId,
  clientUnitId = null,
  commissionId = null,
  onlyEligible = false,
  lockRows = false,
}) => {
  const { conditions, params } = buildCommissionScopeConditions({
    sellerId,
    clientUnitId,
    commissionId,
  })

  if (onlyEligible) {
    conditions.push("cr.status = 'eligible'")
    conditions.push('cr.net_release_amount > 0')
  }

  const [releases] = await connectionOrDb.query(
    `
    SELECT
      cr.id,
      cr.commission_id,
      cr.release_stage,
      cr.trigger_payment_percent,
      cr.release_percent,
      cr.cumulative_release_percent,
      cr.gross_release_amount,
      cr.cash_advance_deduction,
      cr.net_release_amount,
      cr.status,
      cr.released_at,
      cm.seller_id,
      cm.client_unit_id,
      cm.commission_role,
      cm.source_type,
      cm.sale_type,
      cm.rate,
      cm.gross_commission,
      seller.full_name AS seller_name,
      c.full_name AS client_name,
      l.unit_id,
      p.name AS project_name
    FROM commission_releases cr
    INNER JOIN commissions cm ON cm.id = cr.commission_id
    INNER JOIN accredited_sellers seller ON seller.id = cm.seller_id
    INNER JOIN client_units cu ON cu.id = cm.client_unit_id
    INNER JOIN clients c ON c.id = cu.client_id
    INNER JOIN listings l ON l.id = cu.listing_id
    INNER JOIN projects p ON p.id = l.project_id
    WHERE ${conditions.join(' AND ')}
    ORDER BY cm.client_unit_id DESC, cm.id ASC, ${releaseStageOrderSql}, cr.id ASC
    ${lockRows ? 'FOR UPDATE' : ''}
    `,
    params
  )

  const totalEligibleAmount = releases
    .filter((release) => release.status === 'eligible')
    .reduce((sum, release) => sum + Number(release.net_release_amount || 0), 0)

  return {
    releases,
    totalEligibleAmount: normalizeMoney(totalEligibleAmount),
  }
}

const recalculateCommissionFromReleases = async (connectionOrDb, commissionId) => {
  const [rows] = await connectionOrDb.query(
    `
    SELECT
      cm.id,
      cm.gross_commission,
      cm.status AS current_status,
      COUNT(cr.id) AS total_releases,
      COALESCE(SUM(CASE WHEN cr.status = 'released' THEN 1 ELSE 0 END), 0) AS released_count,
      COALESCE(SUM(CASE WHEN cr.status = 'cancelled' THEN 1 ELSE 0 END), 0) AS cancelled_count,
      COALESCE(SUM(CASE WHEN cr.status = 'released' THEN cr.net_release_amount ELSE 0 END), 0) AS released_amount
    FROM commissions cm
    LEFT JOIN commission_releases cr ON cr.commission_id = cm.id
    WHERE cm.id = ?
    GROUP BY cm.id
    `,
    [commissionId]
  )

  const commission = rows[0]
  if (!commission) return null

  const totalAmount = normalizeMoney(commission.gross_commission)
  const releasedAmount = normalizeMoney(commission.released_amount)
  const totalReleases = Number(commission.total_releases || 0)
  const cancelledCount = Number(commission.cancelled_count || 0)

  let nextStatus = commission.current_status

  if (totalReleases > 0 && cancelledCount === totalReleases) {
    nextStatus = 'cancelled'
  } else if (totalAmount > 0 && releasedAmount >= totalAmount) {
    nextStatus = 'released'
  } else if (releasedAmount > 0) {
    nextStatus = 'partially_released'
  } else if (['released', 'partially_released'].includes(nextStatus)) {
    nextStatus = 'active'
  }

  await connectionOrDb.query(
    `
    UPDATE commissions
    SET released_amount = ?, status = ?
    WHERE id = ?
    `,
    [releasedAmount, nextStatus, commissionId]
  )

  return { releasedAmount, status: nextStatus }
}

export const getCashAdvances = async (req, res) => {
  const {
    search,
    status,
    seller_id,
    client_unit_id,
    commission_id,
  } = req.query

  const conditions = []
  const params = []

  const visibleSellerIds = await getVisibleSellerIdsForUser(req.user)
  if (visibleSellerIds !== null) {
    if (visibleSellerIds.length === 0) {
      conditions.push('1 = 0')
    } else {
      conditions.push(`ca.seller_id IN (${visibleSellerIds.map(() => '?').join(', ')})`)
      params.push(...visibleSellerIds)
    }
  }

  if (!isMissing(search)) {
    const searchTerm = `%${search}%`

    conditions.push(`
      (
        seller.full_name LIKE ?
        OR seller.seller_role LIKE ?
        OR client.full_name LIKE ?
        OR listing.unit_id LIKE ?
        OR project.name LIKE ?
        OR ca.status LIKE ?
        OR ca.notes LIKE ?
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
    conditions.push('ca.status = ?')
    params.push(status)
  }

  if (isOfficeRole(req.user.role) && !isMissing(seller_id) && seller_id !== 'all') {
    conditions.push('ca.seller_id = ?')
    params.push(seller_id)
  }

  if (!isMissing(client_unit_id)) {
    conditions.push('ca.client_unit_id = ?')
    params.push(client_unit_id)
  }

  if (!isMissing(commission_id)) {
    conditions.push('ca.commission_id = ?')
    params.push(commission_id)
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const [rows] = await db.query(
    `
    SELECT
      ${cashAdvanceFields}
    ${cashAdvanceJoins}
    ${whereClause}
    ORDER BY ca.id DESC
    `,
    params
  )

  res.status(200).json({
    message: 'Cash advances fetched successfully',
    cashAdvances: rows,
    data: rows,
  })
}

export const getCashAdvance = async (req, res) => {
  const { id } = req.params

  const cashAdvance = await getCashAdvanceById(id)

  if (!cashAdvance) {
    return res.status(404).json({
      message: 'Cash advance not found',
    })
  }

  const [deductions] = await db.query(
    `
    SELECT
      cad.id,
      cad.cash_advance_id,
      cad.commission_release_id,
      cad.amount,
      cad.notes,
      cad.created_at,
      cr.release_stage,
      cr.status AS release_status,
      cm.id AS commission_id,
      cm.client_unit_id,
      seller.full_name AS seller_name,
      client.full_name AS client_name,
      listing.unit_id,
      project.name AS project_name,
      created_by_user.full_name AS created_by_name
    FROM cash_advance_deductions cad
    INNER JOIN commission_releases cr ON cr.id = cad.commission_release_id
    INNER JOIN commissions cm ON cm.id = cr.commission_id
    INNER JOIN accredited_sellers seller ON seller.id = cm.seller_id
    INNER JOIN client_units cu ON cu.id = cm.client_unit_id
    INNER JOIN clients client ON client.id = cu.client_id
    INNER JOIN listings listing ON listing.id = cu.listing_id
    INNER JOIN projects project ON project.id = listing.project_id
    LEFT JOIN users created_by_user ON created_by_user.id = cad.created_by
    WHERE cad.cash_advance_id = ?
    ORDER BY cad.id DESC
    `,
    [id]
  )

  res.status(200).json({
    message: 'Cash advance fetched successfully',
    cashAdvance: {
      ...cashAdvance,
      deductions,
    },
    data: {
      ...cashAdvance,
      deductions,
    },
  })
}

export const createCashAdvance = async (req, res) => {
  const {
    seller_id,
    client_unit_id,
    commission_id,
    amount,
    notes,
  } = req.body

  if (isMissing(seller_id)) {
    return res.status(400).json({
      message: 'Seller is required',
    })
  }

  const amountValidation = validateAmount(amount)

  if (!amountValidation.isValid) {
    return res.status(400).json({
      message: 'Amount must be greater than 0',
    })
  }

  const finalStatus = 'pending'

  const connection = await db.getConnection()

  try {
    await connection.beginTransaction()

    const seller = await getSellerById(connection, seller_id)

    if (!seller) {
      await connection.rollback()
      return res.status(404).json({
        message: 'Seller not found',
      })
    }

    if (seller.status !== 'active') {
      await connection.rollback()
      return res.status(400).json({
        message: 'Seller is inactive',
      })
    }

    if (!isMissing(client_unit_id)) {
      const clientUnit = await getClientUnitById(connection, client_unit_id)

      if (!clientUnit) {
        await connection.rollback()
        return res.status(404).json({
          message: 'Client unit not found',
        })
      }
    }

    if (!isMissing(commission_id)) {
      const commission = await getCommissionById(connection, commission_id)

      if (!commission) {
        await connection.rollback()
        return res.status(404).json({
          message: 'Commission not found',
        })
      }

      if (Number(commission.seller_id) !== Number(seller_id)) {
        await connection.rollback()
        return res.status(400).json({
          message: 'Commission seller does not match cash advance seller',
        })
      }
    }

    const { totalEligibleAmount } = await getSellerReleaseSummary(connection, {
      sellerId: seller_id,
      clientUnitId: nullableValue(client_unit_id),
      commissionId: nullableValue(commission_id),
      onlyEligible: true,
    })

    if (amountValidation.value > totalEligibleAmount) {
      await connection.rollback()
      return res.status(400).json({
        message: `Amount exceeds eligible commission releases. Eligible amount: ${totalEligibleAmount}`,
      })
    }

    const finalApprovedAt = null
    const finalApprovedBy = null
    const finalRequestedAt = new Date()

    const [result] = await connection.query(
      `
      INSERT INTO cash_advances (
        seller_id,
        client_unit_id,
        commission_id,
        amount,
        remaining_balance,
        status,
        requested_at,
        approved_at,
        approved_by,
        notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        seller_id,
        nullableValue(client_unit_id),
        nullableValue(commission_id),
        amountValidation.value,
        amountValidation.value,
        finalStatus,
        finalRequestedAt,
        finalApprovedAt,
        finalApprovedBy,
        nullableValue(notes),
      ]
    )

    await connection.commit()

    await safeCreateAuditLog({
      userId: req.user.id,
      action: 'create',
      module: 'Cash Advances',
      description: `Created cash advance for ${seller.full_name}`,
      ipAddress: getClientIp(req),
    })

    res.status(201).json({
      message: 'Cash advance created successfully',
      cashAdvanceId: result.insertId,
      data: {
        cashAdvanceId: result.insertId,
      },
    })
  } catch (err) {
    await connection.rollback()
    throw err
  } finally {
    connection.release()
  }
}

export const updateCashAdvance = async (req, res) => {
  const { id } = req.params

  const {
    seller_id,
    client_unit_id,
    commission_id,
    amount,
    status,
    requested_at,
    approved_at,
    notes,
  } = req.body

  const existing = await getCashAdvanceById(id)

  if (!existing) {
    return res.status(404).json({
      message: 'Cash advance not found',
    })
  }

  if (existing.status !== 'pending') {
    return res.status(400).json({
      message: 'Only pending cash advances can be edited.',
    })
  }

  const deductedAmount = normalizeMoney(existing.amount) - normalizeMoney(existing.remaining_balance)

  if (deductedAmount > 0 && !isMissing(amount)) {
    return res.status(400).json({
      message: 'Cannot change amount after deductions have been made',
    })
  }

  const finalStatus = 'pending'

  const nextAmount = isMissing(amount)
    ? normalizeMoney(existing.amount)
    : validateAmount(amount).value

  if (!isMissing(amount) && !validateAmount(amount).isValid) {
    return res.status(400).json({
      message: 'Amount must be greater than 0',
    })
  }

  const nextRemainingBalance = isMissing(amount)
    ? normalizeMoney(existing.remaining_balance)
    : nextAmount

  const connection = await db.getConnection()

  try {
    await connection.beginTransaction()

    const nextSellerId = isMissing(seller_id) ? existing.seller_id : seller_id

    const seller = await getSellerById(connection, nextSellerId)

    if (!seller) {
      await connection.rollback()
      return res.status(404).json({
        message: 'Seller not found',
      })
    }

    const nextClientUnitId = isMissing(client_unit_id)
      ? existing.client_unit_id
      : nullableValue(client_unit_id)

    const nextCommissionId = isMissing(commission_id)
      ? existing.commission_id
      : nullableValue(commission_id)

    if (!isMissing(nextClientUnitId)) {
      const clientUnit = await getClientUnitById(connection, nextClientUnitId)

      if (!clientUnit) {
        await connection.rollback()
        return res.status(404).json({
          message: 'Client unit not found',
        })
      }
    }

    if (!isMissing(nextCommissionId)) {
      const commission = await getCommissionById(connection, nextCommissionId)

      if (!commission) {
        await connection.rollback()
        return res.status(404).json({
          message: 'Commission not found',
        })
      }

      if (Number(commission.seller_id) !== Number(nextSellerId)) {
        await connection.rollback()
        return res.status(400).json({
          message: 'Commission seller does not match cash advance seller',
        })
      }
    }

    const { totalEligibleAmount } = await getSellerReleaseSummary(connection, {
      sellerId: nextSellerId,
      clientUnitId: nextClientUnitId,
      commissionId: nextCommissionId,
      onlyEligible: true,
    })

    if (nextAmount > totalEligibleAmount) {
      await connection.rollback()
      return res.status(400).json({
        message: `Amount exceeds eligible commission releases. Eligible amount: ${totalEligibleAmount}`,
      })
    }

    const nextApprovedAt = null
    const nextApprovedBy = null

    await connection.query(
      `
      UPDATE cash_advances
      SET
        seller_id = ?,
        client_unit_id = ?,
        commission_id = ?,
        amount = ?,
        remaining_balance = ?,
        status = ?,
        requested_at = ?,
        approved_at = ?,
        approved_by = ?,
        notes = ?
      WHERE id = ?
      `,
      [
        nextSellerId,
        nullableValue(nextClientUnitId),
        nullableValue(nextCommissionId),
        nextAmount,
        nextRemainingBalance,
        finalStatus,
        existing.requested_at,
        nextApprovedAt,
        nextApprovedBy,
        !isMissing(notes) ? nullableValue(notes) : existing.notes,
        id,
      ]
    )

    await connection.commit()

    await safeCreateAuditLog({
      userId: req.user.id,
      action: 'update',
      module: 'Cash Advances',
      description: `Updated cash advance ${id}`,
      ipAddress: getClientIp(req),
    })

    res.status(200).json({
      message: 'Cash advance updated successfully',
      data: {
        cashAdvanceId: Number(id),
      },
    })
  } catch (err) {
    await connection.rollback()
    throw err
  } finally {
    connection.release()
  }
}

export const approveCashAdvance = async (req, res) => {
  const { id } = req.params

  if (req.user.role !== 'super_admin') {
    return res.status(403).json({
      message: 'Only super admin can approve cash advances.',
    })
  }

  const existing = await getCashAdvanceById(id)

  if (!existing) {
    return res.status(404).json({
      message: 'Cash advance not found',
    })
  }

  if (existing.status !== 'pending') {
    return res.status(400).json({
      message: 'Only pending cash advances can be approved',
    })
  }

  await db.query(
    `
    UPDATE cash_advances
    SET
      status = 'approved',
      approved_at = NOW(),
      approved_by = ?
    WHERE id = ?
    `,
    [req.user.id, id]
  )

  await safeCreateAuditLog({
    userId: req.user.id,
    action: 'approve',
    module: 'Cash Advances',
    description: `Approved cash advance ${id}`,
    ipAddress: getClientIp(req),
  })

  res.status(200).json({
    message: 'Cash advance approved successfully',
    data: {
      cashAdvanceId: Number(id),
    },
  })
}

export const rejectCashAdvance = async (req, res) => {
  const { id } = req.params
  const { notes } = req.body

  if (req.user.role !== 'super_admin') {
    return res.status(403).json({
      message: 'Only super admin can reject cash advances.',
    })
  }

  const existing = await getCashAdvanceById(id)

  if (!existing) {
    return res.status(404).json({
      message: 'Cash advance not found',
    })
  }

  if (existing.status !== 'pending') {
    return res.status(400).json({
      message: 'Only pending cash advances can be rejected',
    })
  }

  await db.query(
    `
    UPDATE cash_advances
    SET
      status = 'rejected',
      notes = ?
    WHERE id = ?
    `,
    [nullableValue(notes) || existing.notes, id]
  )

  await safeCreateAuditLog({
    userId: req.user.id,
    action: 'reject',
    module: 'Cash Advances',
    description: `Rejected cash advance ${id}`,
    ipAddress: getClientIp(req),
  })

  res.status(200).json({
    message: 'Cash advance rejected successfully',
    data: {
      cashAdvanceId: Number(id),
    },
  })
}

export const cancelCashAdvance = async (req, res) => {
  const { id } = req.params
  const { notes } = req.body

  const existing = await getCashAdvanceById(id)

  if (!existing) {
    return res.status(404).json({
      message: 'Cash advance not found',
    })
  }

  const deductedAmount = normalizeMoney(existing.amount) - normalizeMoney(existing.remaining_balance)

  if (deductedAmount > 0) {
    return res.status(400).json({
      message: 'Cannot cancel cash advance after deductions have been made',
    })
  }

  if (req.user.role !== 'super_admin' && existing.status !== 'pending') {
    return res.status(403).json({
      message: 'Admin can only cancel pending cash advances. Super admin is required for approved cash advances.',
    })
  }

  if (!['pending', 'approved'].includes(existing.status)) {
    return res.status(400).json({
      message: 'Only pending or approved cash advances can be cancelled',
    })
  }

  await db.query(
    `
    UPDATE cash_advances
    SET
      status = 'cancelled',
      notes = ?
    WHERE id = ?
    `,
    [nullableValue(notes) || existing.notes, id]
  )

  await safeCreateAuditLog({
    userId: req.user.id,
    action: 'cancel',
    module: 'Cash Advances',
    description: `Cancelled cash advance ${id}`,
    ipAddress: getClientIp(req),
  })

  res.status(200).json({
    message: 'Cash advance cancelled successfully',
    data: {
      cashAdvanceId: Number(id),
    },
  })
}


export const deductCashAdvance = async (req, res) => {
  const { id } = req.params

  if (req.user.role !== 'super_admin') {
    return res.status(403).json({
      message: 'Only super admin can deduct cash advances.',
    })
  }

  const connection = await db.getConnection()

  try {
    await connection.beginTransaction()

    const [advanceRows] = await connection.query(
      `
      SELECT *
      FROM cash_advances
      WHERE id = ?
      LIMIT 1
      FOR UPDATE
      `,
      [id]
    )

    const cashAdvance = advanceRows[0]

    if (!cashAdvance) {
      await connection.rollback()
      return res.status(404).json({ message: 'Cash advance not found' })
    }

    if (!['approved', 'partially_deducted'].includes(cashAdvance.status)) {
      await connection.rollback()
      return res.status(400).json({
        message: 'Only approved cash advances can be deducted.',
      })
    }

    const remainingBalance = normalizeMoney(cashAdvance.remaining_balance)

    if (remainingBalance <= 0) {
      await connection.rollback()
      return res.status(400).json({
        message: 'This cash advance has no remaining balance to deduct.',
      })
    }

    const { releases, totalEligibleAmount } = await getSellerReleaseSummary(connection, {
      sellerId: cashAdvance.seller_id,
      clientUnitId: cashAdvance.client_unit_id,
      commissionId: cashAdvance.commission_id,
      onlyEligible: true,
      lockRows: true,
    })

    if (releases.length === 0) {
      await connection.rollback()
      return res.status(400).json({
        message: 'No eligible commission release is available for this cash advance.',
      })
    }

    if (remainingBalance > totalEligibleAmount) {
      await connection.rollback()
      return res.status(400).json({
        message: `Cash advance remaining balance exceeds eligible releases. Eligible amount: ${totalEligibleAmount}`,
      })
    }

    let amountToDeduct = remainingBalance
    const affectedCommissionIds = new Set()
    const deductions = []

    for (const release of releases) {
      if (amountToDeduct <= 0) break

      const releaseAvailable = normalizeMoney(release.net_release_amount)
      if (releaseAvailable <= 0) continue

      const deductionAmount = normalizeMoney(Math.min(amountToDeduct, releaseAvailable))
      const nextCashAdvanceDeduction = normalizeMoney(
        Number(release.cash_advance_deduction || 0) + deductionAmount
      )
      const nextNetReleaseAmount = normalizeMoney(
        Math.max(Number(release.net_release_amount || 0) - deductionAmount, 0)
      )

      await connection.query(
        `
        INSERT INTO cash_advance_deductions (
          cash_advance_id,
          commission_release_id,
          amount,
          created_by,
          notes
        ) VALUES (?, ?, ?, ?, ?)
        `,
        [
          cashAdvance.id,
          release.id,
          deductionAmount,
          req.user.id,
          `Automatic deduction from Cash Advance #${cashAdvance.id}`,
        ]
      )

      await connection.query(
        `
        UPDATE commission_releases
        SET
          cash_advance_deduction = ?,
          net_release_amount = ?
        WHERE id = ?
        `,
        [nextCashAdvanceDeduction, nextNetReleaseAmount, release.id]
      )

      affectedCommissionIds.add(release.commission_id)
      deductions.push({
        releaseId: release.id,
        commissionId: release.commission_id,
        amount: deductionAmount,
      })
      amountToDeduct = normalizeMoney(amountToDeduct - deductionAmount)
    }

    if (amountToDeduct > 0) {
      await connection.rollback()
      return res.status(400).json({
        message: 'Unable to deduct the full cash advance from eligible releases.',
      })
    }

    const nextRemainingBalance = 0

    await connection.query(
      `
      UPDATE cash_advances
      SET
        remaining_balance = ?,
        status = 'deducted',
        deducted_at = NOW()
      WHERE id = ?
      `,
      [nextRemainingBalance, cashAdvance.id]
    )

    for (const commissionId of affectedCommissionIds) {
      await recalculateCommissionFromReleases(connection, commissionId)
    }

    await connection.commit()

    await safeCreateAuditLog({
      userId: req.user.id,
      action: 'deduct',
      module: 'Cash Advances',
      description: `Automatically deducted cash advance ${id}`,
      ipAddress: getClientIp(req),
    })

    return res.status(200).json({
      message: 'Cash advance deducted successfully',
      data: {
        cashAdvanceId: Number(id),
        deductions,
      },
    })
  } catch (err) {
    await connection.rollback()
    throw err
  } finally {
    connection.release()
  }
}

export const getCashAdvanceSummary = async (req, res) => {
  const [rows] = await db.query(
    `
    SELECT
      COUNT(id) AS total_cash_advances,
      COALESCE(SUM(amount), 0) AS total_amount,
      COALESCE(SUM(remaining_balance), 0) AS total_remaining,
      COALESCE(SUM(amount - remaining_balance), 0) AS total_deducted,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_count,
      SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) AS approved_count,
      SUM(CASE WHEN status = 'partially_deducted' THEN 1 ELSE 0 END) AS partially_deducted_count,
      SUM(CASE WHEN status = 'deducted' THEN 1 ELSE 0 END) AS deducted_count,
      SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) AS rejected_count,
      SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_count
    FROM cash_advances
    `
  )

  const summary = rows[0] || {}

  res.status(200).json({
    message: 'Cash advance summary fetched successfully',
    summary,
    data: summary,
  })
}



export const getSellerCommissionSummaryForCashAdvance = async (req, res) => {
  const { sellerId } = req.params
  const { client_unit_id, commission_id } = req.query

  const [clientUnits] = await db.query(
    `
    SELECT DISTINCT
      cu.id,
      l.unit_id,
      c.full_name AS client_name,
      p.name AS project_name,
      cu.status,
      cu.mode_of_payment,
      cm.seller_id
    FROM commissions cm
    JOIN client_units cu ON cu.id = cm.client_unit_id
    JOIN clients c ON c.id = cu.client_id
    JOIN listings l ON l.id = cu.listing_id
    JOIN projects p ON p.id = l.project_id
    WHERE cm.seller_id = ?
    ORDER BY cu.id DESC
    `,
    [sellerId]
  )

  const { releases: allReleases, totalEligibleAmount } = await getSellerReleaseSummary(db, {
    sellerId,
    clientUnitId: nullableValue(client_unit_id),
    commissionId: nullableValue(commission_id),
  })

  const eligibleReleases = allReleases.filter(
    (release) => release.status === 'eligible' && Number(release.net_release_amount || 0) > 0
  )

  const totals = allReleases.reduce(
    (sum, release) => {
      sum.total_gross += Number(release.gross_release_amount || 0)
      sum.total_deducted += Number(release.cash_advance_deduction || 0)
      if (release.status === 'eligible') {
        sum.total_eligible += Number(release.gross_release_amount || 0)
        sum.total_available += Number(release.net_release_amount || 0)
      }
      return sum
    },
    { total_gross: 0, total_eligible: 0, total_deducted: 0, total_available: 0 }
  )

  totals.total_gross = normalizeMoney(totals.total_gross)
  totals.total_eligible = normalizeMoney(totals.total_eligible)
  totals.total_deducted = normalizeMoney(totals.total_deducted)
  totals.total_available = normalizeMoney(totalEligibleAmount || totals.total_available)

  res.status(200).json({
    message: 'Seller commission summary fetched successfully',
    clientUnits,
    eligibleReleases,
    allReleases,
    releases: allReleases,
    totals,
    data: { clientUnits, eligibleReleases, allReleases, releases: allReleases, totals },
  })
}
