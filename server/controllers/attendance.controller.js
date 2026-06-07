import { db } from '../db/connect.js'
import { createAuditLog } from '../utils/createAuditLog.js'

const allowedDayStatuses = ['present', 'absent', 'rest_day', 'offset']

const isMissing = (value) => {
  return value === undefined || value === null || value === ''
}

const timeToMinutes = (time) => {
  if (!time) return null

  const [hours, minutes] = String(time).split(':').map(Number)

  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null

  return hours * 60 + minutes
}

const minutesToHours = (minutes) => {
  return Number((minutes / 60).toFixed(2))
}

const getWorkHours = (timeIn, timeOut, breakMinutes = 60) => {
  const timeInMinutes = timeToMinutes(timeIn)
  const timeOutMinutes = timeToMinutes(timeOut)

  if (timeInMinutes === null || timeOutMinutes === null) return null
  if (timeOutMinutes <= timeInMinutes) return null

  const workedMinutes = Math.max(
    timeOutMinutes - timeInMinutes - Number(breakMinutes || 0),
    0
  )

  return minutesToHours(workedMinutes)
}

const getAttendanceStatus = (timeIn, scheduleTimeIn, dayStatus = 'present') => {
  if (dayStatus !== 'present') return dayStatus

  const timeInMinutes = timeToMinutes(timeIn)
  const scheduleInMinutes = timeToMinutes(scheduleTimeIn)

  if (timeInMinutes === null) return 'no_time_in'
  if (scheduleInMinutes === null) return 'present'

  return timeInMinutes > scheduleInMinutes ? 'late' : 'on_time'
}

const checkEmployeeExists = async (employeeId) => {
  const [rows] = await db.query(
    `
    SELECT
      id,
      full_name,
      position,
      monthly_salary,
      status
    FROM employees
    WHERE id = ?
    LIMIT 1
    `,
    [employeeId]
  )

  return rows[0]
}

const buildAttendanceRecord = (record) => {
  return {
    ...record,
    work_hours: getWorkHours(
      record.time_in,
      record.time_out,
      record.break_minutes
    ),
    attendance_status: getAttendanceStatus(
      record.time_in,
      record.schedule_time_in,
      record.day_status
    ),
  }
}

const attendanceSelectFields = `
  a.id,
  a.employee_id,
  e.full_name AS employee_name,
  e.position,
  a.attendance_date,
  a.day_status,
  a.time_in,
  a.time_out,
  a.schedule_time_in,
  a.schedule_time_out,
  a.break_minutes,
  a.created_at,
  a.updated_at
`

export const getAttendance = async (req, res) => {
  const {
    search,
    employee_id,
    date_from,
    date_to,
    day_status,
  } = req.query

  const conditions = []
  const params = []

  if (!isMissing(search)) {
    const searchTerm = `%${search}%`

    conditions.push(`
      (
        e.full_name LIKE ?
        OR e.position LIKE ?
        OR a.attendance_date LIKE ?
        OR a.day_status LIKE ?
      )
    `)

    params.push(searchTerm, searchTerm, searchTerm, searchTerm)
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

  if (!isMissing(day_status)) {
    conditions.push('a.day_status = ?')
    params.push(day_status)
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const [rows] = await db.query(
    `
    SELECT
      ${attendanceSelectFields}
    FROM attendance a
    INNER JOIN employees e ON e.id = a.employee_id
    ${whereClause}
    ORDER BY a.attendance_date DESC, a.id DESC
    `,
    params
  )

  const attendance = rows.map(buildAttendanceRecord)

  res.status(200).json({
    attendance,
  })
}

export const getAttendanceRecord = async (req, res) => {
  const { id } = req.params

  const [rows] = await db.query(
    `
    SELECT
      ${attendanceSelectFields}
    FROM attendance a
    INNER JOIN employees e ON e.id = a.employee_id
    WHERE a.id = ?
    LIMIT 1
    `,
    [id]
  )

  const record = rows[0]

  if (!record) {
    return res.status(404).json({
      message: 'Attendance record not found',
    })
  }

  res.status(200).json({
    attendanceRecord: buildAttendanceRecord(record),
  })
}

export const getAttendanceByEmployee = async (req, res) => {
  const { employeeId } = req.params
  const { date_from, date_to } = req.query

  const employee = await checkEmployeeExists(employeeId)

  if (!employee) {
    return res.status(404).json({
      message: 'Employee not found',
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

  const [rows] = await db.query(
    `
    SELECT
      ${attendanceSelectFields}
    FROM attendance a
    INNER JOIN employees e ON e.id = a.employee_id
    WHERE ${conditions.join(' AND ')}
    ORDER BY a.attendance_date DESC, a.id DESC
    `,
    params
  )

  const attendance = rows.map(buildAttendanceRecord)

  res.status(200).json({
    employee,
    attendance,
  })
}

export const createAttendance = async (req, res) => {
  const {
    employee_id,
    attendance_date,
    day_status = 'present',
    time_in,
    time_out,
    schedule_time_in,
    schedule_time_out,
    break_minutes = 60,
  } = req.body

  if (!employee_id) {
    return res.status(400).json({
      message: 'Employee is required',
    })
  }

  if (!attendance_date) {
    return res.status(400).json({
      message: 'Attendance date is required',
    })
  }

  if (!allowedDayStatuses.includes(day_status)) {
    return res.status(400).json({
      message: 'Invalid day status',
    })
  }

  const employee = await checkEmployeeExists(employee_id)

  if (!employee) {
    return res.status(404).json({
      message: 'Employee not found',
    })
  }

  const timeInMinutes = timeToMinutes(time_in)
  const timeOutMinutes = timeToMinutes(time_out)

  if (
    timeInMinutes !== null &&
    timeOutMinutes !== null &&
    timeOutMinutes <= timeInMinutes
  ) {
    return res.status(400).json({
      message: 'Time out must be greater than time in',
    })
  }

  const [existingRows] = await db.query(
    `
    SELECT id
    FROM attendance
    WHERE employee_id = ?
      AND attendance_date = ?
    LIMIT 1
    `,
    [employee_id, attendance_date]
  )

  if (existingRows.length > 0) {
    return res.status(409).json({
      message: 'Attendance already exists for this employee and date',
    })
  }

  const [result] = await db.query(
    `
    INSERT INTO attendance (
      employee_id,
      attendance_date,
      day_status,
      time_in,
      time_out,
      schedule_time_in,
      schedule_time_out,
      break_minutes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      employee_id,
      attendance_date,
      day_status,
      time_in || null,
      time_out || null,
      schedule_time_in || null,
      schedule_time_out || null,
      Number(break_minutes || 0),
    ]
  )

  await createAuditLog({
    userId: req.user.id,
    action: 'create',
    module: 'Attendance',
    description: `Created attendance for ${employee.full_name} on ${attendance_date}`,
    ipAddress: req.ip,
  })

  res.status(201).json({
    message: 'Attendance created successfully',
    attendanceId: result.insertId,
  })
}

export const updateAttendance = async (req, res) => {
  const { id } = req.params

  const {
    employee_id,
    attendance_date,
    day_status = 'present',
    time_in,
    time_out,
    schedule_time_in,
    schedule_time_out,
    break_minutes = 60,
  } = req.body

  const [attendanceRows] = await db.query(
    `
    SELECT id
    FROM attendance
    WHERE id = ?
    LIMIT 1
    `,
    [id]
  )

  if (attendanceRows.length === 0) {
    return res.status(404).json({
      message: 'Attendance record not found',
    })
  }

  if (!employee_id) {
    return res.status(400).json({
      message: 'Employee is required',
    })
  }

  if (!attendance_date) {
    return res.status(400).json({
      message: 'Attendance date is required',
    })
  }

  if (!allowedDayStatuses.includes(day_status)) {
    return res.status(400).json({
      message: 'Invalid day status',
    })
  }

  const employee = await checkEmployeeExists(employee_id)

  if (!employee) {
    return res.status(404).json({
      message: 'Employee not found',
    })
  }

  const timeInMinutes = timeToMinutes(time_in)
  const timeOutMinutes = timeToMinutes(time_out)

  if (
    timeInMinutes !== null &&
    timeOutMinutes !== null &&
    timeOutMinutes <= timeInMinutes
  ) {
    return res.status(400).json({
      message: 'Time out must be greater than time in',
    })
  }

  const [duplicateRows] = await db.query(
    `
    SELECT id
    FROM attendance
    WHERE employee_id = ?
      AND attendance_date = ?
      AND id <> ?
    LIMIT 1
    `,
    [employee_id, attendance_date, id]
  )

  if (duplicateRows.length > 0) {
    return res.status(409).json({
      message: 'Attendance already exists for this employee and date',
    })
  }

  await db.query(
    `
    UPDATE attendance
    SET
      employee_id = ?,
      attendance_date = ?,
      day_status = ?,
      time_in = ?,
      time_out = ?,
      schedule_time_in = ?,
      schedule_time_out = ?,
      break_minutes = ?
    WHERE id = ?
    `,
    [
      employee_id,
      attendance_date,
      day_status,
      time_in || null,
      time_out || null,
      schedule_time_in || null,
      schedule_time_out || null,
      Number(break_minutes || 0),
      id,
    ]
  )

  await createAuditLog({
    userId: req.user.id,
    action: 'update',
    module: 'Attendance',
    description: `Updated attendance ${id}`,
    ipAddress: req.ip,
  })

  res.status(200).json({
    message: 'Attendance updated successfully',
  })
}

export const getEmployeeAttendanceSummary = async (req, res) => {
  const { employeeId } = req.params
  const { date_from, date_to } = req.query

  const employee = await checkEmployeeExists(employeeId)

  if (!employee) {
    return res.status(404).json({
      message: 'Employee not found',
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

  const [records] = await db.query(
    `
    SELECT
      a.id,
      a.employee_id,
      a.attendance_date,
      a.day_status,
      a.time_in,
      a.time_out,
      a.schedule_time_in,
      a.schedule_time_out,
      a.break_minutes,
      a.created_at,
      a.updated_at
    FROM attendance a
    WHERE ${conditions.join(' AND ')}
    ORDER BY a.attendance_date ASC
    `,
    params
  )

  let totalWorkedMinutesWithOt = 0
  let totalRegularMinutes = 0
  let totalOvertimeMinutes = 0
  let totalLateMinutes = 0

  let presentDays = 0
  let absentDays = 0
  let restDays = 0
  let offsetDays = 0
  let lateDays = 0
  let onTimeDays = 0

  const logs = records.map((record) => {
    const timeInMinutes = timeToMinutes(record.time_in)
    const timeOutMinutes = timeToMinutes(record.time_out)
    const scheduleInMinutes = timeToMinutes(record.schedule_time_in)
    const scheduleOutMinutes = timeToMinutes(record.schedule_time_out)
    const breakMinutes = Number(record.break_minutes || 0)

    let workedMinutes = 0
    let regularMinutes = 0
    let overtimeMinutes = 0
    let lateMinutes = 0
    let computedStatus = record.day_status

    if (record.day_status === 'absent') {
      absentDays += 1
    }

    if (record.day_status === 'rest_day') {
      restDays += 1
    }

    if (record.day_status === 'offset') {
      offsetDays += 1
    }

    if (
      record.day_status === 'present' &&
      timeInMinutes !== null &&
      timeOutMinutes !== null
    ) {
      presentDays += 1

      workedMinutes = Math.max(
        timeOutMinutes - timeInMinutes - breakMinutes,
        0
      )

      const expectedRegularMinutes =
        scheduleInMinutes !== null && scheduleOutMinutes !== null
          ? Math.max(scheduleOutMinutes - scheduleInMinutes - breakMinutes, 0)
          : workedMinutes

      regularMinutes = Math.min(workedMinutes, expectedRegularMinutes)

      overtimeMinutes =
        scheduleOutMinutes !== null
          ? Math.max(timeOutMinutes - scheduleOutMinutes, 0)
          : 0

      lateMinutes =
        scheduleInMinutes !== null
          ? Math.max(timeInMinutes - scheduleInMinutes, 0)
          : 0

      if (lateMinutes > 0) {
        lateDays += 1
        computedStatus = 'late'
      } else {
        onTimeDays += 1
        computedStatus = 'on_time'
      }

      totalWorkedMinutesWithOt += workedMinutes
      totalRegularMinutes += regularMinutes
      totalOvertimeMinutes += overtimeMinutes
      totalLateMinutes += lateMinutes
    }

    return {
      ...record,
      computed_status: computedStatus,
      worked_hours_with_ot: minutesToHours(workedMinutes),
      regular_hours: minutesToHours(regularMinutes),
      overtime_hours: minutesToHours(overtimeMinutes),
      late_hours: minutesToHours(lateMinutes),
    }
  })

  const bonusCandidate = absentDays === 0 && presentDays >= 30

  res.status(200).json({
    employee,
    summary: {
      totalWorkedHoursWithOt: minutesToHours(totalWorkedMinutesWithOt),
      totalRegularHours: minutesToHours(totalRegularMinutes),
      overtimeHours: minutesToHours(totalOvertimeMinutes),
      totalLateHours: minutesToHours(totalLateMinutes),
      presentDays,
      absentDays,
      restDays,
      offsetDays,
      lateDays,
      onTimeDays,
      bonusCandidate,
      bonusNote: bonusCandidate
        ? 'Candidate for 30-day bonus. Final approval still depends on admin review of lates and company rules.'
        : 'Not a bonus candidate based on current attendance records.',
    },
    logs,
  })
}