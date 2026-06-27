const money = (value) => Number(Number(value || 0).toFixed(2))

const allowedScheduleTypes = new Set([
  'reservation',
  'downpayment',
  'monthly',
  'balloon',
  'legal_misc',
  'penalty',
  'other',
])

const normalizeScheduleType = (scheduleType) => {
  const normalized = String(scheduleType || '').trim().toLowerCase()
  return allowedScheduleTypes.has(normalized) ? normalized : 'other'
}

const toDateOnly = (value) => {
  if (!value) return null

  if (typeof value === 'string') {
    const match = value.trim().match(/^(\d{4}-\d{2}-\d{2})/)
    if (match) return match[1]
  }

  const parsed = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(parsed.getTime())) return null

  const year = parsed.getFullYear()
  const month = String(parsed.getMonth() + 1).padStart(2, '0')
  const day = String(parsed.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const addMonths = (dateValue, months) => {
  const date = dateValue instanceof Date ? new Date(dateValue) : new Date(dateValue)
  if (Number.isNaN(date.getTime())) return null
  const day = date.getDate()
  date.setMonth(date.getMonth() + months)

  if (date.getDate() < day) {
    date.setDate(0)
  }

  return date
}

const ordinal = (value) => {
  const number = Number(value)
  const suffix = number % 10 === 1 && number % 100 !== 11
    ? 'st'
    : number % 10 === 2 && number % 100 !== 12
      ? 'nd'
      : number % 10 === 3 && number % 100 !== 13
        ? 'rd'
        : 'th'

  return `${number}${suffix}`
}

const isFutureDate = (dueDate, paidDate) => {
  const due = toDateOnly(dueDate)
  const paid = toDateOnly(paidDate)
  if (!due || !paid) return false
  return due > paid
}

const isPastDate = (dueDate) => {
  const due = toDateOnly(dueDate)
  const today = toDateOnly(new Date())
  if (!due || !today) return false
  return due < today
}

const firstPositive = (...values) => {
  for (const value of values) {
    const parsed = money(value)
    if (parsed > 0) return parsed
  }

  return 0
}

const truthyValue = (value) => (
  value === true ||
  value === 1 ||
  value === '1' ||
  String(value || '').trim().toLowerCase() === 'true' ||
  String(value || '').trim().toLowerCase() === 'yes'
)

const normalizeLegalMiscPaymentMode = (value) => {
  const normalized = String(value || '').trim().toLowerCase()

  if (['deferred', 'pay_later', 'separate'].includes(normalized)) {
    return 'deferred'
  }

  return 'included'
}

const isLegalMiscDeferred = (unit = {}) => {
  return truthyValue(unit.defer_legal_misc_fee) ||
    normalizeLegalMiscPaymentMode(unit.legal_misc_payment_mode) === 'deferred'
}

const getDeferredLegalMiscAmount = (unit = {}) => {
  return isLegalMiscDeferred(unit) ? money(unit.legal_misc_fee) : 0
}

const getClientUnitPlan = async (connectionOrDb, clientUnitId) => {
  const [rows] = await connectionOrDb.query(
    `
    SELECT
      cu.*,
      l.unit_id,
      l.reservation_fee AS listing_reservation_fee,
      l.net_selling_price,
      l.legal_misc_fee,
      l.annual_interest_rate AS listing_annual_interest_rate,
      l.total_contract_price AS listing_total_contract_price,
      (
        SELECT JSON_ARRAYAGG(
          JSON_OBJECT(
            'installment_no', dpt.installment_no,
            'due_date', DATE_FORMAT(dpt.due_date, '%Y-%m-%d'),
            'gross_amount', dpt.gross_amount,
            'discount_rate', dpt.discount_rate,
            'discount_amount', dpt.discount_amount,
            'net_amount', dpt.net_amount
          )
        )
        FROM client_unit_downpayment_terms dpt
        WHERE dpt.client_unit_id = cu.id
      ) AS downpayment_terms_json
    FROM client_units cu
    INNER JOIN listings l ON l.id = cu.listing_id
    WHERE cu.id = ?
    LIMIT 1
    `,
    [clientUnitId]
  )

  return rows[0] || null
}

const getVerifiedPayments = async (connectionOrDb, clientUnitId) => {
  const [rows] = await connectionOrDb.query(
    `
    SELECT
      id,
      amount,
      payment_type,
      COALESCE(apply_excess_ma, 0) AS apply_excess_ma,
      payment_method,
      reference_id,
      DATE_FORMAT(payment_date, '%Y-%m-%d') AS payment_date,
      status
    FROM payments
    WHERE client_unit_id = ?
      AND status = 'verified'
    ORDER BY payment_date ASC, id ASC
    `,
    [clientUnitId]
  )

  return rows
}

const pushReferenceDetail = (row, detail) => {
  const appliedAmount = money(detail.applied_amount)
  if (appliedAmount <= 0) return

  row.reference_details = [
    ...(Array.isArray(row.reference_details) ? row.reference_details : []),
    {
      payment_id: Number(detail.payment_id),
      reference_id: detail.reference_id,
      applied_amount: appliedAmount,
      payment_date: detail.payment_date,
      payment_type: detail.payment_type,
    },
  ]

  const nextReference = `${detail.reference_id} (${appliedAmount.toFixed(2)})`
  row.reference_no = row.reference_no
    ? `${row.reference_no}, ${nextReference}`
    : nextReference
}

const getAnnualInterestRate = (unit) => {
  const candidates = [
    unit.interest_rate,
    unit.annual_interest_rate,
    unit.listing_annual_interest_rate,
    unit.interest_rate_percent,
    unit.contract_interest_rate,
  ]

  for (const value of candidates) {
    const parsed = Number(value)
    if (Number.isFinite(parsed) && parsed > 0) return parsed
  }

  return 0
}

const parseDownpaymentTerms = (value) => {
  if (!value) return []

  let parsed = value
  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value)
    } catch {
      return []
    }
  }

  if (!Array.isArray(parsed)) return []

  return parsed
    .map((term) => ({
      installment_no: Number(term.installment_no),
      due_date: toDateOnly(term.due_date),
      gross_amount: money(term.gross_amount),
      discount_rate: money(term.discount_rate),
      discount_amount: money(term.discount_amount),
      net_amount: money(term.net_amount),
    }))
    .filter((term) => Number.isInteger(term.installment_no) && term.installment_no > 0)
    .sort((a, b) => a.installment_no - b.installment_no)
}

const getOfferBalanceAmount = ({
  unit,
  totalContractPrice,
  reservationFee,
  downpaymentNet,
  deferredCashAmount,
  legalMiscDeferredAmount = 0,
}) => {
  const explicitBalance = firstPositive(
    unit.offer_balance_amount,
    unit.amortized_principal_amount,
    unit.original_principal_balance,
    unit.contract_balance_amount,
    unit.principal_balance
  )

  if (explicitBalance > 0) return explicitBalance

  const computedBalance = money(
    Math.max(
      totalContractPrice -
        reservationFee -
        downpaymentNet -
        deferredCashAmount -
        legalMiscDeferredAmount,
      0
    )
  )

  if (computedBalance > 0) return computedBalance

  return money(unit.balance)
}

const buildBaseRows = (unit) => {
  const totalContractPrice = firstPositive(
    unit.offer_purchase_price,
    unit.listing_total_contract_price,
    unit.net_selling_price
  )
  const legalMiscDeferredAmount = getDeferredLegalMiscAmount(unit)
  const legalMiscDueDate = toDateOnly(unit.legal_misc_due_date)
  const reservationFee = firstPositive(
    unit.reservation_fee_amount,
    unit.listing_reservation_fee
  )
  const downpaymentNet = firstPositive(
    unit.downpayment_net_amount,
    unit.downpayment_amount
  )
  const downpaymentGives = Math.max(Number(unit.downpayment_gives || 0), 1)
  const downpaymentTerms = parseDownpaymentTerms(unit.downpayment_terms_json)
  const deferredCashAmount = money(unit.deferred_cash_amount)
  const terms = Math.max(Number(unit.payment_terms_months || 0), 0)
  const monthlyAmortization = money(unit.monthly_amortization)
  const annualInterestRate = getAnnualInterestRate(unit)
  const monthlyRate = annualInterestRate / 100 / 12
  const balloonPaymentAmount = money(unit.balloon_payment_amount)
  const startingDate = toDateOnly(unit.starting_date) || toDateOnly(unit.created_at) || toDateOnly(new Date())
  const firstDueDate = toDateOnly(unit.due_date) || startingDate
  const rows = []

  let scheduledRunningBalance = money(totalContractPrice)

  const pushRow = ({
    dueDate,
    description,
    scheduleType,
    principalDue,
    interestDue = 0,
    penaltyDue = 0,
    totalDue,
    runningBalance = null,
    sortOrder,
  }) => {
    const principal = money(principalDue ?? totalDue)
    const interest = money(interestDue)
    const penalty = money(penaltyDue)
    const due = money(totalDue ?? principal + interest + penalty)

    if (due <= 0 && principal <= 0 && interest <= 0 && penalty <= 0) return

    const nextRunningBalance = runningBalance === null || runningBalance === undefined
      ? money(Math.max(scheduledRunningBalance - principal, 0))
      : money(Math.max(runningBalance, 0))

    rows.push({
      due_date: toDateOnly(dueDate),
      description,
      schedule_type: normalizeScheduleType(scheduleType),
      principal_due: principal,
      interest_due: interest,
      penalty_due: penalty,
      total_due: due,
      amount_paid: 0,
      advance_applied: 0,
      excess_ma_used: 0,
      balance: due,
      date_paid: null,
      reference_no: null,
      reference_details: [],
      status: 'not_due',
      running_balance: nextRunningBalance,
      sort_order: sortOrder,
    })

    scheduledRunningBalance = nextRunningBalance
  }

  let sortOrder = 1
  pushRow({
    dueDate: startingDate,
    description: 'Reservation Fee',
    scheduleType: 'reservation',
    principalDue: reservationFee,
    interestDue: 0,
    totalDue: reservationFee,
    sortOrder: sortOrder++,
  })

  if (unit.mode_of_payment === 'cash') {
    const cashBalance = firstPositive(
      deferredCashAmount,
      money(totalContractPrice - reservationFee)
    )

    pushRow({
      dueDate: firstDueDate,
      description: 'Cash Balance',
      scheduleType: 'full_payment',
      principalDue: cashBalance,
      interestDue: 0,
      totalDue: cashBalance,
      sortOrder: sortOrder++,
    })

    return rows
  }

  if (downpaymentNet > 0) {
    if (downpaymentTerms.length > 0) {
      downpaymentTerms.forEach((term, index) => {
        const amount = money(term.net_amount)
        pushRow({
          dueDate: term.due_date || addMonths(firstDueDate, index),
          description: `${ordinal(term.installment_no || index + 1)} Downpayment`,
          scheduleType: 'downpayment',
          principalDue: amount,
          interestDue: 0,
          totalDue: amount,
          sortOrder: sortOrder++,
        })
      })
    } else {
      const perDownpayment = money(downpaymentNet / downpaymentGives)
      let remainingDownpayment = downpaymentNet

      for (let index = 1; index <= downpaymentGives; index += 1) {
        const amount = index === downpaymentGives
          ? remainingDownpayment
          : perDownpayment

        pushRow({
          dueDate: addMonths(firstDueDate, index - 1),
          description: `${ordinal(index)} Downpayment`,
          scheduleType: 'downpayment',
          principalDue: amount,
          interestDue: 0,
          totalDue: amount,
          sortOrder: sortOrder++,
        })

        remainingDownpayment = money(remainingDownpayment - amount)
      }
    }
  }

  const monthlyStart = addMonths(firstDueDate, downpaymentNet > 0 ? downpaymentGives : 0)
  const offerBalanceAmount = getOfferBalanceAmount({
    unit,
    totalContractPrice,
    reservationFee,
    downpaymentNet,
    deferredCashAmount,
    legalMiscDeferredAmount,
  })
  const amortizedPrincipal = money(Math.max(offerBalanceAmount - balloonPaymentAmount, 0))
  const monthlyBase = monthlyAmortization > 0
    ? monthlyAmortization
    : terms > 0
      ? money(amortizedPrincipal / terms)
      : 0

  let currentMonthlyBalance = amortizedPrincipal

  for (let index = 1; index <= terms; index += 1) {
    if (currentMonthlyBalance <= 0) break

    const isLastMonth = index === terms
    const interestDue = monthlyRate > 0
      ? money(currentMonthlyBalance * monthlyRate)
      : 0
    let principalDue = money(monthlyBase - interestDue)

    if (monthlyRate <= 0) {
      principalDue = money(monthlyBase)
    }

    if (isLastMonth || principalDue > currentMonthlyBalance) {
      principalDue = money(currentMonthlyBalance)
    }

    principalDue = money(Math.max(principalDue, 0))
    const totalDue = money(principalDue + interestDue)
    const endingBalance = money(Math.max(currentMonthlyBalance - principalDue, 0))
    const projectedContractBalance = money(endingBalance + balloonPaymentAmount)

    pushRow({
      dueDate: addMonths(monthlyStart, index - 1),
      description: `${ordinal(index)} Monthly Payment`,
      scheduleType: 'monthly',
      principalDue,
      interestDue,
      totalDue,
      runningBalance: projectedContractBalance,
      sortOrder: sortOrder++,
    })

    currentMonthlyBalance = endingBalance
  }

  const scheduledBalloonAmount = money(unit.balloon_payment_amount)

  if (scheduledBalloonAmount > 0) {
    pushRow({
      dueDate: addMonths(monthlyStart, terms),
      description: 'Balloon Payment',
      scheduleType: 'balloon',
      principalDue: scheduledBalloonAmount,
      interestDue: 0,
      totalDue: scheduledBalloonAmount,
      sortOrder: sortOrder++,
    })
  }

  if (legalMiscDeferredAmount > 0) {
    pushRow({
      dueDate: legalMiscDueDate || addMonths(monthlyStart, terms + (scheduledBalloonAmount > 0 ? 1 : 0)),
      description: 'Legal / Miscellaneous Fee',
      scheduleType: 'legal_misc',
      principalDue: legalMiscDeferredAmount,
      interestDue: 0,
      totalDue: legalMiscDeferredAmount,
      sortOrder: sortOrder++,
    })
  }

  return rows
}

const isExcessMaPayment = (paymentType) => {
  return String(paymentType || '').toLowerCase() === 'excess_ma'
}

const isAdvancePayment = (paymentType) => {
  const normalizedType = String(paymentType || '').toLowerCase()
  return normalizedType === 'advance' || normalizedType === 'advance_payment'
}

const isBalloonPayment = (paymentType) => {
  return String(paymentType || '').toLowerCase() === 'balloon'
}

const getExcessMaGeneratedFromRow = (row) => money(row.advance_applied)

const getStoredExcessMaUsedFromRow = (row) => {
  const stored = money(row.excess_ma_used)
  if (stored > 0) return stored

  return getRowExcessMaUsed(row)
}

const getActualCashPaidFromRow = (row) => money(row.amount_paid)

const getEffectiveAmountPaid = (row) => {
  return money(Math.max(
    getActualCashPaidFromRow(row) -
      getExcessMaGeneratedFromRow(row) +
      getStoredExcessMaUsedFromRow(row),
    0
  ))
}

const refreshRowBalance = (row) => {
  if (row?.is_excess_ma_credit === true || String(row?.description || '').toLowerCase() === 'advance payment') {
    row.balance = 0
    return row.balance
  }

  row.balance = money(Math.max(money(row.total_due) - getEffectiveAmountPaid(row), 0))
  return row.balance
}

const preferredScheduleTypes = (paymentType) => {
  switch (paymentType) {
    case 'reservation':
    case 'reservation_fee':
      return ['reservation', 'downpayment', 'monthly', 'full_payment']
    case 'downpayment':
      return ['downpayment', 'monthly', 'full_payment']
    case 'monthly':
      return ['monthly']
    case 'advance':
    case 'advance_payment':
    case 'excess_ma':
      return ['monthly']
    case 'balloon':
      return ['monthly', 'full_payment']
    case 'legal_misc':
      return ['legal_misc']
    case 'full_payment':
      return ['reservation', 'downpayment', 'monthly', 'full_payment']
    case 'other':
    default:
      return ['reservation', 'downpayment', 'monthly', 'full_payment']
  }
}

const findNextRowIndex = (rows, paymentType) => {
  if (isBalloonPayment(paymentType)) {
    for (let index = rows.length - 1; index >= 0; index -= 1) {
      const row = rows[index]
      if (row.schedule_type === 'monthly' && money(row.balance) > 0) {
        return index
      }
    }
  }

  const types = preferredScheduleTypes(paymentType)

  for (const type of types) {
    const index = rows.findIndex((row) => (
      row.schedule_type === type && money(row.balance) > 0
    ))

    if (index !== -1) return index
  }

  return rows.findIndex((row) => money(row.balance) > 0)
}


const isExcessMaCreditRow = (row) => {
  return row?.is_excess_ma_credit === true || String(row?.description || '').toLowerCase() === 'advance payment'
}

const getDisplayScheduleRows = (rows) => {
  return rows.filter((row) => !isExcessMaCreditRow(row))
}

const createPrincipalReductionRow = ({
  payment,
  paymentDate,
  paymentReference,
  description,
  scheduleType,
  cashAmount,
  excessMaAmount = 0,
  totalContractPrice,
}) => {
  const paidCash = money(cashAmount)
  const usedExcess = money(excessMaAmount)
  const totalApplied = money(paidCash + usedExcess)

  const row = {
    due_date: paymentDate,
    description,
    schedule_type: normalizeScheduleType(scheduleType),
    principal_due: totalApplied,
    interest_due: 0,
    penalty_due: 0,
    total_due: totalApplied,
    amount_paid: paidCash,
    advance_applied: 0,
    excess_ma_used: usedExcess,
    balance: 0,
    date_paid: paymentDate,
    reference_no: null,
    reference_details: [],
    status: 'paid',
    running_balance: totalContractPrice,
    sort_order: 999999,
  }

  if (paidCash > 0) {
    pushReferenceDetail(row, {
      payment_id: Number(payment.id),
      reference_id: paymentReference,
      applied_amount: paidCash,
      payment_date: paymentDate,
      payment_type: payment.payment_type || scheduleType,
    })
  }

  if (usedExcess > 0) {
    pushReferenceDetail(row, {
      payment_id: Number(payment.id),
      reference_id: `EXCESS-MA-${String(toDateOnly(paymentDate) || '').replaceAll('-', '')}-${String(payment?.id || 0).padStart(4, '0')}`,
      applied_amount: usedExcess,
      payment_date: paymentDate,
      payment_type: 'excess_ma_used',
    })
  }

  return row
}

const createAdvancePaymentRow = ({ payment, paymentDate, paymentReference, amount, totalContractPrice }) => {
  const paidAmount = money(amount)

  const row = {
    due_date: paymentDate,
    description: 'Advance Payment',
    schedule_type: 'other',
    principal_due: 0,
    interest_due: 0,
    penalty_due: 0,
    total_due: paidAmount,
    amount_paid: paidAmount,
    advance_applied: paidAmount,
    excess_ma_used: 0,
    balance: 0,
    date_paid: paymentDate,
    reference_no: null,
    reference_details: [],
    status: 'paid',
    running_balance: totalContractPrice,
    sort_order: 999999,
    is_excess_ma_credit: true,
  }

  pushReferenceDetail(row, {
    payment_id: Number(payment.id),
    reference_id: paymentReference,
    applied_amount: paidAmount,
    payment_date: paymentDate,
    payment_type: 'excess_ma_saved',
  })

  return row
}

const reduceFutureMonthlyRowsFromEnd = (rows, reductionAmount, { fullRowsOnly = false } = {}) => {
  let remainingReduction = money(reductionAmount)
  let appliedReduction = 0

  for (let index = rows.length - 1; index >= 0 && remainingReduction > 0; index -= 1) {
    const row = rows[index]

    if (row.schedule_type !== 'monthly') continue

    const rowBalance = money(row.balance)

    if (rowBalance <= 0) continue
    if (fullRowsOnly && remainingReduction < rowBalance) continue

    const reduction = Math.min(rowBalance, remainingReduction)

    row.total_due = money(Math.max(money(row.total_due) - reduction, 0))
    row.principal_due = money(Math.max(money(row.principal_due) - reduction, 0))
    row.balance = money(Math.max(money(row.balance) - reduction, 0))
    row.principal_reduced = money(money(row.principal_reduced) + reduction)

    appliedReduction = money(appliedReduction + reduction)
    remainingReduction = money(remainingReduction - reduction)
  }

  for (let index = rows.length - 1; index >= 0; index -= 1) {
    const row = rows[index]

    if (
      row.schedule_type === 'monthly' &&
      money(row.total_due) <= 0 &&
      money(row.amount_paid) <= 0 &&
      money(row.principal_reduced) > 0
    ) {
      rows.splice(index, 1)
    }
  }

  return appliedReduction
}

const removeRemainingUnpaidContractRows = (rows) => {
  for (let index = rows.length - 1; index >= 0; index -= 1) {
    const row = rows[index]
    const type = String(row.schedule_type || '').toLowerCase()
    const removableType = ['monthly', 'balloon', 'full_payment', 'legal_misc'].includes(type)

    if (!removableType) continue
    if (money(row.amount_paid) > 0 || money(row.advance_applied) > 0) continue

    rows.splice(index, 1)
  }
}

const sortRowsForStatement = (rows) => {
  rows.sort((first, second) => {
    const firstDate = toDateOnly(first.due_date) || ''
    const secondDate = toDateOnly(second.due_date) || ''

    if (firstDate !== secondDate) return firstDate.localeCompare(secondDate)

    return Number(first.sort_order || 0) - Number(second.sort_order || 0)
  })

  rows.forEach((row, index) => {
    row.sort_order = index + 1
  })
}

const applyAmountToRow = ({ row, payment, paymentDate, paymentReference, appliedAmount, markAsAdvance = false, datePaidOverride = null }) => {
  const applied = money(appliedAmount)
  if (applied <= 0) return 0

  row.amount_paid = money(row.amount_paid + applied)
  refreshRowBalance(row)
  const appliedDate = datePaidOverride || paymentDate
  row.date_paid = row.balance <= 0 ? appliedDate : row.date_paid || appliedDate

  pushReferenceDetail(row, {
    payment_id: payment.id,
    reference_id: paymentReference,
    applied_amount: applied,
    payment_date: appliedDate,
    payment_type: payment.payment_type || 'other',
  })

  if (row.balance <= 0) {
    row.status = markAsAdvance || isFutureDate(row.due_date, paymentDate)
      ? 'advance'
      : 'paid'
  } else {
    row.status = 'partial'
  }

  return applied
}

const isApplyExcessMaEnabled = (payment) => {
  const value = payment?.apply_excess_ma
  return value === true || value === 1 || value === '1' || String(value || '').toLowerCase() === 'true'
}

const isExcessMaUsedDetail = (detail) => {
  const type = String(detail?.payment_type || '').toLowerCase()
  return ['excess_ma', 'excess_ma_used', 'excess_ma_auto'].includes(type)
}

const getRowExcessMaUsed = (row) => {
  const details = Array.isArray(row.reference_details) ? row.reference_details : []

  return money(details.reduce((sum, detail) => (
    isExcessMaUsedDetail(detail)
      ? sum + money(detail.applied_amount)
      : sum
  ), 0))
}

const applyExcessMaCreditToRow = ({ row, payment, paymentDate, paymentReference, appliedAmount, markAsAdvance = false, datePaidOverride = null }) => {
  const applied = money(appliedAmount)
  if (applied <= 0) return 0

  row.excess_ma_used = money(money(row.excess_ma_used) + applied)
  refreshRowBalance(row)
  const appliedDate = datePaidOverride || paymentDate
  row.date_paid = row.balance <= 0 ? appliedDate : row.date_paid || appliedDate

  pushReferenceDetail(row, {
    payment_id: payment.id,
    reference_id: paymentReference,
    applied_amount: applied,
    payment_date: appliedDate,
    payment_type: payment?.payment_type === 'excess_ma_auto' ? 'excess_ma_auto' : 'excess_ma_used',
  })

  if (row.balance <= 0) {
    row.status = markAsAdvance || isFutureDate(row.due_date, appliedDate)
      ? 'advance'
      : 'paid'
  } else {
    row.status = 'partial'
  }

  return applied
}


const annotateRowsWithExcessMa = (rows) => {
  let runningExcessMa = 0

  rows.forEach((row) => {
    const generated = getExcessMaGeneratedFromRow(row)
    const used = getStoredExcessMaUsedFromRow(row)

    runningExcessMa = money(Math.max(runningExcessMa + generated - used, 0))
    row.excess_ma_generated = generated
    row.excess_ma_used = used
    row.excess_ma_balance = runningExcessMa
  })

  return rows
}


const buildExcessMaAutoReference = (row, rowIndex) => {
  const dueDate = String(toDateOnly(row?.due_date) || toDateOnly(new Date()) || '')
    .replaceAll('-', '')
  const order = String(row?.sort_order || rowIndex + 1 || 1).padStart(4, '0')
  return `EXCESS-MA-${dueDate}-${order}`
}

const applyExcessMaToCurrentMonthlyRows = ({
  rows,
  payment,
  paymentDate,
  paymentReference,
  amount,
  availableExcessMa,
  autoApply = false,
  fullRowsOnly = false,
}) => {
  let remainingPayment = money(Math.min(money(amount), money(availableExcessMa)))
  let appliedTotal = 0

  while (remainingPayment > 0) {
    const rowIndex = findNextRowIndex(rows, 'excess_ma')
    if (rowIndex === -1) break

    const row = rows[rowIndex]
    const rowBalance = money(row.balance)
    if (rowBalance <= 0) break
    if (fullRowsOnly && remainingPayment < rowBalance) break

    const effectivePaymentDate = autoApply ? row.due_date : paymentDate
    const effectivePaymentReference = autoApply
      ? buildExcessMaAutoReference(row, rowIndex)
      : paymentReference
    const effectivePayment = autoApply
      ? { ...payment, payment_type: 'excess_ma_auto' }
      : payment
    const applied = applyExcessMaCreditToRow({
      row,
      payment: effectivePayment,
      paymentDate: effectivePaymentDate,
      paymentReference: effectivePaymentReference,
      appliedAmount: Math.min(rowBalance, remainingPayment),
      markAsAdvance: false,
      datePaidOverride: effectivePaymentDate,
    })

    appliedTotal = money(appliedTotal + applied)
    remainingPayment = money(remainingPayment - applied)
  }

  return appliedTotal
}

const applyNormalPaymentToRows = ({ rows, payment, paymentDate, paymentReference, amount, availableExcessMa = 0 }) => {
  let remainingPayment = money(amount)
  let excessMaUsed = 0
  const paymentType = payment.payment_type || 'other'
  const shouldUseExcessMa = paymentType === 'monthly' && isApplyExcessMaEnabled(payment)

  while (remainingPayment > 0) {
    const rowIndex = findNextRowIndex(rows, paymentType)
    if (rowIndex === -1) break

    const row = rows[rowIndex]
    const rowBalance = money(row.balance)
    if (rowBalance <= 0) break

    const dueApplied = Math.min(rowBalance, remainingPayment)
    const isMonthly = paymentType === 'monthly'
    const appliedDate = isMonthly ? row.due_date : paymentDate
    const isFutureApplication = isMonthly ? false : isFutureDate(row.due_date, paymentDate)

    applyAmountToRow({
      row,
      payment,
      paymentDate: appliedDate,
      paymentReference,
      appliedAmount: dueApplied,
      markAsAdvance: isFutureApplication,
      datePaidOverride: appliedDate,
    })

    remainingPayment = money(remainingPayment - dueApplied)

    if (paymentType === 'monthly' && shouldUseExcessMa && row.balance > 0) {
      const excessNeeded = money(row.balance)
      const excessAvailableForThisPayment = money(Math.max(money(availableExcessMa) - excessMaUsed, 0))
      const excessToUse = Math.min(excessNeeded, excessAvailableForThisPayment)

      if (excessToUse > 0) {
        const appliedExcessMa = applyExcessMaCreditToRow({
          row,
          payment,
          paymentDate: row.due_date,
          paymentReference: buildExcessMaAutoReference(row, rowIndex),
          appliedAmount: excessToUse,
          markAsAdvance: false,
          datePaidOverride: row.due_date,
        })

        excessMaUsed = money(excessMaUsed + appliedExcessMa)
      }
    }

    if (paymentType === 'monthly' && remainingPayment > 0) {
      const excessMa = remainingPayment
      row.amount_paid = money(row.amount_paid + excessMa)
      row.advance_applied = money(row.advance_applied + excessMa)
      row.balance = 0
      row.status = 'paid'
      row.date_paid = row.due_date

      pushReferenceDetail(row, {
        payment_id: payment.id,
        reference_id: paymentReference,
        applied_amount: excessMa,
        payment_date: row.due_date,
        payment_type: 'excess_ma_saved',
      })

      remainingPayment = 0
      return {
        appliedToDue: dueApplied,
        excessMaGenerated: excessMa,
        excessMaUsed,
      }
    }

    if (paymentType === 'monthly') break
  }

  return {
    appliedToDue: money(amount - remainingPayment),
    excessMaGenerated: 0,
    excessMaUsed,
  }
}

const applyAutomaticExcessMaToMonthlyRows = ({ rows, availableExcessMa }) => {
  const autoPayment = {
    id: 0,
    payment_type: 'excess_ma_auto',
  }

  return applyExcessMaToCurrentMonthlyRows({
    rows,
    payment: autoPayment,
    paymentDate: null,
    paymentReference: null,
    amount: availableExcessMa,
    availableExcessMa,
    autoApply: true,
    fullRowsOnly: true,
  })
}

const getPrincipalPaidFromRow = (row) => {
  if (isExcessMaCreditRow(row)) return 0

  const paid = getEffectiveAmountPaid(row)
  const principalDue = money(row.principal_due)

  if (paid <= 0 || principalDue <= 0) return 0

  if (row.schedule_type === 'monthly') {
    const principalPaid = money(
      Math.max(
        paid - money(row.interest_due) - money(row.penalty_due),
        0
      )
    )

    return money(Math.min(principalPaid, principalDue))
  }

  return money(Math.min(paid, principalDue))
}

const getAppliedPrincipalTotal = (rows) => {
  return money(rows.reduce((sum, row) => sum + getPrincipalPaidFromRow(row), 0))
}

const getCurrentPrincipalBalance = (rows, totalContractPrice) => {
  return money(Math.max(money(totalContractPrice) - getAppliedPrincipalTotal(rows), 0))
}

const applyClosingPrincipalPayment = ({
  rows,
  payment,
  paymentDate,
  paymentReference,
  amount,
  availableExcessMa,
  totalContractPrice,
  description,
  scheduleType,
}) => {
  const principalBalance = getCurrentPrincipalBalance(rows, totalContractPrice)
  if (principalBalance <= 0) {
    return {
      appliedCash: 0,
      excessMaUsed: 0,
      closed: true,
    }
  }

  const cashToApply = Math.min(money(amount), principalBalance)
  const excessNeeded = money(Math.max(principalBalance - cashToApply, 0))
  const excessToUse = Math.min(money(availableExcessMa), excessNeeded)
  const totalApplied = money(cashToApply + excessToUse)

  if (totalApplied <= 0) {
    return {
      appliedCash: 0,
      excessMaUsed: 0,
      closed: false,
    }
  }

  rows.push(createPrincipalReductionRow({
    payment,
    paymentDate,
    paymentReference,
    description,
    scheduleType,
    cashAmount: cashToApply,
    excessMaAmount: excessToUse,
    totalContractPrice,
  }))

  const closed = money(principalBalance - totalApplied) <= 0
  if (closed) {
    removeRemainingUnpaidContractRows(rows)
  }

  return {
    appliedCash: cashToApply,
    excessMaUsed: excessToUse,
    closed,
  }
}

const applyPaymentsToRows = (rows, payments, totalContractPrice) => {
  let excessMaGenerated = 0
  let excessMaUsed = 0

  for (const payment of payments) {
    let remainingPayment = money(payment.amount)
    const paymentDate = toDateOnly(payment.payment_date)
    const paymentReference = payment.reference_id || payment.payment_method || `Payment #${payment.id}`
    const paymentType = payment.payment_type || 'other'

    if (isAdvancePayment(paymentType)) {
      if (remainingPayment > 0) {
        rows.push(createAdvancePaymentRow({
          payment,
          paymentDate,
          paymentReference,
          amount: remainingPayment,
          totalContractPrice,
        }))
        excessMaGenerated = money(excessMaGenerated + remainingPayment)
      }

      continue
    }

    if (isExcessMaPayment(paymentType)) {
      const availableExcessMa = money(excessMaGenerated - excessMaUsed)
      const appliedExcessMa = applyExcessMaToCurrentMonthlyRows({
        rows,
        payment,
        paymentDate,
        paymentReference,
        amount: remainingPayment,
        availableExcessMa,
      })

      excessMaUsed = money(excessMaUsed + appliedExcessMa)
      continue
    }

    if (paymentType === 'full_payment') {
      const result = applyClosingPrincipalPayment({
        rows,
        payment,
        paymentDate,
        paymentReference,
        amount: remainingPayment,
        availableExcessMa: money(excessMaGenerated - excessMaUsed),
        totalContractPrice,
        description: 'Full Payment',
        scheduleType: 'full_payment',
      })

      excessMaUsed = money(excessMaUsed + result.excessMaUsed)
      continue
    }

    if (isBalloonPayment(paymentType)) {
      const principalBalance = getCurrentPrincipalBalance(rows, totalContractPrice)
      const availableExcessMa = money(excessMaGenerated - excessMaUsed)
      const closesAccount = money(remainingPayment + availableExcessMa) >= principalBalance

      if (closesAccount) {
        const result = applyClosingPrincipalPayment({
          rows,
          payment,
          paymentDate,
          paymentReference,
          amount: remainingPayment,
          availableExcessMa,
          totalContractPrice,
          description: 'Balloon Principal Reduction',
          scheduleType: 'balloon',
        })

        excessMaUsed = money(excessMaUsed + result.excessMaUsed)
        continue
      }

      const appliedBalloonReduction = reduceFutureMonthlyRowsFromEnd(
        rows,
        remainingPayment
      )

      if (appliedBalloonReduction > 0) {
        rows.push(createPrincipalReductionRow({
          payment,
          paymentDate,
          paymentReference,
          description: 'Balloon Principal Reduction',
          scheduleType: 'balloon',
          cashAmount: appliedBalloonReduction,
          totalContractPrice,
        }))
      }

      continue
    }

    const application = applyNormalPaymentToRows({
      rows,
      payment,
      paymentDate,
      paymentReference,
      amount: remainingPayment,
      availableExcessMa: money(excessMaGenerated - excessMaUsed),
    })

    if (application.excessMaUsed > 0) {
      excessMaUsed = money(excessMaUsed + application.excessMaUsed)
    }

    if (application.excessMaGenerated > 0) {
      excessMaGenerated = money(excessMaGenerated + application.excessMaGenerated)
    }
  }

  let availableExcessMa = money(excessMaGenerated - excessMaUsed)
  const autoAppliedExcessMa = applyAutomaticExcessMaToMonthlyRows({
    rows,
    availableExcessMa,
  })

  excessMaUsed = money(excessMaUsed + autoAppliedExcessMa)
  availableExcessMa = money(excessMaGenerated - excessMaUsed)

  if (getCurrentPrincipalBalance(rows, totalContractPrice) <= 0) {
    removeRemainingUnpaidContractRows(rows)
  }

  sortRowsForStatement(rows)

  // Running balance in the SOA must show the actual outstanding balance as of
  // posted payments only. Monthly rows can still store projected
  // principal_due/interest_due for the amortization breakdown, but unpaid
  // future rows must NOT reduce the displayed running balance.
  let actualRunningBalance = money(totalContractPrice)

  for (const row of rows) {
    refreshRowBalance(row)

    const effectiveAppliedToDue = getEffectiveAmountPaid(row)

    if (effectiveAppliedToDue <= 0 && !isExcessMaCreditRow(row)) {
      row.status = isPastDate(row.due_date)
        ? 'past_due'
        : toDateOnly(row.due_date) <= toDateOnly(new Date())
          ? 'due'
          : 'not_due'
    } else if (money(row.balance) <= 0) {
      row.status = row.status === 'advance' ? 'advance' : 'paid'
    } else {
      row.status = 'partial'
    }

    const actualPrincipalPaid = getPrincipalPaidFromRow(row)

    actualRunningBalance = money(Math.max(actualRunningBalance - actualPrincipalPaid, 0))
    row.running_balance = actualRunningBalance
  }

  annotateRowsWithExcessMa(rows)

  return {
    rows,
    excessMaGenerated,
    excessMaUsed,
    excessMaAvailable: availableExcessMa,
  }
}

const replacePaymentSchedules = async (connectionOrDb, clientUnitId, rows) => {
  await connectionOrDb.query(
    `
    DELETE FROM payment_schedules
    WHERE client_unit_id = ?
      AND status <> 'waived'
      AND schedule_type <> 'penalty'
    `,
    [clientUnitId]
  )

  if (rows.length === 0) return

  await connectionOrDb.query(
    `
    INSERT INTO payment_schedules (
      client_unit_id,
      due_date,
      description,
      schedule_type,
      principal_due,
      interest_due,
      penalty_due,
      total_due,
      amount_paid,
      advance_applied,
      excess_ma_used,
      balance,
      date_paid,
      reference_no,
      reference_details,
      status,
      running_balance,
      sort_order
    ) VALUES ?
    `,
    [rows.map((row) => [
      clientUnitId,
      row.due_date,
      row.description,
      normalizeScheduleType(row.schedule_type),
      money(row.principal_due),
      money(row.interest_due),
      money(row.penalty_due),
      money(row.total_due),
      money(row.amount_paid),
      money(row.advance_applied),
      money(row.excess_ma_used),
      money(row.balance),
      row.date_paid,
      row.reference_no,
      JSON.stringify(row.reference_details || []),
      row.status,
      money(row.running_balance),
      row.sort_order,
    ])]
  )
}

export const rebuildPaymentSchedule = async (connectionOrDb, clientUnitId) => {
  const unit = await getClientUnitPlan(connectionOrDb, clientUnitId)
  if (!unit) return null

  const totalContractPrice = firstPositive(
    unit.offer_purchase_price,
    unit.listing_total_contract_price,
    unit.net_selling_price
  )
  const payments = await getVerifiedPayments(connectionOrDb, clientUnitId)
  const baseRows = buildBaseRows(unit)
  const scheduleApplication = applyPaymentsToRows(baseRows, payments, totalContractPrice)
  const rows = scheduleApplication.rows

  await replacePaymentSchedules(connectionOrDb, clientUnitId, rows)

  const totalPaid = money(
    payments.reduce((sum, payment) => (
      isExcessMaPayment(payment.payment_type)
        ? sum
        : sum + Number(payment.amount || 0)
    ), 0)
  )
  const displayRows = getDisplayScheduleRows(rows)
  const statementTotal = money(
    displayRows.reduce((sum, row) => sum + money(row.total_due), 0)
  )
  const statementBalance = money(
    displayRows.reduce((sum, row) => sum + money(row.balance), 0)
  )
  const principalBalance = getCurrentPrincipalBalance(rows, totalContractPrice)

  return {
    client_unit_id: Number(clientUnitId),
    total_contract_price: totalContractPrice,
    total_statement_due: statementTotal,
    total_paid: totalPaid,
    balance: statementBalance,
    statement_balance: statementBalance,
    principal_balance: principalBalance,
    rows: displayRows,
    excess_ma_generated: scheduleApplication.excessMaGenerated,
    excess_ma_used: scheduleApplication.excessMaUsed,
    excess_ma_available: scheduleApplication.excessMaAvailable,
  }
}

export const getPaymentScheduleRows = async (connectionOrDb, clientUnitId) => {
  const [rows] = await connectionOrDb.query(
    `
    SELECT
      id,
      client_unit_id,
      DATE_FORMAT(due_date, '%Y-%m-%d') AS due_date,
      description,
      schedule_type,
      principal_due,
      interest_due,
      penalty_due,
      total_due,
      amount_paid,
      advance_applied,
      excess_ma_used,
      balance,
      DATE_FORMAT(date_paid, '%Y-%m-%d') AS date_paid,
      reference_no,
      reference_details,
      status,
      running_balance,
      sort_order
    FROM payment_schedules
    WHERE client_unit_id = ?
    ORDER BY sort_order ASC, due_date ASC, id ASC
    `,
    [clientUnitId]
  )

  const parsedRows = rows.map((row) => ({
    ...row,
    reference_details: (() => {
      if (!row.reference_details) return []
      try {
        return JSON.parse(row.reference_details)
      } catch {
        return []
      }
    })(),
  }))

  const annotatedRows = annotateRowsWithExcessMa(parsedRows)
  return getDisplayScheduleRows(annotatedRows)
}

export const rebuildAndGetPaymentScheduleRows = async (connectionOrDb, clientUnitId) => {
  await rebuildPaymentSchedule(connectionOrDb, clientUnitId)
  return getPaymentScheduleRows(connectionOrDb, clientUnitId)
}

export const getNextPaymentScheduleDue = async (connectionOrDb, clientUnitId) => {
  const scheduleSummary = await rebuildPaymentSchedule(connectionOrDb, clientUnitId)
  const rows = await getPaymentScheduleRows(connectionOrDb, clientUnitId)
  const nextRow = rows.find((row) => money(row.balance) > 0)
  const totalBalance = money(rows.reduce((sum, row) => sum + Number(row.balance || 0), 0))

  return {
    nextRow: nextRow || null,
    totalBalance,
    principalBalance: money(scheduleSummary?.principal_balance || 0),
    statementBalance: money(scheduleSummary?.statement_balance ?? totalBalance),
    rows,
    excessMaGenerated: scheduleSummary?.excess_ma_generated || 0,
    excessMaUsed: scheduleSummary?.excess_ma_used || 0,
    excessMaAvailable: scheduleSummary?.excess_ma_available || 0,
  }
}

export const mapScheduleRowForPrint = (row) => ({
  due_date: row.due_date,
  description: row.description,
  schedule_type: row.schedule_type,
  principal_due: row.principal_due,
  interest_due: row.interest_due,
  due_amount: row.total_due,
  penalty: row.penalty_due,
  balance: row.balance,
  date_paid: row.date_paid,
  amount_paid: row.amount_paid,
  excess_ma: row.excess_ma_generated ?? row.advance_applied,
  excess_ma_generated: row.excess_ma_generated ?? row.advance_applied,
  excess_ma_used: getStoredExcessMaUsedFromRow(row),
  excess_ma_balance: row.excess_ma_balance ?? 0,
  excess_used: row.excess_ma_used ?? getRowExcessMaUsed(row),
  reference: row.reference_no,
  reference_details: row.reference_details || [],
  running_balance: row.running_balance,
  status: row.status,
})
