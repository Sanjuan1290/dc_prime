import { db } from '../db/connect.js'
import { createAuditLog } from '../utils/createAuditLog.js'
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
  cm.gross_commission,
  ca.amount,
  ca.remaining_balance,
  (ca.amount - ca.remaining_balance) AS deducted_amount,
  ca.status,
  ca.requested_at,
  ca.approved_at,
  ca.approved_by,
  approver.full_name AS approved_by_name,
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
    requested_at,
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

    const finalApprovedAt = null
    const finalApprovedBy = null
    const finalRequestedAt = requested_at || new Date()

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

    await createAuditLog({
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

  const deductedAmount = normalizeMoney(existing.amount) - normalizeMoney(existing.remaining_balance)

  if (deductedAmount > 0 && !isMissing(amount)) {
    return res.status(400).json({
      message: 'Cannot change amount after deductions have been made',
    })
  }

  const finalStatus = isMissing(status)
    ? existing.status
    : validateStatus(status)

  if (!finalStatus) {
    return res.status(400).json({
      message: 'Invalid cash advance status',
    })
  }

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

    const becomingApproved =
      !['approved', 'partially_deducted', 'deducted'].includes(existing.status) &&
      ['approved', 'partially_deducted', 'deducted'].includes(finalStatus)

    const shouldClearApproval =
      ['pending', 'rejected', 'cancelled'].includes(finalStatus)

    const nextApprovedAt = becomingApproved
      ? approved_at || new Date()
      : shouldClearApproval
        ? null
        : approved_at || existing.approved_at

    const nextApprovedBy = becomingApproved
      ? req.user.id
      : shouldClearApproval
        ? null
        : existing.approved_by

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
        requested_at || existing.requested_at,
        nextApprovedAt,
        nextApprovedBy,
        !isMissing(notes) ? nullableValue(notes) : existing.notes,
        id,
      ]
    )

    await connection.commit()

    await createAuditLog({
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

  await createAuditLog({
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

  await createAuditLog({
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

  await createAuditLog({
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

  const [clientUnits] = await db.query(
    `
    SELECT DISTINCT
      cu.id,
      l.unit_id,
      c.full_name AS client_name,
      p.name AS project_name,
      cu.status,
      cu.mode_of_payment
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

  const [eligibleReleases] = await db.query(
    `
    SELECT
      cr.id,
      cr.commission_id,
      cr.release_stage,
      cr.gross_release_amount,
      cr.cash_advance_deduction,
      cr.net_release_amount,
      cr.status,
      cm.client_unit_id,
      c.full_name AS client_name,
      l.unit_id,
      p.name AS project_name
    FROM commission_releases cr
    JOIN commissions cm ON cm.id = cr.commission_id
    JOIN client_units cu ON cu.id = cm.client_unit_id
    JOIN clients c ON c.id = cu.client_id
    JOIN listings l ON l.id = cu.listing_id
    JOIN projects p ON p.id = l.project_id
    WHERE cm.seller_id = ?
      AND cr.status = 'eligible'
      AND cr.net_release_amount > 0
    ORDER BY cr.id ASC
    `,
    [sellerId]
  )

  const totals = eligibleReleases.reduce(
    (sum, release) => {
      sum.total_eligible += Number(release.gross_release_amount || 0)
      sum.total_deducted += Number(release.cash_advance_deduction || 0)
      sum.total_available += Number(release.net_release_amount || 0)
      return sum
    },
    { total_eligible: 0, total_deducted: 0, total_available: 0 }
  )

  res.status(200).json({
    message: 'Seller commission summary fetched successfully',
    clientUnits,
    eligibleReleases,
    totals,
    data: { clientUnits, eligibleReleases, totals },
  })
}
