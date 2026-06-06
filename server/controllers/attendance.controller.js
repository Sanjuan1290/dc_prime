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

const parseTimeToMinutes = (timeValue) => {
  if (isMissing(timeValue)) {
    return null
  }

  const parts = String(timeValue).split(':')

  if (parts.length < 2 || parts.length > 3) {
    return null
  }

  const [hoursValue, minutesValue, secondsValue = '0'] = parts
  const hours = Number(hoursValue)
  const minutes = Number(minutesValue)
  const seconds = Number(secondsValue)

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    Number.isNaN(seconds) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59 ||
    seconds < 0 ||
    seconds >= 60
  ) {
    return null
  }

  return (hours * 60) + minutes + (seconds / 60)
}

const isValidTime = (timeValue) => {
  return isMissing(timeValue) || parseTimeToMinutes(timeValue) !== null
}

export const getWorkHours = (timeIn, timeOut) => {
  if (isMissing(timeIn) || isMissing(timeOut)) {
    return null
  }

  const timeInMinutes = parseTimeToMinutes(timeIn)
  const timeOutMinutes = parseTimeToMinutes(timeOut)

  if (timeInMinutes === null || timeOutMinutes === null || timeOutMinutes <= timeInMinutes) {
    return null
  }

  return Number(((timeOutMinutes - timeInMinutes) / 60).toFixed(2))
}

export const getAttendanceStatus = (timeIn, scheduleTimeIn) => {
  if (isMissing(timeIn)) {
    return 'no_time_in'
  }

  const timeInMinutes = parseTimeToMinutes(timeIn)
  const scheduleTimeInMinutes = parseTimeToMinutes(scheduleTimeIn)

  if (
    timeInMinutes !== null &&
    scheduleTimeInMinutes !== null &&
    timeInMinutes > scheduleTimeInMinutes
  ) {
    return 'late'
  }

  return 'on_time'
}

const validateTimeFields = ({
  time_in,
  time_out,
  schedule_time_in,
  schedule_time_out
}) => {
  const timeFields = [
    time_in,
    time_out,
    schedule_time_in,
    schedule_time_out
  ]

  if (timeFields.some((timeField) => !isValidTime(timeField))) {
    return {
      isValid: false,
      message: 'Invalid time value'
    }
  }

  if (!isMissing(time_in) && !isMissing(time_out)) {
    const timeInMinutes = parseTimeToMinutes(time_in)
    const timeOutMinutes = parseTimeToMinutes(time_out)

    if (timeOutMinutes <= timeInMinutes) {
      return {
        isValid: false,
        message: 'Time out should be greater than time in'
      }
    }
  }

  return {
    isValid: true
  }
}

const duplicateAttendanceMessage = 'Attendance already exists for this employee and date'

const isDuplicateAttendanceError = (err) => {
  return err && err.code === 'ER_DUP_ENTRY'
}

const employeeExists = async (employeeId) => {
  const [rows] = await db.query(
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

const attendanceFields = `
  a.id,
  a.employee_id,
  e.full_name AS employee_name,
  e.position,
  a.attendance_date,
  a.time_in,
  a.time_out,
  a.schedule_time_in,
  a.schedule_time_out,
  a.created_at,
  a.updated_at
`

const attendanceJoins = `
  FROM attendance a
  INNER JOIN employees e ON e.id = a.employee_id
`

const decorateAttendanceRecord = (record) => {
  return {
    ...record,
    work_hours: getWorkHours(record.time_in, record.time_out),
    attendance_status: getAttendanceStatus(record.time_in, record.schedule_time_in)
  }
}

const getAttendanceForWhereClause = async (whereClause = '', params = []) => {
  const [attendance] = await db.query(
    `
    SELECT
      ${attendanceFields}
    ${attendanceJoins}
    ${whereClause}
    ORDER BY a.attendance_date DESC, a.id DESC
    `,
    params
  )

  return attendance.map(decorateAttendanceRecord)
}

const attendanceRecordExists = async (attendanceId) => {
  const [rows] = await db.query(
    `
    SELECT id
    FROM attendance
    WHERE id = ?
    LIMIT 1
    `,
    [attendanceId]
  )

  return rows.length > 0
}

const hasDuplicateAttendance = async ({
  employeeId,
  attendanceDate,
  excludeAttendanceId = null
}) => {
  const conditions = [
    'employee_id = ?',
    'attendance_date = ?'
  ]
  const params = [employeeId, attendanceDate]

  if (!isMissing(excludeAttendanceId)) {
    conditions.push('id <> ?')
    params.push(excludeAttendanceId)
  }

  const [rows] = await db.query(
    `
    SELECT id
    FROM attendance
    WHERE ${conditions.join(' AND ')}
    LIMIT 1
    `,
    params
  )

  return rows.length > 0
}

export const getAttendance = async (req, res) => {
  const {
    search,
    employee_id,
    date_from,
    date_to
  } = req.query

  const conditions = []
  const params = []

  if (!isMissing(search)) {
    const searchTerm = `%${search}%`

    conditions.push(`
      (
        e.full_name LIKE ?
        OR e.position LIKE ?
        OR CAST(a.attendance_date AS CHAR) LIKE ?
      )
    `)

    params.push(searchTerm, searchTerm, searchTerm)
  }

  if (!isMissing(employee_id)) {
    conditions.push('a.employee_id = ?')
    params.push(employee_id)
  }

  if (!isMissing(date_from)) {
    conditions.push('a.attendance_date >= ?')
    params.push(date_from)
  }

  if (!isMissing(date_to)) {
    conditions.push('a.attendance_date <= ?')
    params.push(date_to)
  }

  const whereClause = conditions.length > 0
    ? `WHERE ${conditions.join(' AND ')}`
    : ''

  const attendance = await getAttendanceForWhereClause(whereClause, params)

  res.status(200).json({
    attendance
  })
}

export const getAttendanceRecord = async (req, res) => {
  const { id } = req.params

  const attendance = await getAttendanceForWhereClause(
    'WHERE a.id = ?',
    [id]
  )

  const attendanceRecord = attendance[0]

  if (!attendanceRecord) {
    return res.status(404).json({
      message: 'Attendance record not found'
    })
  }

  res.status(200).json({
    attendanceRecord
  })
}

export const getAttendanceByEmployee = async (req, res) => {
  const { employeeId } = req.params
  const { date_from, date_to } = req.query

  if (!(await employeeExists(employeeId))) {
    return res.status(404).json({
      message: 'Employee not found'
    })
  }

  const conditions = ['a.employee_id = ?']
  const params = [employeeId]

  if (!isMissing(date_from)) {
    conditions.push('a.attendance_date >= ?')
    params.push(date_from)
  }

  if (!isMissing(date_to)) {
    conditions.push('a.attendance_date <= ?')
    params.push(date_to)
  }

  const attendance = await getAttendanceForWhereClause(
    `WHERE ${conditions.join(' AND ')}`,
    params
  )

  res.status(200).json({
    attendance
  })
}

export const createAttendance = async (req, res) => {
  const {
    employee_id,
    attendance_date,
    time_in,
    time_out,
    schedule_time_in,
    schedule_time_out
  } = req.body

  if (isMissing(employee_id)) {
    return res.status(400).json({
      message: 'Employee ID is required'
    })
  }

  if (!(await employeeExists(employee_id))) {
    return res.status(404).json({
      message: 'Employee not found'
    })
  }

  if (isMissing(attendance_date)) {
    return res.status(400).json({
      message: 'Attendance date is required'
    })
  }

  const timeValidation = validateTimeFields({
    time_in,
    time_out,
    schedule_time_in,
    schedule_time_out
  })

  if (!timeValidation.isValid) {
    return res.status(400).json({
      message: timeValidation.message
    })
  }

  if (await hasDuplicateAttendance({ employeeId: employee_id, attendanceDate: attendance_date })) {
    return res.status(409).json({
      message: duplicateAttendanceMessage
    })
  }

  let attendanceId = null

  try {
    const [result] = await db.query(
      `
      INSERT INTO attendance (
        employee_id,
        attendance_date,
        time_in,
        time_out,
        schedule_time_in,
        schedule_time_out
      ) VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        employee_id,
        attendance_date,
        nullableValue(time_in),
        nullableValue(time_out),
        nullableValue(schedule_time_in),
        nullableValue(schedule_time_out)
      ]
    )

    attendanceId = result.insertId
  } catch (err) {
    if (isDuplicateAttendanceError(err)) {
      return res.status(409).json({
        message: duplicateAttendanceMessage
      })
    }

    throw err
  }

  await createAuditLog({
    userId: req.user.id,
    action: 'create',
    module: 'Attendance',
    description: `Created attendance for employee ${employee_id} on ${attendance_date}`,
    ipAddress: req.ip
  })

  res.status(201).json({
    message: 'Attendance created successfully',
    attendanceId
  })
}

export const updateAttendance = async (req, res) => {
  const { id } = req.params
  const {
    employee_id,
    attendance_date,
    time_in,
    time_out,
    schedule_time_in,
    schedule_time_out
  } = req.body

  if (!(await attendanceRecordExists(id))) {
    return res.status(404).json({
      message: 'Attendance record not found'
    })
  }

  if (isMissing(employee_id)) {
    return res.status(400).json({
      message: 'Employee ID is required'
    })
  }

  if (!(await employeeExists(employee_id))) {
    return res.status(404).json({
      message: 'Employee not found'
    })
  }

  if (isMissing(attendance_date)) {
    return res.status(400).json({
      message: 'Attendance date is required'
    })
  }

  const timeValidation = validateTimeFields({
    time_in,
    time_out,
    schedule_time_in,
    schedule_time_out
  })

  if (!timeValidation.isValid) {
    return res.status(400).json({
      message: timeValidation.message
    })
  }

  if (await hasDuplicateAttendance({
    employeeId: employee_id,
    attendanceDate: attendance_date,
    excludeAttendanceId: id
  })) {
    return res.status(409).json({
      message: duplicateAttendanceMessage
    })
  }

  try {
    await db.query(
      `
      UPDATE attendance
      SET
        employee_id = ?,
        attendance_date = ?,
        time_in = ?,
        time_out = ?,
        schedule_time_in = ?,
        schedule_time_out = ?
      WHERE id = ?
      `,
      [
        employee_id,
        attendance_date,
        nullableValue(time_in),
        nullableValue(time_out),
        nullableValue(schedule_time_in),
        nullableValue(schedule_time_out),
        id
      ]
    )
  } catch (err) {
    if (isDuplicateAttendanceError(err)) {
      return res.status(409).json({
        message: duplicateAttendanceMessage
      })
    }

    throw err
  }

  await createAuditLog({
    userId: req.user.id,
    action: 'update',
    module: 'Attendance',
    description: `Updated attendance ${id}`,
    ipAddress: req.ip
  })

  res.status(200).json({
    message: 'Attendance updated successfully'
  })
}
