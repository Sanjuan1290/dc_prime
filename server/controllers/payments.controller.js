import { db } from '../db/connect.js'
import { createAuditLog } from '../utils/createAuditLog.js'

const isMissing = (value) => {
  return value === undefined || value === null || value === ''
}

const nullableValue = (value) => {
  if (isMissing(value)) {
    return null
  }

  return value
}

const normalizeMoney = (value) => {
  return Number(Number(value).toFixed(2))
}

const validateAmount = (amount) => {
  const parsedAmount = Number(amount)

  return {
    isValid: !Number.isNaN(parsedAmount) && parsedAmount > 0,
    value: parsedAmount
  }
}

const paymentFields = `
  py.id,
  py.client_unit_id,
  c.full_name AS client_name,
  l.unit_id,
  p.name AS project_name,
  py.amount,
  py.payment_type,
  py.payment_method,
  py.payment_date,
  py.created_at,
  py.updated_at
`

const paymentJoins = `
  FROM payments py
  INNER JOIN client_units cu ON cu.id = py.client_unit_id
  INNER JOIN clients c ON c.id = cu.client_id
  INNER JOIN listings l ON l.id = cu.listing_id
  INNER JOIN projects p ON p.id = l.project_id
`

const clientUnitExists = async (connection, clientUnitId) => {
  const [rows] = await connection.query(
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

const recomputeClientUnitBalance = async (connection, clientUnitId) => {
  const [clientUnitRows] = await connection.query(
    `
    SELECT
      cu.id,
      cu.listing_id,
      cu.status,
      l.net_selling_price
    FROM client_units cu
    INNER JOIN listings l ON l.id = cu.listing_id
    WHERE cu.id = ?
    LIMIT 1
    FOR UPDATE
    `,
    [clientUnitId]
  )

  const clientUnit = clientUnitRows[0]

  if (!clientUnit) {
    return null
  }

  const [paymentRows] = await connection.query(
    `
    SELECT COALESCE(SUM(amount), 0) AS total_paid
    FROM payments
    WHERE client_unit_id = ?
    `,
    [clientUnitId]
  )

  const totalPaid = normalizeMoney(paymentRows[0].total_paid)
  const netSellingPrice = normalizeMoney(clientUnit.net_selling_price)
  const balance = normalizeMoney(Math.max(netSellingPrice - totalPaid, 0))

  await connection.query(
    `
    UPDATE client_units
    SET balance = ?
    WHERE id = ?
    `,
    [balance, clientUnitId]
  )

  if (balance <= 0) {
    await connection.query(
      `
      UPDATE client_units
      SET status = ?
      WHERE id = ?
      `,
      ['fully_paid', clientUnitId]
    )

    await connection.query(
      `
      UPDATE listings
      SET status = ?
      WHERE id = ?
      `,
      ['sold', clientUnit.listing_id]
    )
  } else if (clientUnit.status === 'fully_paid') {
    await connection.query(
      `
      UPDATE client_units
      SET status = ?
      WHERE id = ?
      `,
      ['active', clientUnitId]
    )

    await connection.query(
      `
      UPDATE listings
      SET status = ?
      WHERE id = ?
      `,
      ['reserved', clientUnit.listing_id]
    )
  }

  return {
    balance,
    totalPaid
  }
}

export const getPayments = async (req, res) => {
  const {
    search,
    client_unit_id,
    payment_type,
    payment_method,
    date_from,
    date_to
  } = req.query

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
      )
    `)

    params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm)
  }

  if (!isMissing(client_unit_id)) {
    conditions.push('py.client_unit_id = ?')
    params.push(client_unit_id)
  }

  if (!isMissing(payment_type)) {
    conditions.push('py.payment_type = ?')
    params.push(payment_type)
  }

  if (!isMissing(payment_method)) {
    conditions.push('py.payment_method = ?')
    params.push(payment_method)
  }

  if (!isMissing(date_from)) {
    conditions.push('py.payment_date >= ?')
    params.push(date_from)
  }

  if (!isMissing(date_to)) {
    conditions.push('py.payment_date <= ?')
    params.push(date_to)
  }

  const whereClause = conditions.length > 0
    ? `WHERE ${conditions.join(' AND ')}`
    : ''

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
    payments
  })
}

export const getPayment = async (req, res) => {
  const { id } = req.params

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

  const payment = rows[0]

  if (!payment) {
    return res.status(404).json({
      message: 'Payment not found'
    })
  }

  res.status(200).json({
    payment
  })
}

export const getPaymentsByClientUnit = async (req, res) => {
  const { clientUnitId } = req.params

  const [clientUnitRows] = await db.query(
    `
    SELECT id
    FROM client_units
    WHERE id = ?
    LIMIT 1
    `,
    [clientUnitId]
  )

  if (!clientUnitRows[0]) {
    return res.status(404).json({
      message: 'Client unit not found'
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
    payments
  })
}

export const createPayment = async (req, res) => {
  const {
    client_unit_id,
    amount,
    payment_type,
    payment_method,
    payment_date
  } = req.body

  if (isMissing(client_unit_id)) {
    return res.status(400).json({
      message: 'Client unit ID is required'
    })
  }

  if (isMissing(amount)) {
    return res.status(400).json({
      message: 'Payment amount is required'
    })
  }

  const amountValidation = validateAmount(amount)

  if (!amountValidation.isValid) {
    return res.status(400).json({
      message: 'Payment amount must be greater than 0'
    })
  }

  const connection = await db.getConnection()
  let paymentId = null
  let balanceResult = null

  try {
    await connection.beginTransaction()

    if (!(await clientUnitExists(connection, client_unit_id))) {
      await connection.rollback()
      return res.status(404).json({
        message: 'Client unit not found'
      })
    }

    const [result] = await connection.query(
      `
      INSERT INTO payments (
        client_unit_id,
        amount,
        payment_type,
        payment_method,
        payment_date
      ) VALUES (?, ?, ?, ?, COALESCE(?, CURDATE()))
      `,
      [
        client_unit_id,
        amountValidation.value,
        payment_type || 'other',
        nullableValue(payment_method),
        nullableValue(payment_date)
      ]
    )

    paymentId = result.insertId
    balanceResult = await recomputeClientUnitBalance(connection, client_unit_id)

    await connection.commit()
  } catch (err) {
    await connection.rollback()
    throw err
  } finally {
    connection.release()
  }

  await createAuditLog({
    userId: req.user.id,
    action: 'payment',
    module: 'Payments',
    description: `Added payment for client unit ${client_unit_id}`,
    ipAddress: req.ip
  })

  res.status(201).json({
    message: 'Payment created successfully',
    paymentId,
    balance: balanceResult.balance,
    totalPaid: balanceResult.totalPaid
  })
}

export const updatePayment = async (req, res) => {
  const { id } = req.params
  const {
    client_unit_id,
    amount,
    payment_type,
    payment_method,
    payment_date
  } = req.body

  if (isMissing(client_unit_id)) {
    return res.status(400).json({
      message: 'Client unit ID is required'
    })
  }

  if (isMissing(amount)) {
    return res.status(400).json({
      message: 'Payment amount is required'
    })
  }

  const amountValidation = validateAmount(amount)

  if (!amountValidation.isValid) {
    return res.status(400).json({
      message: 'Payment amount must be greater than 0'
    })
  }

  const connection = await db.getConnection()
  let balanceResult = null

  try {
    await connection.beginTransaction()

    const [paymentRows] = await connection.query(
      `
      SELECT
        id,
        client_unit_id
      FROM payments
      WHERE id = ?
      LIMIT 1
      FOR UPDATE
      `,
      [id]
    )

    const oldPayment = paymentRows[0]

    if (!oldPayment) {
      await connection.rollback()
      return res.status(404).json({
        message: 'Payment not found'
      })
    }

    if (!(await clientUnitExists(connection, client_unit_id))) {
      await connection.rollback()
      return res.status(404).json({
        message: 'Client unit not found'
      })
    }

    await connection.query(
      `
      UPDATE payments
      SET
        client_unit_id = ?,
        amount = ?,
        payment_type = ?,
        payment_method = ?,
        payment_date = COALESCE(?, CURDATE())
      WHERE id = ?
      `,
      [
        client_unit_id,
        amountValidation.value,
        payment_type || 'other',
        nullableValue(payment_method),
        nullableValue(payment_date),
        id
      ]
    )

    balanceResult = await recomputeClientUnitBalance(connection, client_unit_id)

    if (String(oldPayment.client_unit_id) !== String(client_unit_id)) {
      await recomputeClientUnitBalance(connection, oldPayment.client_unit_id)
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
    action: 'update',
    module: 'Payments',
    description: `Updated payment ${id}`,
    ipAddress: req.ip
  })

  res.status(200).json({
    message: 'Payment updated successfully',
    balance: balanceResult.balance,
    totalPaid: balanceResult.totalPaid
  })
}
