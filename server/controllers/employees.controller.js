import { db } from '../db/connect.js'
import { safeCreateAuditLog } from '../utils/createAuditLog.js'

const allowedStatuses = ['active', 'inactive']

const validDayNames = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
]

const isMissing = (value) => {
  return value === undefined || value === null || value === ''
}

const nullableValue = (value) => {
  if (isMissing(value)) {
    return null
  }

  return value
}

const normalizeSalary = (monthlySalary) => {
  if (isMissing(monthlySalary)) {
    return {
      isValid: true,
      value: 0
    }
  }

  const parsedSalary = Number(monthlySalary)

  return {
    isValid: !Number.isNaN(parsedSalary) && parsedSalary >= 0,
    value: parsedSalary
  }
}

const normalizeRestDays = (restDays) => {
  if (!Array.isArray(restDays)) {
    return {
      isValid: false,
      message: 'Rest days must be an array'
    }
  }

  const normalizedRestDays = []

  for (const day of restDays) {
    if (typeof day !== 'string') {
      return {
        isValid: false,
        message: 'Invalid rest day'
      }
    }

    const normalizedDay = day.trim()

    if (!validDayNames.includes(normalizedDay)) {
      return {
        isValid: false,
        message: 'Invalid rest day'
      }
    }

    if (!normalizedRestDays.includes(normalizedDay)) {
      normalizedRestDays.push(normalizedDay)
    }
  }

  return {
    isValid: true,
    value: normalizedRestDays
  }
}

const restDaysOrder = validDayNames
  .map((dayName) => `'${dayName}'`)
  .join(', ')

const employeeFields = `
  e.id,
  e.full_name,
  e.position,
  e.monthly_salary,
  e.status,
  e.created_at,
  e.updated_at,
  COALESCE(
    GROUP_CONCAT(rd.day_name ORDER BY FIELD(rd.day_name, ${restDaysOrder}) SEPARATOR ', '),
    ''
  ) AS rest_days
`

const employeeGroupBy = `
  e.id,
  e.full_name,
  e.position,
  e.monthly_salary,
  e.status,
  e.created_at,
  e.updated_at
`

const getEmployeesForWhereClause = async (whereClause = '', params = []) => {
  const [employees] = await db.query(
    `
    SELECT
      ${employeeFields}
    FROM employees e
    LEFT JOIN rest_days rd
      ON rd.employee_id = e.id
      AND rd.is_rest_day = TRUE
    ${whereClause}
    GROUP BY
      ${employeeGroupBy}
    ORDER BY e.id DESC
    `,
    params
  )

  return employees
}

const employeeExists = async (connection, employeeId) => {
  const [rows] = await connection.query(
    `
    SELECT id
    FROM employees
    WHERE id = ?
    LIMIT 1
    `,
    [employeeId]
  )

  return rows.length > 0
}

const insertRestDays = async (connection, employeeId, restDays) => {
  if (restDays.length === 0) {
    return
  }

  const placeholders = restDays.map(() => '(?, ?, TRUE)').join(', ')
  const params = restDays.flatMap((dayName) => [employeeId, dayName])

  await connection.query(
    `
    INSERT INTO rest_days (
      employee_id,
      day_name,
      is_rest_day
    ) VALUES ${placeholders}
    `,
    params
  )
}

export const getEmployees = async (req, res) => {
  const { search, status } = req.query
  const conditions = []
  const params = []

  if (!isMissing(search)) {
    const searchTerm = `%${search}%`

    conditions.push(`
      (
        e.full_name LIKE ?
        OR e.position LIKE ?
        OR e.status LIKE ?
      )
    `)

    params.push(searchTerm, searchTerm, searchTerm)
  }

  if (!isMissing(status)) {
    conditions.push('e.status = ?')
    params.push(status)
  }

  const whereClause = conditions.length > 0
    ? `WHERE ${conditions.join(' AND ')}`
    : ''

  const employees = await getEmployeesForWhereClause(whereClause, params)

  res.status(200).json({
    employees
  })
}

export const getEmployee = async (req, res) => {
  const { id } = req.params

  const employees = await getEmployeesForWhereClause(
    'WHERE e.id = ?',
    [id]
  )

  const employee = employees[0]

  if (!employee) {
    return res.status(404).json({
      message: 'Employee not found'
    })
  }

  res.status(200).json({
    employee
  })
}

export const createEmployee = async (req, res) => {
  const {
    full_name,
    position,
    monthly_salary,
    status,
    rest_days
  } = req.body

  if (isMissing(full_name)) {
    return res.status(400).json({
      message: 'Employee full name is required'
    })
  }

  const nextStatus = isMissing(status) ? 'active' : status

  if (!allowedStatuses.includes(nextStatus)) {
    return res.status(400).json({
      message: 'Invalid employee status'
    })
  }

  const salaryValidation = normalizeSalary(monthly_salary)

  if (!salaryValidation.isValid) {
    return res.status(400).json({
      message: 'Monthly salary must be a valid number'
    })
  }

  let normalizedRestDays = []

  if (rest_days !== undefined) {
    const restDaysValidation = normalizeRestDays(rest_days)

    if (!restDaysValidation.isValid) {
      return res.status(400).json({
        message: restDaysValidation.message
      })
    }

    normalizedRestDays = restDaysValidation.value
  }

  const connection = await db.getConnection()
  let employeeId = null

  try {
    await connection.beginTransaction()

    const [result] = await connection.query(
      `
      INSERT INTO employees (
        full_name,
        position,
        monthly_salary,
        status
      ) VALUES (?, ?, ?, ?)
      `,
      [
        full_name,
        nullableValue(position),
        salaryValidation.value,
        nextStatus
      ]
    )

    employeeId = result.insertId

    await insertRestDays(connection, employeeId, normalizedRestDays)

    await connection.commit()
  } catch (err) {
    await connection.rollback()
    throw err
  } finally {
    connection.release()
  }

  await safeCreateAuditLog({
    userId: req.user.id,
    action: 'create',
    module: 'Employees',
    description: `Created employee ${full_name}`,
    ipAddress: req.ip
  })

  res.status(201).json({
    message: 'Employee created successfully',
    employeeId
  })
}

export const updateEmployee = async (req, res) => {
  const { id } = req.params
  const {
    full_name,
    position,
    monthly_salary,
    status,
    rest_days
  } = req.body

  if (isMissing(full_name)) {
    return res.status(400).json({
      message: 'Employee full name is required'
    })
  }

  const nextStatus = isMissing(status) ? 'active' : status

  if (!allowedStatuses.includes(nextStatus)) {
    return res.status(400).json({
      message: 'Invalid employee status'
    })
  }

  const salaryValidation = normalizeSalary(monthly_salary)

  if (!salaryValidation.isValid) {
    return res.status(400).json({
      message: 'Monthly salary must be a valid number'
    })
  }

  let normalizedRestDays = []
  const shouldUpdateRestDays = rest_days !== undefined

  if (shouldUpdateRestDays) {
    const restDaysValidation = normalizeRestDays(rest_days)

    if (!restDaysValidation.isValid) {
      return res.status(400).json({
        message: restDaysValidation.message
      })
    }

    normalizedRestDays = restDaysValidation.value
  }

  const connection = await db.getConnection()

  try {
    await connection.beginTransaction()

    if (!(await employeeExists(connection, id))) {
      await connection.rollback()
      return res.status(404).json({
        message: 'Employee not found'
      })
    }

    await connection.query(
      `
      UPDATE employees
      SET
        full_name = ?,
        position = ?,
        monthly_salary = ?,
        status = ?
      WHERE id = ?
      `,
      [
        full_name,
        nullableValue(position),
        salaryValidation.value,
        nextStatus,
        id
      ]
    )

    if (shouldUpdateRestDays) {
      await connection.query(
        `
        DELETE FROM rest_days
        WHERE employee_id = ?
        `,
        [id]
      )

      await insertRestDays(connection, id, normalizedRestDays)
    }

    await connection.commit()
  } catch (err) {
    await connection.rollback()
    throw err
  } finally {
    connection.release()
  }

  await safeCreateAuditLog({
    userId: req.user.id,
    action: 'update',
    module: 'Employees',
    description: `Updated employee ${full_name}`,
    ipAddress: req.ip
  })

  res.status(200).json({
    message: 'Employee updated successfully'
  })
}

export const getEmployeeRestDays = async (req, res) => {
  const { id } = req.params

  const [employeeRows] = await db.query(
    `
    SELECT id
    FROM employees
    WHERE id = ?
    LIMIT 1
    `,
    [id]
  )

  if (!employeeRows[0]) {
    return res.status(404).json({
      message: 'Employee not found'
    })
  }

  const [rows] = await db.query(
    `
    SELECT day_name
    FROM rest_days
    WHERE employee_id = ?
      AND is_rest_day = TRUE
    ORDER BY FIELD(day_name, ${restDaysOrder})
    `,
    [id]
  )

  const restDays = rows.map((row) => row.day_name)

  res.status(200).json({
    restDays
  })
}

export const updateEmployeeRestDays = async (req, res) => {
  const { id } = req.params
  const { rest_days } = req.body

  const restDaysValidation = normalizeRestDays(rest_days)

  if (!restDaysValidation.isValid) {
    return res.status(400).json({
      message: restDaysValidation.message
    })
  }

  const connection = await db.getConnection()

  try {
    await connection.beginTransaction()

    if (!(await employeeExists(connection, id))) {
      await connection.rollback()
      return res.status(404).json({
        message: 'Employee not found'
      })
    }

    await connection.query(
      `
      DELETE FROM rest_days
      WHERE employee_id = ?
      `,
      [id]
    )

    await insertRestDays(connection, id, restDaysValidation.value)

    await connection.commit()
  } catch (err) {
    await connection.rollback()
    throw err
  } finally {
    connection.release()
  }

  await safeCreateAuditLog({
    userId: req.user.id,
    action: 'update',
    module: 'Employees',
    description: `Updated rest days for employee ${id}`,
    ipAddress: req.ip
  })

  res.status(200).json({
    message: 'Rest days updated successfully'
  })
}
