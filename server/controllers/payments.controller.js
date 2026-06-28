import { db } from '../db/connect.js'
import { safeCreateAuditLog } from '../utils/createAuditLog.js'
import { getClientIp } from '../utils/getClientIp.js'
import { refreshCommissionEligibility } from './commissions.controller.js'
import { getNextPaymentScheduleDue, rebuildPaymentSchedule } from '../utils/paymentSchedule.js'
import {
  addDateRangeConditions,
  buildPagination,
  getDateRangeFromQuery,
  getPaginationOptions,
  getSortOptions,
} from '../utils/queryOptions.js'

const allowedPaymentStatuses = ['pending', 'verified', 'rejected']

const isMissing = (value) => {
  return value === undefined || value === null || value === ''
}

const nullableValue = (value) => {
  if (isMissing(value)) return null
  return value
}

const toDateOnly = (value) => {
  if (isMissing(value)) return null

  if (typeof value === 'string') {
    const trimmedValue = value.trim()

    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmedValue)) {
      return trimmedValue
    }

    const matchedDate = trimmedValue.match(/^(\d{4}-\d{2}-\d{2})/)

    if (matchedDate) {
      return matchedDate[1]
    }
  }

  const parsedDate = value instanceof Date ? value : new Date(value)

  if (Number.isNaN(parsedDate.getTime())) return null

  const year = parsedDate.getFullYear()
  const month = String(parsedDate.getMonth() + 1).padStart(2, '0')
  const day = String(parsedDate.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

const getTodayDateOnly = () => {
  return toDateOnly(new Date())
}

const isFutureDateOnly = (value) => {
  const date = toDateOnly(value)

  return Boolean(date && date > getTodayDateOnly())
}

const isMonthlyPaymentType = (paymentType) => {
  return String(paymentType || '').toLowerCase() === 'monthly'
}


const isCashPaymentMethod = (paymentMethod) => {
  return String(paymentMethod || '').toLowerCase() === 'cash'
}

const isExcessMaPayment = (paymentType) => {
  return String(paymentType || '').toLowerCase() === 'excess_ma'
}

const isReferenceRequired = ({ paymentMethod, paymentType, status }) => {
  if (isCashPaymentMethod(paymentMethod)) return false
  if (isExcessMaPayment(paymentType)) return false
  return status === 'verified'
}

const buildCashReferenceId = ({ paymentDate, clientUnitId, sequence }) => {
  const compactDate = String(toDateOnly(paymentDate) || getTodayDateOnly()).replace(/-/g, '')
  const unitCode = `CU${String(clientUnitId).padStart(4, '0')}`
  const sequenceCode = String(sequence).padStart(4, '0')

  return `CASH-${compactDate}-${unitCode}-${sequenceCode}`
}

const generateCashReferenceId = async (
  connectionOrDb,
  { clientUnitId, paymentDate }
) => {
  const compactDate = String(toDateOnly(paymentDate) || getTodayDateOnly()).replace(/-/g, '')
  const prefix = `CASH-${compactDate}-CU${String(clientUnitId).padStart(4, '0')}-`

  const [rows] = await connectionOrDb.query(
    `
    SELECT COUNT(*) AS total
    FROM payments
    WHERE client_unit_id = ?
      AND payment_method = 'cash'
      AND reference_id LIKE ?
    `,
    [clientUnitId, `${prefix}%`]
  )

  let sequence = Number(rows[0]?.total || 0) + 1

  for (let attempt = 0; attempt < 50; attempt += 1) {
    const referenceId = buildCashReferenceId({
      paymentDate,
      clientUnitId,
      sequence,
    })

    const [existingRows] = await connectionOrDb.query(
      `SELECT id FROM payments WHERE reference_id = ? LIMIT 1`,
      [referenceId]
    )

    if (existingRows.length === 0) return referenceId
    sequence += 1
  }

  return buildCashReferenceId({
    paymentDate,
    clientUnitId,
    sequence: Date.now() % 10000,
  })
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

const validatePaymentStatus = (status) => {
  if (isMissing(status)) return 'pending'
  if (!allowedPaymentStatuses.includes(status)) return null
  return status
}


const roundAmount = (value) => normalizeMoney(value)

const getCurrentContractPrice = (unit = {}) => {
  const listingTcp = roundAmount(unit.total_contract_price)
  if (listingTcp > 0) return listingTcp

  const netSellingPrice = roundAmount(unit.net_selling_price)
  const legalMiscFee = roundAmount(unit.legal_misc_fee)

  if (netSellingPrice > 0 || legalMiscFee > 0) {
    return roundAmount(netSellingPrice + legalMiscFee)
  }

  return roundAmount(unit.offer_purchase_price)
}

const getClientUnitPaymentPlan = async (connectionOrDb, clientUnitId) => {
  const [rows] = await connectionOrDb.query(
    `
    SELECT
      cu.*,
      c.full_name AS client_name,
      l.unit_id,
      p.name AS project_name,
      l.total_contract_price,
      l.legal_misc_fee,
      l.reservation_fee AS listing_reservation_fee
    FROM client_units cu
    INNER JOIN clients c ON c.id = cu.client_id
    INNER JOIN listings l ON l.id = cu.listing_id
    INNER JOIN projects p ON p.id = l.project_id
    WHERE cu.id = ?
    LIMIT 1
    `,
    [clientUnitId]
  )

  return rows[0] || null
}

const getVerifiedPaymentSummary = async (connectionOrDb, clientUnitId) => {
  const [rows] = await connectionOrDb.query(
    `
    SELECT
      COALESCE(SUM(CASE WHEN (payment_type IS NULL OR payment_type <> 'excess_ma') THEN amount ELSE 0 END), 0) AS paid_amount,
      COALESCE(SUM(CASE WHEN payment_type IN ('reservation_fee', 'reservation') THEN amount ELSE 0 END), 0) AS reservation_paid,
      COALESCE(SUM(CASE WHEN payment_type = 'downpayment' THEN amount ELSE 0 END), 0) AS downpayment_paid,
      COALESCE(SUM(CASE WHEN payment_type = 'monthly' THEN amount ELSE 0 END), 0) AS monthly_paid,
      COALESCE(SUM(CASE WHEN payment_type = 'legal_misc' THEN amount ELSE 0 END), 0) AS legal_misc_paid,
      COALESCE(SUM(CASE WHEN payment_type = 'full_payment' THEN amount ELSE 0 END), 0) AS full_payment_paid,
      COALESCE(SUM(CASE WHEN payment_type = 'downpayment' THEN 1 ELSE 0 END), 0) AS downpayment_payment_count,
      COALESCE(SUM(CASE WHEN payment_type = 'monthly' THEN 1 ELSE 0 END), 0) AS monthly_payment_count
    FROM payments
    WHERE client_unit_id = ?
      AND status = 'verified'
    `,
    [clientUnitId]
  )

  return rows[0] || {}
}

const buildPaymentSuggestions = async (connectionOrDb, clientUnitId) => {
  const unit = await getClientUnitPaymentPlan(connectionOrDb, clientUnitId)

  if (!unit) return null

  const summary = await getVerifiedPaymentSummary(connectionOrDb, clientUnitId)
  const scheduleDue = await getNextPaymentScheduleDue(connectionOrDb, clientUnitId)
  const nextScheduleRow = scheduleDue.nextRow
  const totalContractPrice = getCurrentContractPrice(unit)
  const paidAmount = roundAmount(summary.paid_amount)
  const scheduleBalance = roundAmount(scheduleDue.totalBalance || 0)
  const principalBalance = roundAmount(
    scheduleDue.principalBalance ||
      unit.balance ||
      Math.max(totalContractPrice - paidAmount, 0)
  )
  const balance = principalBalance
  const reservationFee = roundAmount(unit.reservation_fee_amount || unit.listing_reservation_fee)
  const downpaymentNet = roundAmount(unit.downpayment_net_amount || unit.downpayment_amount)
  const downpaymentGives = Math.max(Number(unit.downpayment_gives || 3), 1)
  const downpaymentPaid = roundAmount(summary.downpayment_paid)
  const downpaymentRemaining = roundAmount(Math.max(downpaymentNet - downpaymentPaid, 0))
  const paymentTermsMonths = Math.max(Number(unit.payment_terms_months || 0), 0)
  const lockedMonthly = roundAmount(unit.monthly_amortization || 0)
  const fallbackMonthly = paymentTermsMonths > 0
    ? roundAmount(Math.max(balance - downpaymentRemaining, 0) / paymentTermsMonths)
    : 0

  const reservationSuggestion = roundAmount(Math.max(reservationFee - roundAmount(summary.reservation_paid), 0))
  const downpaymentSuggestion = nextScheduleRow?.schedule_type === 'downpayment'
    ? roundAmount(nextScheduleRow.balance || nextScheduleRow.total_due || 0)
    : downpaymentRemaining > 0
      ? roundAmount(downpaymentRemaining / downpaymentGives)
      : 0
  const monthlySuggestion = unit.mode_of_payment === 'installment'
    ? roundAmount(
        nextScheduleRow?.schedule_type === 'monthly'
          ? nextScheduleRow.balance || nextScheduleRow.total_due || lockedMonthly || fallbackMonthly
          : lockedMonthly || fallbackMonthly
      )
    : 0
  const legalMiscScheduleRow = scheduleDue.rows?.find((row) => (
    row.schedule_type === 'legal_misc' &&
    roundAmount(row.balance || row.total_due || 0) > 0
  ))
  const legalMiscSuggestion = roundAmount(
    legalMiscScheduleRow?.balance || legalMiscScheduleRow?.total_due || 0
  )
  const excessMaAvailable = roundAmount(scheduleDue.excessMaAvailable || 0)
  const totalPayableBalance = roundAmount(
    scheduleDue.statementBalance ?? scheduleBalance ?? principalBalance
  )
  const payoffSuggestion = roundAmount(Math.max(totalPayableBalance - excessMaAvailable, 0))
  const fullPaymentSuggestion = payoffSuggestion
  const balloonSuggestion = payoffSuggestion
  const advancePaymentSuggestion = monthlySuggestion
  const excessMaSuggestion = roundAmount(Math.min(excessMaAvailable, monthlySuggestion || balance || 0))

  const suggestions = {
    reservation: reservationSuggestion,
    reservation_fee: reservationSuggestion,
    downpayment: downpaymentSuggestion,
    monthly: monthlySuggestion,
    excess_ma: excessMaSuggestion,
    balloon: balloonSuggestion,
    advance_payment: advancePaymentSuggestion,
    legal_misc: legalMiscSuggestion,
    full_payment: fullPaymentSuggestion,
    other: 0,
  }

  const nextDue = nextScheduleRow
    ? {
        payment_type:
          nextScheduleRow.schedule_type === 'reservation'
            ? 'reservation'
            : nextScheduleRow.schedule_type === 'full_payment'
              ? 'full_payment'
              : nextScheduleRow.schedule_type,
        description: nextScheduleRow.description,
        due_amount: roundAmount(nextScheduleRow.balance || nextScheduleRow.total_due || 0),
        due_date: nextScheduleRow.due_date,
        status: nextScheduleRow.status,
      }
    : balance > 0
      ? {
          payment_type: 'full_payment',
          description: 'Remaining Balance',
          due_amount: fullPaymentSuggestion,
        }
      : null

  return {
    client_unit_id: Number(clientUnitId),
    client_name: unit.client_name,
    unit_id: unit.unit_id,
    project_name: unit.project_name,
    total_contract_price: totalContractPrice,
    paid_amount: paidAmount,
    balance,
    principal_balance: principalBalance,
    statement_balance: scheduleBalance,
    excess_ma_available: excessMaAvailable,
    excess_ma_generated: roundAmount(scheduleDue.excessMaGenerated || 0),
    excess_ma_used: roundAmount(scheduleDue.excessMaUsed || 0),
    terms: {
      downpayment_percent: Number(unit.downpayment_percent || 0),
      downpayment_gives: downpaymentGives,
      downpayment_discount_rate: Number(unit.downpayment_discount_rate || 0),
      downpayment_discount_amount: roundAmount(unit.downpayment_discount_amount || 0),
      downpayment_net_amount: downpaymentNet,
      payment_terms_months: paymentTermsMonths,
      monthly_amortization: lockedMonthly,
    },
    suggestions,
    next_due: nextDue,
  }
}

const paymentFields = `
  py.id,
  py.client_unit_id,
  c.full_name AS client_name,
  l.unit_id,
  p.name AS project_name,
  l.net_selling_price,
  l.legal_misc_fee,
  l.total_contract_price,
  py.amount,
  py.payment_type,
  COALESCE(py.apply_excess_ma, 0) AS apply_excess_ma,
  py.payment_method,
  py.reference_id,
  DATE_FORMAT(py.payment_date, '%Y-%m-%d') AS payment_date,
  py.status,
  py.verified_by,
  verifier.full_name AS verified_by_name,
  DATE_FORMAT(py.verified_at, '%Y-%m-%d %H:%i:%s') AS verified_at,
  DATE_FORMAT(py.created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
  DATE_FORMAT(py.updated_at, '%Y-%m-%d %H:%i:%s') AS updated_at
`

const paymentJoins = `
  FROM payments py
  INNER JOIN client_units cu ON cu.id = py.client_unit_id
  INNER JOIN clients c ON c.id = cu.client_id
  INNER JOIN listings l ON l.id = cu.listing_id
  INNER JOIN projects p ON p.id = l.project_id
  LEFT JOIN users verifier ON verifier.id = py.verified_by
`

const clientUnitExists = async (connectionOrDb, clientUnitId) => {
  const [rows] = await connectionOrDb.query(
    `
    SELECT id
    FROM client_units
    WHERE id = ?
    LIMIT 1
    `,
    [clientUnitId]
  )

  return rows.length > 0
}

const getPaymentById = async (id) => {
  const [rows] = await db.query(
    `
    SELECT
      ${paymentFields}
    ${paymentJoins}
    WHERE py.id = ?
    LIMIT 1
    `,
    [id]
  )

  return rows[0] || null
}

export const recomputeClientUnitBalance = async (
  connectionOrDb,
  clientUnitId,
  options = {}
) => {
  const [clientUnitRows] = await connectionOrDb.query(
    `
    SELECT
      cu.id,
      cu.status,
      cu.listing_id,
      l.reservation_fee,
      COALESCE(
        NULLIF(cu.offer_purchase_price, 0),
        NULLIF(l.total_contract_price, 0),
        l.net_selling_price + l.legal_misc_fee,
        l.net_selling_price,
        0
      ) AS total_contract_price
    FROM client_units cu
    INNER JOIN listings l ON l.id = cu.listing_id
    WHERE cu.id = ?
    LIMIT 1
    `,
    [clientUnitId]
  )

  const clientUnit = clientUnitRows[0]

  if (!clientUnit) {
    return null
  }

  const [paymentRows] = await connectionOrDb.query(
    `
    SELECT
      COALESCE(SUM(CASE WHEN (payment_type IS NULL OR payment_type <> 'excess_ma') THEN amount ELSE 0 END), 0) AS paid_amount,
      COALESCE(SUM(CASE WHEN payment_type IN ('reservation_fee', 'reservation') THEN amount ELSE 0 END), 0) AS reservation_paid,
      COALESCE(SUM(CASE WHEN payment_type IN ('downpayment', 'monthly', 'balloon', 'advance_payment', 'legal_misc', 'full_payment', 'other') THEN amount ELSE 0 END), 0) AS active_payment_paid
    FROM payments
    WHERE client_unit_id = ?
      AND status = 'verified'
    `,
    [clientUnitId]
  )

  const totalContractPrice = normalizeMoney(clientUnit.total_contract_price)
  const paidAmount = normalizeMoney(paymentRows[0]?.paid_amount)
  const reservationPaid = normalizeMoney(paymentRows[0]?.reservation_paid)
  const activePaymentPaid = normalizeMoney(paymentRows[0]?.active_payment_paid)
  const reservationFee = normalizeMoney(clientUnit.reservation_fee)
  const scheduleSummary = await rebuildPaymentSchedule(connectionOrDb, clientUnitId)
  const balance = normalizeMoney(
    scheduleSummary?.principal_balance ?? Math.max(totalContractPrice - paidAmount, 0)
  )

  let nextStatus = clientUnit.status
  let nextListingStatus = null

  if (!['cancelled', 'closed'].includes(clientUnit.status)) {
    if (balance <= 0 && paidAmount > 0) {
      nextStatus = 'fully_paid'
      nextListingStatus = 'sold'
    } else if (activePaymentPaid > 0) {
      nextStatus = 'active'
      nextListingStatus = 'sold'
    } else if (reservationPaid > 0 || paidAmount >= reservationFee) {
      nextStatus = 'reserved'
      nextListingStatus = 'reserved'
    }
  }

  await connectionOrDb.query(
    `
    UPDATE client_units
    SET
      balance = ?,
      status = ?
    WHERE id = ?
    `,
    [balance, nextStatus, clientUnitId]
  )

  if (nextListingStatus) {
    await connectionOrDb.query(
      `
      UPDATE listings
      SET status = ?
      WHERE id = ?
      `,
      [nextListingStatus, clientUnit.listing_id]
    )
  }

  await refreshCommissionEligibility(clientUnitId, connectionOrDb, options)

  return {
    totalContractPrice,
    paidAmount,
    reservationPaid,
    activePaymentPaid,
    balance,
    statementBalance: balance,
    statementTotal: scheduleSummary?.total_statement_due ?? null,
    status: nextStatus,
    listingStatus: nextListingStatus,
  }
}

export const getPayments = async (req, res) => {
  const { search, status, client_unit_id, payment_type, payment_method } = req.query
  const { page, limit, offset } = getPaginationOptions(req.query)
  const { dateFrom, dateTo } = getDateRangeFromQuery(req.query)
  const { sortColumn, sortDir } = getSortOptions(
    req.query,
    {
      id: 'py.id',
      payment_date: 'py.payment_date',
      amount: 'py.amount',
      status: 'py.status',
      payment_type: 'py.payment_type',
      client_name: 'c.full_name',
      unit_id: 'l.unit_id',
      created_at: 'py.created_at',
    },
    { defaultSortBy: 'payment_date', defaultSortDir: 'DESC' }
  )

  const conditions = []
  const params = []

  if (!isMissing(search)) {
    const searchTerm = `%${search}%`

    conditions.push(`
      (
        c.full_name LIKE ?
        OR l.unit_id LIKE ?
        OR p.name LIKE ?
        OR py.payment_type LIKE ?
        OR py.payment_method LIKE ?
        OR py.reference_id LIKE ?
        OR py.status LIKE ?
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
    conditions.push('py.status = ?')
    params.push(status)
  }

  if (!isMissing(client_unit_id)) {
    conditions.push('py.client_unit_id = ?')
    params.push(client_unit_id)
  }

  if (!isMissing(payment_type) && payment_type !== 'all') {
    conditions.push('py.payment_type = ?')
    params.push(payment_type)
  }

  if (!isMissing(payment_method) && payment_method !== 'all') {
    conditions.push('py.payment_method = ?')
    params.push(payment_method)
  }

  addDateRangeConditions({
    conditions,
    params,
    column: 'py.payment_date',
    dateFrom,
    dateTo,
  })

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const [[countRow]] = await db.query(
    `
    SELECT COUNT(*) AS totalRows
    ${paymentJoins}
    ${whereClause}
    `,
    params
  )

  const [payments] = await db.query(
    `
    SELECT
      ${paymentFields}
    ${paymentJoins}
    ${whereClause}
    ORDER BY ${sortColumn} ${sortDir}, py.id DESC
    LIMIT ? OFFSET ?
    `,
    [...params, limit, offset]
  )

  const pagination = buildPagination({
    page,
    limit,
    totalRows: countRow.totalRows,
  })

  res.status(200).json({
    message: 'Payments fetched successfully',
    payments,
    data: payments,
    pagination,
  })
}

export const getPayment = async (req, res) => {
  const { id } = req.params

  const payment = await getPaymentById(id)

  if (!payment) {
    return res.status(404).json({
      message: 'Payment not found',
    })
  }

  res.status(200).json({
    message: 'Payment fetched successfully',
    payment,
    data: payment,
  })
}

export const getPaymentsByClientUnit = async (req, res) => {
  const { clientUnitId } = req.params

  const exists = await clientUnitExists(db, clientUnitId)

  if (!exists) {
    return res.status(404).json({
      message: 'Client unit not found',
    })
  }

  const [payments] = await db.query(
    `
    SELECT
      ${paymentFields}
    ${paymentJoins}
    WHERE py.client_unit_id = ?
    ORDER BY py.payment_date DESC, py.id DESC
    `,
    [clientUnitId]
  )

  res.status(200).json({
    message: 'Client unit payments fetched successfully',
    payments,
    data: payments,
  })
}

export const getPaymentSuggestions = async (req, res) => {
  const { clientUnitId } = req.params

  if (isMissing(clientUnitId)) {
    return res.status(400).json({
      message: 'Client unit is required',
    })
  }

  const suggestions = await buildPaymentSuggestions(db, clientUnitId)

  if (!suggestions) {
    return res.status(404).json({
      message: 'Client unit not found',
    })
  }

  res.status(200).json({
    message: 'Payment suggestions fetched successfully',
    paymentSuggestions: suggestions,
    suggestions: suggestions.suggestions,
    next_due: suggestions.next_due,
    data: suggestions,
  })
}

export const createPayment = async (req, res) => {
  const {
    client_unit_id,
    amount,
    payment_type,
    apply_excess_ma = false,
    payment_method,
    reference_id,
    payment_date,
    status = 'pending',
  } = req.body

  if (isMissing(client_unit_id)) {
    return res.status(400).json({
      message: 'Client unit is required',
    })
  }

  const amountValidation = validateAmount(amount)

  if (!amountValidation.isValid) {
    return res.status(400).json({
      message: 'Amount must be greater than 0',
    })
  }

  const finalStatus = validatePaymentStatus(status)

  if (!finalStatus) {
    return res.status(400).json({
      message: 'Invalid payment status',
    })
  }

  const connection = await db.getConnection()

  try {
    await connection.beginTransaction()

    const exists = await clientUnitExists(connection, client_unit_id)

    if (!exists) {
      await connection.rollback()
      return res.status(404).json({
        message: 'Client unit not found',
      })
    }

    const finalPaymentType = nullableValue(payment_type)
    const finalApplyExcessMa = ['true', '1', 'yes', 'on'].includes(String(apply_excess_ma).toLowerCase()) || apply_excess_ma === true || apply_excess_ma === 1
    const finalPaymentMethod = isExcessMaPayment(finalPaymentType)
      ? 'excess_ma'
      : nullableValue(payment_method)
    const finalPaymentDate = toDateOnly(payment_date) || getTodayDateOnly()

    if (isFutureDateOnly(finalPaymentDate)) {
      await connection.rollback()
      return res.status(400).json({
        message: 'Payment Date cannot be a future date. Use the actual received date. If the client is paying ahead, choose Advance Payment.',
      })
    }

    if (finalStatus === 'verified' && isMonthlyPaymentType(finalPaymentType)) {
      const scheduleDue = await getNextPaymentScheduleDue(connection, client_unit_id)
      const nextMonthlyRow = scheduleDue.rows?.find((row) => (
        row.schedule_type === 'monthly' &&
        normalizeMoney(row.balance) > 0
      ))

      if (nextMonthlyRow?.due_date && finalPaymentDate < nextMonthlyRow.due_date) {
        await connection.rollback()
        return res.status(400).json({
          message: `Monthly payment is not yet due. Next monthly due date is ${nextMonthlyRow.due_date}. Use Advance Payment if the client wants to pay ahead.`,
        })
      }
    }

    const finalReferenceId = isCashPaymentMethod(finalPaymentMethod) || isExcessMaPayment(finalPaymentType)
      ? null
      : nullableValue(reference_id)

    if (finalStatus === 'verified' && isExcessMaPayment(finalPaymentType)) {
      const scheduleDue = await getNextPaymentScheduleDue(connection, client_unit_id)
      const availableExcessMa = normalizeMoney(scheduleDue.excessMaAvailable || 0)

      if (amountValidation.value > availableExcessMa) {
        await connection.rollback()
        return res.status(400).json({
          message: `Excess MA available is only ₱${availableExcessMa.toFixed(2)}`,
        })
      }
    }

    if (isReferenceRequired({ paymentMethod: finalPaymentMethod, paymentType: finalPaymentType, status: finalStatus }) && !finalReferenceId) {
      await connection.rollback()
      return res.status(400).json({
        message: 'Reference ID is required for verified non-cash payments',
      })
    }

    const verifiedBy = finalStatus === 'verified' ? req.user.id : null
    const verifiedAt = finalStatus === 'verified' ? new Date() : null

    const [result] = await connection.query(
      `
      INSERT INTO payments (
        client_unit_id,
        amount,
        payment_type,
        apply_excess_ma,
        payment_method,
        reference_id,
        payment_date,
        status,
        verified_by,
        verified_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        client_unit_id,
        amountValidation.value,
        finalPaymentType,
        finalApplyExcessMa ? 1 : 0,
        finalPaymentMethod,
        finalReferenceId,
        finalPaymentDate,
        finalStatus,
        verifiedBy,
        verifiedAt,
      ]
    )

    if (isCashPaymentMethod(finalPaymentMethod)) {
      const cashReferenceId = await generateCashReferenceId(connection, {
        clientUnitId: client_unit_id,
        paymentDate: finalPaymentDate,
      })

      await connection.query(
        `UPDATE payments SET reference_id = ? WHERE id = ?`,
        [cashReferenceId, result.insertId]
      )
    }

    const balanceSummary = await recomputeClientUnitBalance(
      connection,
      client_unit_id,
      { actorRole: req.user.role }
    )

    const eligibilitySummary = await refreshCommissionEligibility(
      client_unit_id,
      connection,
      { actorRole: req.user.role }
    )

    await connection.commit()

    await safeCreateAuditLog({
      userId: req.user.id,
      action: 'payment',
      module: 'Payments',
      description: `Added payment for client unit ${client_unit_id}`,
      ipAddress: getClientIp(req),
    })

    res.status(201).json({
      message: 'Payment created successfully',
      paymentId: result.insertId,
      balanceSummary,
      eligibilitySummary,
      data: {
        paymentId: result.insertId,
        balanceSummary,
        eligibilitySummary,
      },
    })
  } catch (err) {
    await connection.rollback()
    throw err
  } finally {
    connection.release()
  }
}

export const updatePayment = async (req, res) => {
  const { id } = req.params

  const {
    client_unit_id,
    amount,
    payment_type,
    apply_excess_ma,
    payment_method,
    reference_id,
    payment_date,
    status,
  } = req.body

  const existingPayment = await getPaymentById(id)

  if (!existingPayment) {
    return res.status(404).json({
      message: 'Payment not found',
    })
  }

  const nextClientUnitId = isMissing(client_unit_id)
    ? existingPayment.client_unit_id
    : client_unit_id

  const amountValidation = isMissing(amount)
    ? {
        isValid: true,
        value: normalizeMoney(existingPayment.amount),
      }
    : validateAmount(amount)

  if (!amountValidation.isValid) {
    return res.status(400).json({
      message: 'Amount must be greater than 0',
    })
  }

  const nextAmount = amountValidation.value

  const nextStatus = isMissing(status)
    ? existingPayment.status
    : validatePaymentStatus(status)

  if (!nextStatus) {
    return res.status(400).json({
      message: 'Invalid payment status',
    })
  }

  const connection = await db.getConnection()

  try {
    await connection.beginTransaction()

    const exists = await clientUnitExists(connection, nextClientUnitId)

    if (!exists) {
      await connection.rollback()
      return res.status(404).json({
        message: 'Client unit not found',
      })
    }

    const becameVerified =
      existingPayment.status !== 'verified' && nextStatus === 'verified'

    const shouldClearVerification = nextStatus !== 'verified'

    const verifiedBy = becameVerified
      ? req.user.id
      : shouldClearVerification
        ? null
        : existingPayment.verified_by

    const verifiedAt = becameVerified
      ? new Date()
      : shouldClearVerification
        ? null
        : existingPayment.verified_at

    const nextPaymentMethod = !isMissing(payment_method)
      ? nullableValue(payment_method)
      : existingPayment.payment_method
    const nextPaymentDate = !isMissing(payment_date)
      ? toDateOnly(payment_date)
      : existingPayment.payment_date

    if (isFutureDateOnly(nextPaymentDate)) {
      await connection.rollback()
      return res.status(400).json({
        message: 'Payment Date cannot be a future date. Use the actual received date. If the client is paying ahead, choose Advance Payment.',
      })
    }

    let nextReferenceId = !isMissing(reference_id)
      ? nullableValue(reference_id)
      : existingPayment.reference_id

    if (isCashPaymentMethod(nextPaymentMethod) && !nextReferenceId) {
      nextReferenceId = await generateCashReferenceId(connection, {
        clientUnitId: nextClientUnitId,
        paymentDate: nextPaymentDate,
      })
    }

    if (isCashPaymentMethod(nextPaymentMethod) && !isMissing(payment_method)) {
      nextReferenceId = nextReferenceId || await generateCashReferenceId(connection, {
        clientUnitId: nextClientUnitId,
        paymentDate: nextPaymentDate,
      })
    }

    const nextPaymentType = !isMissing(payment_type)
      ? nullableValue(payment_type)
      : existingPayment.payment_type
    const nextApplyExcessMa = !isMissing(apply_excess_ma)
      ? ['true', '1', 'yes', 'on'].includes(String(apply_excess_ma).toLowerCase()) || apply_excess_ma === true || apply_excess_ma === 1
      : Boolean(Number(existingPayment.apply_excess_ma || 0))

    if (isExcessMaPayment(nextPaymentType)) {
      nextReferenceId = null
    }

    if (nextStatus === 'verified' && isExcessMaPayment(nextPaymentType)) {
      const scheduleDue = await getNextPaymentScheduleDue(connection, nextClientUnitId)
      const reusableCurrentAmount = existingPayment.status === 'verified' && isExcessMaPayment(existingPayment.payment_type)
        ? normalizeMoney(existingPayment.amount)
        : 0
      const availableExcessMa = normalizeMoney((scheduleDue.excessMaAvailable || 0) + reusableCurrentAmount)

      if (nextAmount > availableExcessMa) {
        await connection.rollback()
        return res.status(400).json({
          message: `Excess MA available is only ₱${availableExcessMa.toFixed(2)}`,
        })
      }
    }

    if (isReferenceRequired({ paymentMethod: nextPaymentMethod, paymentType: nextPaymentType, status: nextStatus }) && !nextReferenceId) {
      await connection.rollback()
      return res.status(400).json({
        message: 'Reference ID is required for verified non-cash payments',
      })
    }

    await connection.query(
      `
      UPDATE payments
      SET
        client_unit_id = ?,
        amount = ?,
        payment_type = ?,
        apply_excess_ma = ?,
        payment_method = ?,
        reference_id = ?,
        payment_date = ?,
        status = ?,
        verified_by = ?,
        verified_at = ?
      WHERE id = ?
      `,
      [
        nextClientUnitId,
        nextAmount,
        nextPaymentType,
        nextApplyExcessMa ? 1 : 0,
        isExcessMaPayment(nextPaymentType) ? 'excess_ma' : nextPaymentMethod,
        nextReferenceId,
        nextPaymentDate,
        nextStatus,
        verifiedBy,
        verifiedAt,
        id,
      ]
    )

    const affectedClientUnitIds = [
      Number(existingPayment.client_unit_id),
      Number(nextClientUnitId),
    ].filter((value, index, arr) => arr.indexOf(value) === index)

    const balanceSummaries = []
    const eligibilitySummaries = []

    for (const affectedClientUnitId of affectedClientUnitIds) {
      const balanceSummary = await recomputeClientUnitBalance(
        connection,
        affectedClientUnitId,
        { actorRole: req.user.role }
      )

      const eligibilitySummary = await refreshCommissionEligibility(
        affectedClientUnitId,
        connection,
        { actorRole: req.user.role }
      )

      balanceSummaries.push({
        client_unit_id: affectedClientUnitId,
        balanceSummary,
      })

      eligibilitySummaries.push({
        client_unit_id: affectedClientUnitId,
        eligibilitySummary,
      })
    }

    await connection.commit()

    await safeCreateAuditLog({
      userId: req.user.id,
      action: 'update',
      module: 'Payments',
      description: `Updated payment ${id}`,
      ipAddress: getClientIp(req),
    })

    res.status(200).json({
      message: 'Payment updated successfully',
      balanceSummaries,
      eligibilitySummaries,
      data: {
        paymentId: Number(id),
        balanceSummaries,
        eligibilitySummaries,
      },
    })
  } catch (err) {
    await connection.rollback()
    throw err
  } finally {
    connection.release()
  }
}

export const deletePayment = async (req, res) => {
  const { id } = req.params

  const existingPayment = await getPaymentById(id)

  if (!existingPayment) {
    return res.status(404).json({
      message: 'Payment not found',
    })
  }

  if (existingPayment.status === 'released') {
    return res.status(400).json({
      message: 'This payment is already released/accounted and cannot be deleted.',
    })
  }

  const connection = await db.getConnection()

  try {
    await connection.beginTransaction()

    await connection.query(
      `
      DELETE FROM payments
      WHERE id = ?
      `,
      [id]
    )

    const balanceSummary = await recomputeClientUnitBalance(
      connection,
      existingPayment.client_unit_id,
      { actorRole: req.user.role }
    )

    const eligibilitySummary = await refreshCommissionEligibility(
      existingPayment.client_unit_id,
      connection,
      { actorRole: req.user.role }
    )

    await connection.commit()

    await safeCreateAuditLog({
      userId: req.user.id,
      action: 'delete',
      module: 'Payments',
      description: `Deleted payment ${id} from client unit ${existingPayment.client_unit_id}`,
      ipAddress: getClientIp(req),
    })

    res.status(200).json({
      message: 'Payment deleted successfully',
      data: {
        paymentId: Number(id),
        client_unit_id: existingPayment.client_unit_id,
        balanceSummary,
        eligibilitySummary,
      },
    })
  } catch (err) {
    await connection.rollback()
    throw err
  } finally {
    connection.release()
  }
}
