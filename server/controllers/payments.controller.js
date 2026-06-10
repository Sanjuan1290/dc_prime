import { db } from '../db/connect.js'
import { createAuditLog } from '../utils/createAuditLog.js'
import { getClientIp } from '../utils/getClientIp.js'
import { refreshCommissionEligibility } from './commissions.controller.js'

const allowedPaymentStatuses = ['pending', 'verified', 'rejected']

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

const validatePaymentStatus = (status) => {
  if (isMissing(status)) return 'pending'
  if (!allowedPaymentStatuses.includes(status)) return null
  return status
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
  py.payment_method,
  py.payment_date,
  py.status,
  py.verified_by,
  verifier.full_name AS verified_by_name,
  py.verified_at,
  py.created_at,
  py.updated_at
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

const recomputeClientUnitBalance = async (connectionOrDb, clientUnitId) => {
  const [clientUnitRows] = await connectionOrDb.query(
    `
    SELECT
      cu.id,
      cu.status,
      l.reservation_fee,
      COALESCE(
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
    SELECT COALESCE(SUM(amount), 0) AS paid_amount
    FROM payments
    WHERE client_unit_id = ?
      AND status = 'verified'
    `,
    [clientUnitId]
  )

  const totalContractPrice = normalizeMoney(clientUnit.total_contract_price)
  const paidAmount = normalizeMoney(paymentRows[0]?.paid_amount)
  const balance = Math.max(normalizeMoney(totalContractPrice - paidAmount), 0)

  let nextStatus = clientUnit.status

  if (
    clientUnit.status === 'reserved' &&
    totalContractPrice > 0 &&
    paidAmount >= normalizeMoney(clientUnit.reservation_fee) &&
    paidAmount < totalContractPrice
  ) {
    nextStatus = 'active'
  }

  if (
    totalContractPrice > 0 &&
    paidAmount >= totalContractPrice &&
    !['cancelled', 'closed'].includes(clientUnit.status)
  ) {
    nextStatus = 'fully_paid'
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

  await refreshCommissionEligibility(clientUnitId, connectionOrDb)

  return {
    totalContractPrice,
    paidAmount,
    balance,
    status: nextStatus,
  }
}

export const getPayments = async (req, res) => {
  const { search, status, client_unit_id, payment_type } = req.query

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
        OR py.status LIKE ?
      )
    `)

    params.push(
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

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const [payments] = await db.query(
    `
    SELECT
      ${paymentFields}
    ${paymentJoins}
    ${whereClause}
    ORDER BY py.payment_date DESC, py.id DESC
    `,
    params
  )

  res.status(200).json({
    message: 'Payments fetched successfully',
    payments,
    data: payments,
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

export const createPayment = async (req, res) => {
  const {
    client_unit_id,
    amount,
    payment_type,
    payment_method,
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

    const verifiedBy = finalStatus === 'verified' ? req.user.id : null
    const verifiedAt = finalStatus === 'verified' ? new Date() : null

    const [result] = await connection.query(
      `
      INSERT INTO payments (
        client_unit_id,
        amount,
        payment_type,
        payment_method,
        payment_date,
        status,
        verified_by,
        verified_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        client_unit_id,
        amountValidation.value,
        nullableValue(payment_type),
        nullableValue(payment_method),
        payment_date || new Date(),
        finalStatus,
        verifiedBy,
        verifiedAt,
      ]
    )

    const balanceSummary = await recomputeClientUnitBalance(
      connection,
      client_unit_id
    )

    const eligibilitySummary = await refreshCommissionEligibility(
      client_unit_id,
      connection
    )

    await connection.commit()

    await createAuditLog({
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
    payment_method,
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

    await connection.query(
      `
      UPDATE payments
      SET
        client_unit_id = ?,
        amount = ?,
        payment_type = ?,
        payment_method = ?,
        payment_date = ?,
        status = ?,
        verified_by = ?,
        verified_at = ?
      WHERE id = ?
      `,
      [
        nextClientUnitId,
        nextAmount,
        !isMissing(payment_type)
          ? nullableValue(payment_type)
          : existingPayment.payment_type,
        !isMissing(payment_method)
          ? nullableValue(payment_method)
          : existingPayment.payment_method,
        !isMissing(payment_date) ? payment_date : existingPayment.payment_date,
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
        affectedClientUnitId
      )

      const eligibilitySummary = await refreshCommissionEligibility(
        affectedClientUnitId,
        connection
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

    await createAuditLog({
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
      existingPayment.client_unit_id
    )

    const eligibilitySummary = await refreshCommissionEligibility(
      existingPayment.client_unit_id,
      connection
    )

    await connection.commit()

    await createAuditLog({
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
