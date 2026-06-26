const money = (value) => Number(Number(value || 0).toFixed(2))

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

const getClientUnitPlan = async (connectionOrDb, clientUnitId) => {
  const [rows] = await connectionOrDb.query(
    `
    SELECT
      cu.*,
      l.unit_id,
      l.reservation_fee AS listing_reservation_fee,
      l.net_selling_price,
      l.legal_misc_fee,
      l.total_contract_price AS listing_total_contract_price
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

const buildBaseRows = (unit) => {
  const totalContractPrice = firstPositive(
    unit.offer_purchase_price,
    unit.listing_total_contract_price,
    unit.net_selling_price
  )
  const reservationFee = firstPositive(
    unit.reservation_fee_amount,
    unit.listing_reservation_fee
  )
  const downpaymentNet = firstPositive(
    unit.downpayment_net_amount,
    unit.downpayment_amount
  )
  const downpaymentGives = Math.max(Number(unit.downpayment_gives || 0), 1)
  const deferredCashAmount = money(unit.deferred_cash_amount)
  const terms = Math.max(Number(unit.payment_terms_months || 0), 0)
  const monthlyAmortization = money(unit.monthly_amortization)
  const startingDate = toDateOnly(unit.starting_date) || toDateOnly(unit.created_at) || toDateOnly(new Date())
  const firstDueDate = toDateOnly(unit.due_date) || startingDate
  const rows = []

  const pushRow = ({ dueDate, description, scheduleType, totalDue, sortOrder }) => {
    const due = money(totalDue)
    if (due <= 0) return

    rows.push({
      due_date: toDateOnly(dueDate),
      description,
      schedule_type: scheduleType,
      principal_due: due,
      interest_due: 0,
      penalty_due: 0,
      total_due: due,
      amount_paid: 0,
      advance_applied: 0,
      balance: due,
      date_paid: null,
      reference_no: null,
      reference_details: [],
      status: 'not_due',
      running_balance: totalContractPrice,
      sort_order: sortOrder,
    })
  }

  let sortOrder = 1
  pushRow({
    dueDate: startingDate,
    description: 'Reservation Fee',
    scheduleType: 'reservation',
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
      totalDue: cashBalance,
      sortOrder: sortOrder++,
    })

    return rows
  }

  if (downpaymentNet > 0) {
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
        totalDue: amount,
        sortOrder: sortOrder++,
      })

      remainingDownpayment = money(remainingDownpayment - amount)
    }
  }

  const monthlyStart = addMonths(firstDueDate, downpaymentNet > 0 ? downpaymentGives : 0)
  const monthlyBase = monthlyAmortization > 0
    ? monthlyAmortization
    : terms > 0
      ? money((totalContractPrice - reservationFee - downpaymentNet - deferredCashAmount) / terms)
      : 0
  let remainingMonthlyTotal = money(
    totalContractPrice - reservationFee - downpaymentNet - deferredCashAmount
  )

  for (let index = 1; index <= terms; index += 1) {
    if (remainingMonthlyTotal <= 0) break

    const amount = index === terms
      ? remainingMonthlyTotal
      : Math.min(monthlyBase, remainingMonthlyTotal)

    pushRow({
      dueDate: addMonths(monthlyStart, index - 1),
      description: `${ordinal(index)} Monthly Payment`,
      scheduleType: 'monthly',
      totalDue: amount,
      sortOrder: sortOrder++,
    })

    remainingMonthlyTotal = money(remainingMonthlyTotal - amount)
  }

  return rows
}

const preferredScheduleTypes = (paymentType) => {
  switch (paymentType) {
    case 'reservation':
    case 'reservation_fee':
      return ['reservation', 'downpayment', 'monthly', 'full_payment']
    case 'downpayment':
      return ['downpayment', 'monthly', 'full_payment']
    case 'monthly':
      return ['monthly', 'downpayment', 'full_payment']
    case 'balloon':
      return ['monthly', 'full_payment']
    case 'full_payment':
      return ['reservation', 'downpayment', 'monthly', 'full_payment']
    case 'other':
    default:
      return ['reservation', 'downpayment', 'monthly', 'full_payment']
  }
}

const findNextRowIndex = (rows, paymentType) => {
  if (paymentType === 'balloon') {
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

const applyPaymentsToRows = (rows, payments, totalContractPrice) => {
  for (const payment of payments) {
    let remainingPayment = money(payment.amount)
    const paymentDate = toDateOnly(payment.payment_date)
    const paymentReference = payment.reference_id || payment.payment_method || `Payment #${payment.id}`
    const paymentType = payment.payment_type || 'other'
    const firstTargetRowIndex = findNextRowIndex(rows, paymentType)
    let alreadyAppliedToFirstRow = false

    while (remainingPayment > 0) {
      const rowIndex = findNextRowIndex(rows, paymentType)
      if (rowIndex === -1) break

      const row = rows[rowIndex]
      const rowBalance = money(row.balance)
      if (rowBalance <= 0) break

      const applied = Math.min(rowBalance, remainingPayment)
      const isOffsetApplication = alreadyAppliedToFirstRow || rowIndex !== firstTargetRowIndex
      const isAdvanceApplication = !isOffsetApplication && isFutureDate(row.due_date, paymentDate)

      row.amount_paid = money(row.amount_paid + applied)

      if (isOffsetApplication) {
        row.advance_applied = money(row.advance_applied + applied)
      }

      row.balance = money(row.total_due - row.amount_paid)
      row.date_paid = row.balance <= 0 ? paymentDate : row.date_paid || paymentDate
      pushReferenceDetail(row, {
        payment_id: payment.id,
        reference_id: paymentReference,
        applied_amount: applied,
        payment_date: paymentDate,
        payment_type: paymentType,
      })

      remainingPayment = money(remainingPayment - applied)
      alreadyAppliedToFirstRow = true

      if (row.balance <= 0) {
        if (isOffsetApplication) {
          row.status = 'offset'
        } else if (isAdvanceApplication) {
          row.status = 'advance'
        } else {
          row.status = 'paid'
        }
      } else {
        row.status = isOffsetApplication ? 'offset' : 'partial'
      }
    }
  }

  let runningBalance = totalContractPrice

  for (const row of rows) {
    if (money(row.amount_paid) <= 0) {
      row.status = isPastDate(row.due_date)
        ? 'past_due'
        : toDateOnly(row.due_date) <= toDateOnly(new Date())
          ? 'due'
          : 'not_due'
    } else if (money(row.balance) <= 0) {
      row.status = ['advance', 'offset'].includes(row.status) ? row.status : 'paid'
    } else if (money(row.advance_applied) > 0) {
      row.status = 'offset'
    } else {
      row.status = 'partial'
    }

    runningBalance = money(Math.max(runningBalance - money(row.amount_paid), 0))
    row.running_balance = runningBalance
  }

  return rows
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
      row.schedule_type,
      row.principal_due,
      row.interest_due,
      row.penalty_due,
      row.total_due,
      row.amount_paid,
      row.advance_applied,
      row.balance,
      row.date_paid,
      row.reference_no,
      JSON.stringify(row.reference_details || []),
      row.status,
      row.running_balance,
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
  const rows = applyPaymentsToRows(baseRows, payments, totalContractPrice)

  await replacePaymentSchedules(connectionOrDb, clientUnitId, rows)

  return {
    client_unit_id: Number(clientUnitId),
    total_contract_price: totalContractPrice,
    total_paid: money(payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0)),
    balance: money(Math.max(totalContractPrice - payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0), 0)),
    rows,
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

  return rows.map((row) => ({
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
}

export const rebuildAndGetPaymentScheduleRows = async (connectionOrDb, clientUnitId) => {
  await rebuildPaymentSchedule(connectionOrDb, clientUnitId)
  return getPaymentScheduleRows(connectionOrDb, clientUnitId)
}

export const getNextPaymentScheduleDue = async (connectionOrDb, clientUnitId) => {
  const rows = await rebuildAndGetPaymentScheduleRows(connectionOrDb, clientUnitId)
  const nextRow = rows.find((row) => money(row.balance) > 0)
  const totalBalance = money(rows.reduce((sum, row) => sum + Number(row.balance || 0), 0))

  return {
    nextRow: nextRow || null,
    totalBalance,
    rows,
  }
}

export const mapScheduleRowForPrint = (row) => ({
  due_date: row.due_date,
  description: row.description,
  schedule_type: row.schedule_type,
  due_amount: row.total_due,
  penalty: row.penalty_due,
  date_paid: row.date_paid,
  amount_paid: row.amount_paid,
  excess_used: row.advance_applied,
  reference: row.reference_no,
  reference_details: row.reference_details || [],
  running_balance: row.running_balance,
  status: row.status,
})


