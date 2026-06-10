import { db } from '../db/connect.js'
import { createAuditLog } from '../utils/createAuditLog.js'
import { getClientIp } from '../utils/getClientIp.js'

const allowedDayStatuses = ['present', 'absent', 'rest_day', 'offset']

const defaultSchedule = {
  timeIn: '09:00',
  timeOut: '18:00',
  breakMinutes: 60
}

const duplicateAttendanceMessage =
  'Attendance already exists for this employee and date'

const isMissing = (value) => {
  return value === undefined || value === null || value === ''
}

const nullableValue = (value) => {
  if (isMissing(value)) return null
  return value
}

const getLocalDate = () => {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

const getDayName = (dateValue = getLocalDate()) => {
  const date = new Date(`${dateValue}T00:00:00`)

  return date.toLocaleDateString('en-US', {
    weekday: 'long'
  })
}

const getCurrentTimeString = () => {
  const date = new Date()
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${hours}:${minutes}`
}

const timeToMinutes = (time) => {
  if (!time) return null

  const [hours, minutes] = String(time).slice(0, 5).split(':').map(Number)

  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null

  return hours * 60 + minutes
}

const minutesToHours = (minutes) => {
  return Number((minutes / 60).toFixed(2))
}


const isAfterCutoff = () => {
  const currentMinutes = timeToMinutes(getCurrentTimeString())
  const cutoffMinutes = timeToMinutes(defaultSchedule.timeOut)

  if (currentMinutes === null || cutoffMinutes === null) return false

  return currentMinutes >= cutoffMinutes
}

const createMissingAttendanceForEmployees = async ({
  employeeIds = null,
  attendanceDate = getLocalDate(),
  forceAbsent = false
}) => {
  const params = []
  let employeeFilter = ''

  if (Array.isArray(employeeIds) && employeeIds.length > 0) {
    employeeFilter = `AND id IN (${employeeIds.map(() => '?').join(', ')})`
    params.push(...employeeIds)
  }

  const [employees] = await db.query(
    `
    SELECT id, full_name
    FROM employees
    WHERE status = 'active'
      ${employeeFilter}
    ORDER BY full_name ASC
    `,
    params
  )

  const currentIsAfterCutoff = isAfterCutoff()
  let createdPresent = 0
  let createdRestDays = 0
  let createdAbsents = 0
  let skippedExisting = 0
  let skippedBeforeCutoff = 0

  for (const employee of employees) {
    const alreadyExists = await hasDuplicateAttendance({
      employeeId: employee.id,
      attendanceDate
    })

    if (alreadyExists) {
      skippedExisting += 1
      continue
    }

    const isRestDay = await isEmployeeRestDay(employee.id, attendanceDate)

    if (isRestDay) {
      await db.query(
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
          employee.id,
          attendanceDate,
          'rest_day',
          null,
          null,
          defaultSchedule.timeIn,
          defaultSchedule.timeOut,
          defaultSchedule.breakMinutes
        ]
      )

      createdRestDays += 1
      continue
    }

    if (forceAbsent) {
      await db.query(
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
          employee.id,
          attendanceDate,
          'absent',
          null,
          null,
          defaultSchedule.timeIn,
          defaultSchedule.timeOut,
          defaultSchedule.breakMinutes
        ]
      )

      createdAbsents += 1
      continue
    }

    if (!currentIsAfterCutoff) {
      await db.query(
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
          employee.id,
          attendanceDate,
          'present',
          defaultSchedule.timeIn,
          defaultSchedule.timeOut,
          defaultSchedule.timeIn,
          defaultSchedule.timeOut,
          defaultSchedule.breakMinutes
        ]
      )

      createdPresent += 1
      continue
    }

    await db.query(
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
        employee.id,
        attendanceDate,
        'absent',
        null,
        null,
        defaultSchedule.timeIn,
        defaultSchedule.timeOut,
        defaultSchedule.breakMinutes
      ]
    )

    createdAbsents += 1
  }

  return {
    totalEmployees: employees.length,
    createdPresent,
    createdRestDays,
    createdAbsents,
    skippedExisting,
    skippedBeforeCutoff
  }
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

const validateTimeFields = ({
  time_in,
  time_out,
  schedule_time_in,
  schedule_time_out
}) => {
  const timeInMinutes = timeToMinutes(time_in)
  const timeOutMinutes = timeToMinutes(time_out)
  const scheduleInMinutes = timeToMinutes(schedule_time_in)
  const scheduleOutMinutes = timeToMinutes(schedule_time_out)

  if (
    timeInMinutes !== null &&
    timeOutMinutes !== null &&
    timeOutMinutes <= timeInMinutes
  ) {
    return {
      isValid: false,
      message: 'Time out must be greater than time in'
    }
  }

  if (
    scheduleInMinutes !== null &&
    scheduleOutMinutes !== null &&
    scheduleOutMinutes <= scheduleInMinutes
  ) {
    return {
      isValid: false,
      message: 'Schedule time out must be greater than schedule time in'
    }
  }

  return {
    isValid: true,
    message: null
  }
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

const isEmployeeRestDay = async (employeeId, dateValue = getLocalDate()) => {
  const dayName = getDayName(dateValue)

  const [rows] = await db.query(
    `
    SELECT id
    FROM rest_days
    WHERE employee_id = ?
      AND day_name = ?
      AND is_rest_day = TRUE
    LIMIT 1
    `,
    [employeeId, dayName]
  )

  return rows.length > 0
}

const hasDuplicateAttendance = async ({
  employeeId,
  attendanceDate,
  excludeAttendanceId = null
}) => {
  const params = [employeeId, attendanceDate]
  let excludeClause = ''

  if (excludeAttendanceId) {
    excludeClause = 'AND id <> ?'
    params.push(excludeAttendanceId)
  }

  const [rows] = await db.query(
    `
    SELECT id
    FROM attendance
    WHERE employee_id = ?
      AND attendance_date = ?
      ${excludeClause}
    LIMIT 1
    `,
    params
  )

  return rows.length > 0
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
    )
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
    day_status
  } = req.query

  if (isAfterCutoff()) {
    await createMissingAttendanceForEmployees({
      attendanceDate: getLocalDate(),
      forceAbsent: true
    })
  }

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
    attendance
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
      message: 'Attendance record not found'
    })
  }

  res.status(200).json({
    attendanceRecord: buildAttendanceRecord(record)
  })
}

export const getAttendanceByEmployee = async (req, res) => {
  const { employeeId } = req.params
  const { date_from, date_to } = req.query

  const employee = await checkEmployeeExists(employeeId)

  if (!employee) {
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
    attendance
  })
}

export const createAttendance = async (req, res) => {
  const {
    employee_id,
    attendance_date,
    day_status = 'present',
    time_in,
    time_out,
    schedule_time_in = defaultSchedule.timeIn,
    schedule_time_out = defaultSchedule.timeOut,
    break_minutes = defaultSchedule.breakMinutes
  } = req.body

  if (!employee_id) {
    return res.status(400).json({
      message: 'Employee is required'
    })
  }

  if (!attendance_date) {
    return res.status(400).json({
      message: 'Attendance date is required'
    })
  }

  if (!allowedDayStatuses.includes(day_status)) {
    return res.status(400).json({
      message: 'Invalid day status'
    })
  }

  const employee = await checkEmployeeExists(employee_id)

  if (!employee) {
    return res.status(404).json({
      message: 'Employee not found'
    })
  }

  const finalDayStatus = await isEmployeeRestDay(employee_id, attendance_date)
    ? 'rest_day'
    : day_status

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
    attendanceDate: attendance_date
  })) {
    return res.status(409).json({
      message: duplicateAttendanceMessage
    })
  }

  const shouldClearTimes = finalDayStatus !== 'present'

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
      finalDayStatus,
      shouldClearTimes ? null : nullableValue(time_in),
      shouldClearTimes ? null : nullableValue(time_out),
      schedule_time_in || defaultSchedule.timeIn,
      schedule_time_out || defaultSchedule.timeOut,
      Number(break_minutes || defaultSchedule.breakMinutes)
    ]
  )

  await createAuditLog({
    userId: req.user.id,
    action: 'create',
    module: 'Attendance',
    description: `Created attendance for ${employee.full_name} on ${attendance_date}`,
    ipAddress: getClientIp(req)
  })

  res.status(201).json({
    message: 'Attendance created successfully',
    attendanceId: result.insertId
  })
}

export const createDefaultAttendance = async (req, res) => {
  const { employee_id } = req.body
  const today = getLocalDate()

  if (!employee_id) {
    return res.status(400).json({
      message: 'Employee is required'
    })
  }

  const employee = await checkEmployeeExists(employee_id)

  if (!employee) {
    return res.status(404).json({
      message: 'Employee not found'
    })
  }

  if (await hasDuplicateAttendance({
    employeeId: employee_id,
    attendanceDate: today
  })) {
    return res.status(409).json({
      message: duplicateAttendanceMessage
    })
  }

  const isRestDay = await isEmployeeRestDay(employee_id, today)
  const dayStatus = isRestDay ? 'rest_day' : 'present'

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
      today,
      dayStatus,
      isRestDay ? null : defaultSchedule.timeIn,
      isRestDay ? null : defaultSchedule.timeOut,
      defaultSchedule.timeIn,
      defaultSchedule.timeOut,
      defaultSchedule.breakMinutes
    ]
  )

  await createAuditLog({
    userId: req.user.id,
    action: 'create',
    module: 'Attendance',
    description: isRestDay
      ? `Created rest day attendance for ${employee.full_name} on ${today}`
      : `Created default attendance for ${employee.full_name} on ${today}`,
    ipAddress: getClientIp(req)
  })

  res.status(201).json({
    message: isRestDay
      ? 'Today is this employee rest day. Rest day attendance was recorded.'
      : 'Default attendance created successfully',
    attendanceId: result.insertId,
    dayStatus
  })
}

export const generateTodayAttendance = async (req, res) => {
  const today = getLocalDate()

  const result = await createMissingAttendanceForEmployees({
    attendanceDate: today,
    forceAbsent: true
  })

  await createAuditLog({
    userId: req.user.id,
    action: 'create',
    module: 'Attendance',
    description: `Generated today attendance for ${today}`,
    ipAddress: getClientIp(req)
  })

  res.status(200).json({
    message: 'Today attendance generation finished',
    date: today,
    ...result
  })
}

export const createBulkDefaultAttendance = async (req, res) => {
  const { employee_ids } = req.body
  const today = getLocalDate()

  if (!Array.isArray(employee_ids) || employee_ids.length === 0) {
    return res.status(400).json({
      message: 'Select at least one employee'
    })
  }

  const uniqueEmployeeIds = [...new Set(employee_ids.map(Number))].filter(Boolean)

  if (uniqueEmployeeIds.length === 0) {
    return res.status(400).json({
      message: 'Select at least one valid employee'
    })
  }

  const result = await createMissingAttendanceForEmployees({
    employeeIds: uniqueEmployeeIds,
    attendanceDate: today,
    forceAbsent: false
  })

  await createAuditLog({
    userId: req.user.id,
    action: 'create',
    module: 'Attendance',
    description: `Created quick attendance for ${uniqueEmployeeIds.length} employee(s) on ${today}`,
    ipAddress: getClientIp(req)
  })

  res.status(201).json({
    message: 'Quick attendance finished',
    date: today,
    ...result
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
    schedule_time_in = defaultSchedule.timeIn,
    schedule_time_out = defaultSchedule.timeOut,
    break_minutes = defaultSchedule.breakMinutes
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
      message: 'Attendance record not found'
    })
  }

  if (!employee_id) {
    return res.status(400).json({
      message: 'Employee is required'
    })
  }

  if (!attendance_date) {
    return res.status(400).json({
      message: 'Attendance date is required'
    })
  }

  if (!allowedDayStatuses.includes(day_status)) {
    return res.status(400).json({
      message: 'Invalid day status'
    })
  }

  const employee = await checkEmployeeExists(employee_id)

  if (!employee) {
    return res.status(404).json({
      message: 'Employee not found'
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

  const shouldClearTimes = day_status !== 'present'

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
      shouldClearTimes ? null : nullableValue(time_in),
      shouldClearTimes ? null : nullableValue(time_out),
      schedule_time_in || defaultSchedule.timeIn,
      schedule_time_out || defaultSchedule.timeOut,
      Number(break_minutes || defaultSchedule.breakMinutes),
      id
    ]
  )

  await createAuditLog({
    userId: req.user.id,
    action: 'update',
    module: 'Attendance',
    description: `Updated attendance ${id}`,
    ipAddress: getClientIp(req)
  })

  res.status(200).json({
    message: 'Attendance updated successfully'
  })
}

export const getEmployeeAttendanceSummary = async (req, res) => {
  const { employeeId } = req.params
  const { date_from, date_to } = req.query

  const employee = await checkEmployeeExists(employeeId)

  if (!employee) {
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

    if (record.day_status === 'absent') absentDays += 1
    if (record.day_status === 'rest_day') restDays += 1
    if (record.day_status === 'offset') offsetDays += 1

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
      late_hours: minutesToHours(lateMinutes)
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
        : 'Not a bonus candidate based on current attendance records.'
    },
    logs
  })
}
