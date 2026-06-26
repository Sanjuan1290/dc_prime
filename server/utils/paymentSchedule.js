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
  const amortizedPrincipal = money(
    Math.max(
      totalContractPrice -
        reservationFee -
        downpaymentNet -
        deferredCashAmount -
        money(unit.balloon_payment_amount),
      0
    )
  )
  const monthlyBase = monthlyAmortization > 0
    ? monthlyAmortization
    : terms > 0
      ? money(amortizedPrincipal / terms)
      : 0

  // Interest-bearing amortization must generate the contracted number of
  // monthly rows. Do not cap the rows at the remaining principal/TCP, because
  // monthly amortization already includes interest.
  for (let index = 1; index <= terms; index += 1) {
    pushRow({
      dueDate: addMonths(monthlyStart, index - 1),
      description: `${ordinal(index)} Monthly Payment`,
      scheduleType: 'monthly',
      totalDue: monthlyBase,
      sortOrder: sortOrder++,
    })
  }

  const scheduledBalloonAmount = money(unit.balloon_payment_amount)

  if (scheduledBalloonAmount > 0) {
    pushRow({
      dueDate: addMonths(monthlyStart, terms),
      description: 'Balloon Payment',
      scheduleType: 'balloon',
      totalDue: scheduledBalloonAmount,
      sortOrder: sortOrder++,
    })
  }

  return rows
}

const isExcessMaPayment = (paymentType) => {
  return String(paymentType || '').toLowerCase() === 'excess_ma'
}

const isBalloonPayment = (paymentType) => {
  return String(paymentType || '').toLowerCase() === 'balloon'
}

const getEffectiveAmountPaid = (row) => {
  return money(Math.max(money(row.amount_paid) - money(row.advance_applied), 0))
}

const refreshRowBalance = (row) => {
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
    case 'excess_ma':
      return ['monthly']
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

const createBalloonReductionRow = ({ payment, paymentDate, paymentReference, appliedAmount, totalContractPrice }) => ({
  due_date: paymentDate,
  description: 'Balloon Principal Reduction',
  schedule_type: 'balloon',
  principal_due: money(appliedAmount),
  interest_due: 0,
  penalty_due: 0,
  total_due: money(appliedAmount),
  amount_paid: money(appliedAmount),
  advance_applied: 0,
  balance: 0,
  date_paid: paymentDate,
  reference_no: null,
  reference_details: [
    {
      payment_id: Number(payment.id),
      reference_id: paymentReference,
      applied_amount: money(appliedAmount),
      payment_date: paymentDate,
      payment_type: payment.payment_type || 'balloon',
    },
  ],
  status: 'paid',
  running_balance: totalContractPrice,
  sort_order: 999999,
})

const createExcessMaReductionRow = ({ appliedAmount, totalContractPrice, paymentDate }) => ({
  due_date: paymentDate || toDateOnly(new Date()),
  description: 'Excess MA Principal Reduction',
  schedule_type: 'excess_ma',
  principal_due: money(appliedAmount),
  interest_due: 0,
  penalty_due: 0,
  total_due: money(appliedAmount),
  amount_paid: money(appliedAmount),
  advance_applied: 0,
  balance: 0,
  date_paid: paymentDate || toDateOnly(new Date()),
  reference_no: 'EXCESS-MA-AUTO',
  reference_details: [
    {
      payment_id: 0,
      reference_id: 'EXCESS-MA-AUTO',
      applied_amount: money(appliedAmount),
      payment_date: paymentDate || toDateOnly(new Date()),
      payment_type: 'excess_ma_auto',
    },
  ],
  status: 'paid',
  running_balance: totalContractPrice,
  sort_order: 999999,
})

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

const applyAmountToRow = ({ row, payment, paymentDate, paymentReference, appliedAmount, markAsAdvance = false }) => {
  const applied = money(appliedAmount)
  if (applied <= 0) return 0

  row.amount_paid = money(row.amount_paid + applied)
  refreshRowBalance(row)
  row.date_paid = row.balance <= 0 ? paymentDate : row.date_paid || paymentDate

  pushReferenceDetail(row, {
    payment_id: payment.id,
    reference_id: paymentReference,
    applied_amount: applied,
    payment_date: paymentDate,
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

const applyExcessMaCreditToRow = ({ row, payment, paymentDate, paymentReference, appliedAmount, markAsAdvance = false }) => {
  const applied = money(appliedAmount)
  if (applied <= 0) return 0

  row.amount_paid = money(row.amount_paid + applied)
  refreshRowBalance(row)
  row.date_paid = row.balance <= 0 ? paymentDate : row.date_paid || paymentDate

  pushReferenceDetail(row, {
    payment_id: payment.id,
    reference_id: paymentReference,
    applied_amount: applied,
    payment_date: paymentDate,
    payment_type: 'excess_ma_used',
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

const annotateRowsWithExcessMa = (rows) => {
  let runningExcessMa = 0

  rows.forEach((row) => {
    const generated = money(row.advance_applied)
    const used = getRowExcessMaUsed(row)

    runningExcessMa = money(Math.max(runningExcessMa + generated - used, 0))
    row.excess_ma_generated = generated
    row.excess_ma_used = used
    row.excess_ma_balance = runningExcessMa
  })

  return rows
}

const applyExcessMaToCurrentMonthlyRows = ({ rows, payment, paymentDate, paymentReference, amount, availableExcessMa }) => {
  let remainingPayment = money(Math.min(money(amount), money(availableExcessMa)))
  let appliedTotal = 0

  while (remainingPayment > 0) {
    const rowIndex = findNextRowIndex(rows, 'excess_ma')
    if (rowIndex === -1) break

    const row = rows[rowIndex]
    const rowBalance = money(row.balance)
    if (rowBalance <= 0) break

    const applied = applyExcessMaCreditToRow({
      row,
      payment,
      paymentDate,
      paymentReference,
      appliedAmount: Math.min(rowBalance, remainingPayment),
      markAsAdvance: isFutureDate(row.due_date, paymentDate),
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
    const isFutureApplication = isFutureDate(row.due_date, paymentDate)

    applyAmountToRow({
      row,
      payment,
      paymentDate,
      paymentReference,
      appliedAmount: dueApplied,
      markAsAdvance: isFutureApplication,
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
          paymentDate,
          paymentReference,
          appliedAmount: excessToUse,
          markAsAdvance: isFutureApplication,
        })

        excessMaUsed = money(excessMaUsed + appliedExcessMa)
      }
    }

    if (paymentType === 'monthly' && remainingPayment > 0) {
      const excessMa = remainingPayment
      row.amount_paid = money(row.amount_paid + excessMa)
      row.advance_applied = money(row.advance_applied + excessMa)
      row.balance = 0
      row.status = isFutureApplication ? 'advance' : 'paid'

      pushReferenceDetail(row, {
        payment_id: payment.id,
        reference_id: paymentReference,
        applied_amount: excessMa,
        payment_date: paymentDate,
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

const applyAutomaticExcessMaFromEnd = ({ rows, availableExcessMa, totalContractPrice, paymentDate }) => {
  const appliedExcessMa = reduceFutureMonthlyRowsFromEnd(
    rows,
    availableExcessMa,
    { fullRowsOnly: true }
  )

  if (appliedExcessMa > 0) {
    rows.push(
      createExcessMaReductionRow({
        appliedAmount: appliedExcessMa,
        totalContractPrice,
        paymentDate,
      })
    )
  }

  return appliedExcessMa
}

const applyPaymentsToRows = (rows, payments, totalContractPrice) => {
  let excessMaGenerated = 0
  let excessMaUsed = 0
  let latestExcessMaDate = null

  for (const payment of payments) {
    let remainingPayment = money(payment.amount)
    const paymentDate = toDateOnly(payment.payment_date)
    const paymentReference = payment.reference_id || payment.payment_method || `Payment #${payment.id}`
    const paymentType = payment.payment_type || 'other'

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

    if (isBalloonPayment(paymentType)) {
      const appliedBalloonReduction = reduceFutureMonthlyRowsFromEnd(
        rows,
        remainingPayment
      )

      if (appliedBalloonReduction > 0) {
        rows.push(
          createBalloonReductionRow({
            payment,
            paymentDate,
            paymentReference,
            appliedAmount: appliedBalloonReduction,
            totalContractPrice,
          })
        )

        remainingPayment = money(remainingPayment - appliedBalloonReduction)
      }

      if (remainingPayment <= 0) continue
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
      latestExcessMaDate = paymentDate || latestExcessMaDate
    }
  }

  let availableExcessMa = money(excessMaGenerated - excessMaUsed)
  const autoAppliedExcessMa = applyAutomaticExcessMaFromEnd({
    rows,
    availableExcessMa,
    totalContractPrice,
    paymentDate: latestExcessMaDate || toDateOnly(new Date()),
  })

  excessMaUsed = money(excessMaUsed + autoAppliedExcessMa)
  availableExcessMa = money(excessMaGenerated - excessMaUsed)

  sortRowsForStatement(rows)

  let runningBalance = totalContractPrice

  for (const row of rows) {
    refreshRowBalance(row)

    if (money(row.amount_paid) <= 0) {
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

    const principalApplied = row.schedule_type === 'monthly'
      ? getEffectiveAmountPaid(row)
      : money(row.amount_paid)

    runningBalance = money(Math.max(runningBalance - principalApplied, 0))
    row.running_balance = runningBalance
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
  const statementTotal = money(
    rows.reduce((sum, row) => sum + money(row.total_due), 0)
  )
  const statementBalance = money(
    rows.reduce((sum, row) => sum + money(row.balance), 0)
  )
  const lastRunningBalanceRow = [...rows]
    .reverse()
    .find((row) => row.running_balance !== undefined && row.running_balance !== null)
  const principalBalance = money(
    lastRunningBalanceRow
      ? lastRunningBalanceRow.running_balance
      : Math.max(totalContractPrice - totalPaid, 0)
  )

  return {
    client_unit_id: Number(clientUnitId),
    total_contract_price: totalContractPrice,
    total_statement_due: statementTotal,
    total_paid: totalPaid,
    balance: statementBalance,
    statement_balance: statementBalance,
    principal_balance: principalBalance,
    rows,
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

  return annotateRowsWithExcessMa(parsedRows)
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
  due_amount: row.total_due,
  penalty: row.penalty_due,
  date_paid: row.date_paid,
  amount_paid: row.amount_paid,
  excess_ma: row.excess_ma_generated ?? row.advance_applied,
  excess_ma_generated: row.excess_ma_generated ?? row.advance_applied,
  excess_ma_used: row.excess_ma_used ?? getRowExcessMaUsed(row),
  excess_ma_balance: row.excess_ma_balance ?? 0,
  excess_used: row.excess_ma_used ?? getRowExcessMaUsed(row),
  reference: row.reference_no,
  reference_details: row.reference_details || [],
  running_balance: row.running_balance,
  status: row.status,
})


