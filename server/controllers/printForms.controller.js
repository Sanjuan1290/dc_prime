import { db } from '../db/connect.js'
import { safeCreateAuditLog } from '../utils/createAuditLog.js'
import { getClientIp } from '../utils/getClientIp.js'
import { rebuildPaymentSchedule, getPaymentScheduleRows, mapScheduleRowForPrint } from '../utils/paymentSchedule.js'

const toNumber = (value) => Number(value || 0)

const normalizeMoney = (value) => Number(Number(value || 0).toFixed(2))

const getUnitContractPrice = (unit = {}) => {
  const listingTcp = normalizeMoney(unit.total_contract_price)
  if (listingTcp > 0) return listingTcp

  const netSellingPrice = normalizeMoney(unit.net_selling_price)
  const legalMiscFee = normalizeMoney(unit.legal_misc_fee)
  if (netSellingPrice > 0 || legalMiscFee > 0) {
    return normalizeMoney(netSellingPrice + legalMiscFee)
  }

  return normalizeMoney(unit.offer_purchase_price)
}

const addMonths = (date, months) => {
  const next = new Date(date)
  next.setMonth(next.getMonth() + months)
  return next
}

const formatDateOnly = (date) => {
  if (!date) return null
  if (typeof date === 'string') {
    const matchedDate = date.trim().match(/^(\d{4}-\d{2}-\d{2})/)
    if (matchedDate) return matchedDate[1]
  }

  const parsed = date instanceof Date ? date : new Date(date)
  if (Number.isNaN(parsed.getTime())) return null

  const year = parsed.getFullYear()
  const month = String(parsed.getMonth() + 1).padStart(2, '0')
  const day = String(parsed.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
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

const fetchPrintData = async (clientUnitId) => {
  const [unitRows] = await db.query(
    `
    SELECT
      cu.*,
      c.full_name AS client_name,
      c.spouse_co_owner_name,
      COALESCE(cu.buyer_type, c.buyer_type) AS buyer_type,
      c.birth_date,
      c.place_of_birth,
      c.citizenship,
      c.gender,
      c.civil_status,
      c.email AS client_email,
      c.contact_no AS client_contact_no,
      c.residence_phone_no,
      c.tin AS client_tin,
      c.address AS client_address,
      c.present_address,
      c.present_zip_code,
      c.permanent_address,
      c.permanent_zip_code,
      c.region,
      c.profile_status,
      l.unit_id,
      l.cadastral_lot_no,
      l.lot_type,
      l.lot_area_sqm,
      l.price_per_sqm,
      l.net_selling_price,
      l.legal_misc_rate,
      l.legal_misc_fee,
      l.total_contract_price,
      l.reservation_fee AS listing_reservation_fee,
      p.id AS project_id,
      p.name AS project_name,
      p.location AS project_location,
      p.location_code,
      p.administrator,
      p.tax_declaration_no,
      p.pin,
      seller.full_name AS seller_name,
      seller.email AS seller_email,
      seller.contact_no AS seller_contact_no,
      seller.seller_role,
      seller.commission_rate AS seller_commission_rate
    FROM client_units cu
    INNER JOIN clients c ON c.id = cu.client_id
    INNER JOIN listings l ON l.id = cu.listing_id
    INNER JOIN projects p ON p.id = l.project_id
    LEFT JOIN accredited_sellers seller ON seller.id = cu.seller_id
    WHERE cu.id = ?
    LIMIT 1
    `,
    [clientUnitId]
  )

  const unit = unitRows[0]

  if (!unit) return null

  const [coBuyers] = await db.query(
    `
    SELECT *
    FROM client_buyers
    WHERE client_unit_id = ?
       OR (
        client_id = ?
        AND client_unit_id IS NULL
        AND NOT EXISTS (
          SELECT 1
          FROM client_buyers scoped_buyers
          WHERE scoped_buyers.client_unit_id = ?
        )
      )
    ORDER BY client_unit_id DESC, id ASC
    `,
    [clientUnitId, unit.client_id, clientUnitId]
  )

  const [employmentDetails] = await db.query(
    `
    SELECT ced.*
    FROM client_employment_details ced
    LEFT JOIN client_buyers cb ON cb.id = ced.client_buyer_id
    WHERE ced.client_id = ?
      AND (
        ced.person_type = 'principal'
        OR cb.client_unit_id = ?
        OR (
          ced.person_type = 'co_buyer'
          AND cb.client_unit_id IS NULL
          AND NOT EXISTS (
            SELECT 1
            FROM client_buyers scoped_buyers
            WHERE scoped_buyers.client_unit_id = ?
          )
        )
      )
    ORDER BY
      FIELD(ced.person_type, 'principal', 'co_buyer'),
      CASE WHEN cb.client_unit_id = ? THEN 0 ELSE 1 END,
      ced.id ASC
    `,
    [unit.client_id, clientUnitId, clientUnitId, clientUnitId]
  )

  const [payments] = await db.query(
    `
    SELECT
      id,
      amount,
      payment_type,
      payment_method,
      reference_id,
      DATE_FORMAT(payment_date, '%Y-%m-%d') AS payment_date,
      status,
      verified_at,
      created_at
    FROM payments
    WHERE client_unit_id = ?
      AND status = 'verified'
    ORDER BY payment_date ASC, id ASC
    `,
    [clientUnitId]
  )

  return {
    unit,
    coBuyers,
    employmentDetails,
    payments,
  }
}

const buildSchedule = ({ unit, payments }) => {
  const totalAmountPayable = normalizeMoney(
    getUnitContractPrice(unit)
  )
  const reservationFee = normalizeMoney(
    unit.reservation_fee_amount || unit.listing_reservation_fee
  )
  const downpayment = normalizeMoney(
    unit.downpayment_net_amount || unit.downpayment_amount
  )
  const downpaymentGives = Math.max(Number(unit.downpayment_gives || 3), 1)
  const deferredCash = normalizeMoney(unit.deferred_cash_amount)
  const terms = Number(unit.payment_terms_months || 0)
  const monthly = normalizeMoney(unit.monthly_amortization)
  const startingDate = unit.starting_date || unit.created_at
  const firstDueDate = unit.due_date || unit.starting_date || unit.created_at
  const rows = []

  const pushRow = (dueDate, description, dueAmount, scheduleType = 'fixed') => {
    if (normalizeMoney(dueAmount) <= 0) return

    rows.push({
      due_date: formatDateOnly(dueDate),
      description,
      schedule_type: scheduleType,
      due_amount: normalizeMoney(dueAmount),
      penalty: 0,
      date_paid: null,
      amount_paid: null,
      reference: null,
      running_balance: totalAmountPayable,
    })
  }

  pushRow(startingDate, 'Reservation Fee', reservationFee, 'reservation_fee')

  if (unit.mode_of_payment === 'cash') {
    pushRow(
      firstDueDate,
      'Deferred Cash',
      deferredCash || Math.max(totalAmountPayable - reservationFee, 0),
      'cash'
    )
  } else {
    if (downpayment > 0) {
      const perDownpayment = normalizeMoney(downpayment / downpaymentGives)
      const first = new Date(firstDueDate)

      for (let index = 1; index <= downpaymentGives; index += 1) {
        const dueDate = addMonths(first, index - 1)
        const isLast = index === downpaymentGives
        const amount = isLast
          ? normalizeMoney(downpayment - perDownpayment * (downpaymentGives - 1))
          : perDownpayment

        pushRow(dueDate, `${ordinal(index)} Downpayment`, amount, 'downpayment')
      }
    }

    const monthlyStart = addMonths(
      new Date(firstDueDate),
      downpayment > 0 ? downpaymentGives : 0
    )
    const monthlyCount = Math.max(terms, 0)
    let remainingMonthlyTotal = normalizeMoney(
      totalAmountPayable - reservationFee - downpayment - deferredCash
    )

    for (let index = 1; index <= monthlyCount; index += 1) {
      const dueDate = addMonths(monthlyStart, index - 1)
      const amount = index === monthlyCount
        ? normalizeMoney(remainingMonthlyTotal)
        : monthly

      pushRow(dueDate, `${ordinal(index)} Monthly Payment`, amount, 'monthly')
      remainingMonthlyTotal = normalizeMoney(remainingMonthlyTotal - amount)
    }
  }

  const verifiedPayments = [...payments]
  let cumulativePaid = 0

  const adjustFutureMonthlyRows = (currentIndex, runningBalance) => {
    const futureRows = rows.slice(currentIndex + 1)
    const fixedFutureAmount = futureRows
      .filter((row) => row.schedule_type !== 'monthly')
      .reduce((sum, row) => normalizeMoney(sum + normalizeMoney(row.due_amount)), 0)
    const futureMonthlyRows = futureRows.filter(
      (row) => row.schedule_type === 'monthly'
    )

    if (futureMonthlyRows.length === 0) return

    const monthlyPool = normalizeMoney(Math.max(runningBalance - fixedFutureAmount, 0))
    const monthlyBase = normalizeMoney(monthlyPool / futureMonthlyRows.length)
    let remainingMonthlyPool = monthlyPool

    futureMonthlyRows.forEach((row, index) => {
      const amount = index === futureMonthlyRows.length - 1
        ? normalizeMoney(remainingMonthlyPool)
        : monthlyBase

      row.due_amount = amount
      remainingMonthlyPool = normalizeMoney(remainingMonthlyPool - amount)
    })
  }

  rows.forEach((row, index) => {
    const payment = verifiedPayments.shift()

    if (payment) {
      cumulativePaid = normalizeMoney(cumulativePaid + toNumber(payment.amount))
      row.date_paid = formatDateOnly(payment.payment_date)
      row.amount_paid = normalizeMoney(payment.amount)
      row.reference = payment.reference_id || payment.payment_method || payment.payment_type || `Payment #${payment.id}`
    }

    row.running_balance = normalizeMoney(Math.max(totalAmountPayable - cumulativePaid, 0))

    if (payment && normalizeMoney(payment.amount) > normalizeMoney(row.due_amount)) {
      adjustFutureMonthlyRows(index, row.running_balance)
    }
  })

  return rows.map(({ schedule_type, ...row }) => row)
}

export const getClientUnitPrintData = async (req, res) => {
  const { clientUnitId } = req.params
  const printData = await fetchPrintData(clientUnitId)

  if (!printData) {
    return res.status(404).json({ message: 'Client unit not found' })
  }

  const scheduleSummary = await rebuildPaymentSchedule(db, clientUnitId)
  const scheduleRows = await getPaymentScheduleRows(db, clientUnitId)
  const schedule = scheduleRows.map(mapScheduleRowForPrint)
  const totalPaid = normalizeMoney(
    printData.payments.reduce((sum, payment) => (
      payment.payment_type === 'excess_ma'
        ? sum
        : sum + toNumber(payment.amount)
    ), 0)
  )
  const totalAmountPayable = normalizeMoney(
    getUnitContractPrice(printData.unit)
  )
  const statementBalance = normalizeMoney(
    Math.max(
      toNumber(scheduleSummary?.principal_balance) - toNumber(scheduleSummary?.excess_ma_available),
      0
    )
  )
  const statementTotal = normalizeMoney(
    scheduleRows.reduce((sum, row) => sum + toNumber(row.total_due), 0)
  )

  res.status(200).json({
    message: 'Print data fetched successfully',
    data: {
      ...printData,
      schedule,
      totals: {
        total_amount_payable: totalAmountPayable,
        total_statement_due: statementTotal,
        total_paid: totalPaid,
        balance: statementBalance,
      },
      statement_date: formatDateOnly(new Date()),
    },
  })
}

export const logClientUnitFormPrint = async (req, res) => {
  const { clientUnitId } = req.params
  const { form_type = 'offer_to_buy_buyers_profile', notes = null } = req.body

  const allowedFormTypes = [
    'offer_to_buy_buyers_profile',
    'statement_of_account',
  ]

  if (!allowedFormTypes.includes(form_type)) {
    return res.status(400).json({ message: 'Invalid form type' })
  }

  const [unitRows] = await db.query(
    `SELECT id FROM client_units WHERE id = ? LIMIT 1`,
    [clientUnitId]
  )

  if (unitRows.length === 0) {
    return res.status(404).json({ message: 'Client unit not found' })
  }

  const [result] = await db.query(
    `
    INSERT INTO client_unit_form_prints (
      client_unit_id,
      form_type,
      printed_by,
      notes
    ) VALUES (?, ?, ?, ?)
    `,
    [clientUnitId, form_type, req.user?.id || null, notes]
  )

  await safeCreateAuditLog({
    userId: req.user?.id || null,
    action: 'print',
    module: 'Client Forms',
    description: `Printed ${form_type} for client unit ${clientUnitId}`,
    ipAddress: getClientIp(req),
  })

  res.status(201).json({
    message: 'Print logged successfully',
    data: {
      id: result.insertId,
    },
  })
}
