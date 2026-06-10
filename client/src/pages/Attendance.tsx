import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  FiCalendar,
  FiClock,
  FiRefreshCcw,
  FiSearch,
  FiUserCheck,
  FiUsers,
} from "react-icons/fi"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1"

type Employee = {
  id: number
  full_name: string
  position: string | null
  monthly_salary: number | string
  status: string
  rest_days: string | null
  created_at: string
  updated_at: string
}

type AttendanceRecord = {
  id: number
  employee_id: number
  employee_name: string
  position: string | null
  attendance_date: string
  day_status: string
  time_in: string | null
  time_out: string | null
  schedule_time_in: string | null
  schedule_time_out: string | null
  break_minutes: number
  work_hours: number | null
  attendance_status: string
  created_at: string
  updated_at: string
}

type AttendanceFormData = {
  employee_id: number
  attendance_date: string
  day_status: string
  time_in: string
  time_out: string
  schedule_time_in: string
  schedule_time_out: string
  break_minutes: number
}

type AttendanceResponse = {
  attendance: AttendanceRecord[]
}

type EmployeesResponse = {
  employees: Employee[]
}

const getLocalDate = () => {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

const emptyFormData: AttendanceFormData = {
  employee_id: 0,
  attendance_date: getLocalDate(),
  day_status: "present",
  time_in: "09:00",
  time_out: "18:00",
  schedule_time_in: "09:00",
  schedule_time_out: "18:00",
  break_minutes: 60,
}

const getErrorMessage = async (response: Response) => {
  try {
    const data = await response.json()

    if (typeof data.message === "string") {
      return data.message
    }

    return "Request failed"
  } catch {
    return "Request failed"
  }
}

const fetchAttendance = async (): Promise<AttendanceRecord[]> => {
  const res = await fetch(`${API_URL}/attendance`, {
    credentials: "include",
  })

  if (!res.ok) {
    throw new Error(await getErrorMessage(res))
  }

  const data: AttendanceResponse = await res.json()
  return data.attendance
}

const fetchEmployees = async (): Promise<Employee[]> => {
  const res = await fetch(`${API_URL}/employees?status=active`, {
    credentials: "include",
  })

  if (!res.ok) {
    throw new Error(await getErrorMessage(res))
  }

  const data: EmployeesResponse = await res.json()
  return data.employees
}

const createAttendance = async (attendanceData: AttendanceFormData) => {
  const res = await fetch(`${API_URL}/attendance`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(attendanceData),
  })

  if (!res.ok) {
    throw new Error(await getErrorMessage(res))
  }

  return res.json()
}

const updateAttendance = async ({
  id,
  attendanceData,
}: {
  id: number
  attendanceData: AttendanceFormData
}) => {
  const res = await fetch(`${API_URL}/attendance/${id}`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(attendanceData),
  })

  if (!res.ok) {
    throw new Error(await getErrorMessage(res))
  }

  return res.json()
}

const createDefaultAttendance = async (employeeId: number) => {
  const res = await fetch(`${API_URL}/attendance/default`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      employee_id: employeeId,
    }),
  })

  if (!res.ok) {
    throw new Error(await getErrorMessage(res))
  }

  return res.json()
}

const generateTodayAttendance = async () => {
  const res = await fetch(`${API_URL}/attendance/generate-today`, {
    method: "POST",
    credentials: "include",
  })

  if (!res.ok) {
    throw new Error(await getErrorMessage(res))
  }

  return res.json()
}

const Attendance = () => {
  const queryClient = useQueryClient()

  const [searchInput, setSearchInput] = useState("")
  const [employeeFilter, setEmployeeFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("")
  const [dayStatusFilter, setDayStatusFilter] = useState("all")

  const [quickEmployeeId, setQuickEmployeeId] = useState(0)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editAttendance, setEditAttendance] =
    useState<AttendanceRecord | null>(null)
  const [formData, setFormData] = useState<AttendanceFormData>(emptyFormData)
  const [successMessage, setSuccessMessage] = useState("")

  const {
    data: attendance = [],
    isLoading,
    error,
  } = useQuery<AttendanceRecord[]>({
    queryKey: ["attendance"],
    queryFn: fetchAttendance,
  })

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["employees"],
    queryFn: fetchEmployees,
  })

  const createAttendanceMutation = useMutation({
    mutationFn: createAttendance,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] })
      queryClient.invalidateQueries({ queryKey: ["employees"] })
      setIsAddOpen(false)
      setFormData({
        ...emptyFormData,
        attendance_date: getLocalDate(),
      })
      setSuccessMessage(data.message || "Attendance created successfully")
    },
  })

  const updateAttendanceMutation = useMutation({
    mutationFn: updateAttendance,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] })
      queryClient.invalidateQueries({ queryKey: ["employees"] })
      setEditAttendance(null)
      setSuccessMessage(data.message || "Attendance updated successfully")
    },
  })

  const defaultAttendanceMutation = useMutation({
    mutationFn: createDefaultAttendance,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] })
      queryClient.invalidateQueries({ queryKey: ["employees"] })
      setSuccessMessage(data.message || "Default attendance created successfully")
    },
  })

  const generateTodayMutation = useMutation({
    mutationFn: generateTodayAttendance,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] })
      queryClient.invalidateQueries({ queryKey: ["employees"] })

      setSuccessMessage(
        `${data.message}. Rest days: ${data.createdRestDays}, absents: ${data.createdAbsents}, existing: ${data.skippedExisting}, before cutoff: ${data.skippedBeforeCutoff}.`
      )
    },
  })

  const activeEmployeeOptions = useMemo(() => {
    return employees.filter((employee) => employee.status === "active")
  }, [employees])

  const getFormEmployeeId = () => {
    return formData.employee_id || activeEmployeeOptions[0]?.id || 0
  }

  const resetForm = () => {
    setFormData({
      ...emptyFormData,
      attendance_date: getLocalDate(),
      employee_id: activeEmployeeOptions[0]?.id || 0,
    })
  }

  const openAddModal = () => {
    setFormData({
      ...emptyFormData,
      attendance_date: getLocalDate(),
      employee_id: activeEmployeeOptions[0]?.id || 0,
    })
    setIsAddOpen(true)
    setSuccessMessage("")
  }

  const formatDate = (date: string | null) => {
    if (!date) return "-"

    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date
    }

    const parsedDate = new Date(date)

    if (Number.isNaN(parsedDate.getTime())) {
      return String(date).slice(0, 10)
    }

    const year = parsedDate.getFullYear()
    const month = String(parsedDate.getMonth() + 1).padStart(2, "0")
    const day = String(parsedDate.getDate()).padStart(2, "0")

    return `${year}-${month}-${day}`
  }

  const formatTime = (time: string | null) => {
    if (!time) return "-"
    return String(time).slice(0, 5)
  }

  const formatStatus = (status: string) => {
    return status
      .replaceAll("_", " ")
      .split(" ")
      .map((word) => word[0]?.toUpperCase() + word.slice(1))
      .join(" ")
  }

  const formatWorkHours = (hours: number | null) => {
    if (hours === null || hours === undefined) return "-"

    const wholeHours = Math.floor(hours)
    const minutes = Math.round((hours - wholeHours) * 60)

    if (minutes === 0) return `${wholeHours}h`

    return `${wholeHours}h ${minutes}m`
  }

  const isNonWorkingStatus = (status: string) => {
    return status === "absent" || status === "rest_day" || status === "offset"
  }

  const resetFilters = () => {
    setSearchInput("")
    setEmployeeFilter("all")
    setDateFilter("")
    setDayStatusFilter("all")
  }

  const handleAddAttendance = (e: { preventDefault: () => void }) => {
    e.preventDefault()

    const payload = {
      ...formData,
      employee_id: getFormEmployeeId(),
      time_in: isNonWorkingStatus(formData.day_status) ? "" : formData.time_in,
      time_out: isNonWorkingStatus(formData.day_status) ? "" : formData.time_out,
    }

    createAttendanceMutation.mutate(payload)
  }

  const handleUpdateAttendance = (e: { preventDefault: () => void }) => {
    e.preventDefault()

    if (!editAttendance) return

    const payload: AttendanceFormData = {
      employee_id: editAttendance.employee_id,
      attendance_date: formatDate(editAttendance.attendance_date),
      day_status: editAttendance.day_status || "present",
      time_in: isNonWorkingStatus(editAttendance.day_status)
        ? ""
        : editAttendance.time_in
          ? formatTime(editAttendance.time_in)
          : "",
      time_out: isNonWorkingStatus(editAttendance.day_status)
        ? ""
        : editAttendance.time_out
          ? formatTime(editAttendance.time_out)
          : "",
      schedule_time_in: editAttendance.schedule_time_in
        ? formatTime(editAttendance.schedule_time_in)
        : "09:00",
      schedule_time_out: editAttendance.schedule_time_out
        ? formatTime(editAttendance.schedule_time_out)
        : "18:00",
      break_minutes: Number(editAttendance.break_minutes || 60),
    }

    updateAttendanceMutation.mutate({
      id: editAttendance.id,
      attendanceData: payload,
    })
  }

  const handleDefaultAttendance = () => {
    const employeeId = quickEmployeeId || activeEmployeeOptions[0]?.id || 0

    if (!employeeId) return

    defaultAttendanceMutation.mutate(employeeId)
  }

  const filteredAttendance = attendance.filter((record) => {
    const search = searchInput.toLowerCase().trim()

    const matchesSearch =
      search === "" ||
      record.employee_name.toLowerCase().includes(search) ||
      (record.position || "").toLowerCase().includes(search) ||
      formatDate(record.attendance_date).toLowerCase().includes(search) ||
      formatTime(record.time_in).toLowerCase().includes(search) ||
      formatTime(record.time_out).toLowerCase().includes(search) ||
      record.attendance_status.toLowerCase().includes(search) ||
      record.day_status.toLowerCase().includes(search)

    const matchesEmployee =
      employeeFilter === "all" || String(record.employee_id) === employeeFilter

    const matchesDate =
      dateFilter === "" || formatDate(record.attendance_date) === dateFilter

    const matchesDayStatus =
      dayStatusFilter === "all" || record.day_status === dayStatusFilter

    return matchesSearch && matchesEmployee && matchesDate && matchesDayStatus
  })

  const today = getLocalDate()
  const todayRecords = attendance.filter(
    (record) => formatDate(record.attendance_date) === today
  )

  const todayPresent = todayRecords.filter(
    (record) => record.day_status === "present"
  ).length

  const todayAbsent = todayRecords.filter(
    (record) => record.day_status === "absent"
  ).length

  const todayRestDays = todayRecords.filter(
    (record) => record.day_status === "rest_day"
  ).length

  const lateRecords = attendance.filter(
    (record) => record.attendance_status === "late"
  ).length

  const latestMutationError =
    createAttendanceMutation.error?.message ||
    updateAttendanceMutation.error?.message ||
    defaultAttendanceMutation.error?.message ||
    generateTodayMutation.error?.message ||
    ""

  if (isLoading) {
    return <p className="p-4">Loading attendance...</p>
  }

  if (error) {
    return <p className="p-4">Failed to load attendance</p>
  }

  return (
    <div className="p-4">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Attendance</h1>
          <p className="text-sm text-slate-500">
            Record employee attendance, rest days, absences, and default 9 AM to 6 PM attendance.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="w-fit rounded-lg border border-blue-600 bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Add Attendance
        </button>
      </div>

      {successMessage && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {successMessage}
        </div>
      )}

      {latestMutationError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {latestMutationError}
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-500">Today Present</p>
            <FiUserCheck className="text-blue-600" />
          </div>
          <h3 className="mt-2 text-2xl font-bold">{todayPresent}</h3>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-500">Today Absent</p>
            <FiUsers className="text-red-600" />
          </div>
          <h3 className="mt-2 text-2xl font-bold">{todayAbsent}</h3>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-500">Today Rest Days</p>
            <FiCalendar className="text-amber-600" />
          </div>
          <h3 className="mt-2 text-2xl font-bold">{todayRestDays}</h3>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-500">Late Records</p>
            <FiClock className="text-orange-600" />
          </div>
          <h3 className="mt-2 text-2xl font-bold">{lateRecords}</h3>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3">
          <h2 className="text-lg font-bold text-slate-900">Quick Attendance</h2>
          <p className="text-sm text-slate-500">
            Select an employee and save today’s default attendance. Rest days will be detected automatically.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto_auto]">
          <select
            value={quickEmployeeId || activeEmployeeOptions[0]?.id || 0}
            onChange={(e) => setQuickEmployeeId(Number(e.target.value))}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            {activeEmployeeOptions.length === 0 && (
              <option value={0}>No active employees</option>
            )}

            {activeEmployeeOptions.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.full_name}
              </option>
            ))}
          </select>

          <button
            onClick={handleDefaultAttendance}
            disabled={
              defaultAttendanceMutation.isPending ||
              activeEmployeeOptions.length === 0
            }
            className="rounded-lg border border-emerald-600 bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {defaultAttendanceMutation.isPending
              ? "Setting..."
              : "Set Default Attendance"}
          </button>

          <button
            onClick={() => generateTodayMutation.mutate()}
            disabled={generateTodayMutation.isPending}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            <FiRefreshCcw />
            {generateTodayMutation.isPending
              ? "Generating..."
              : "Generate Today Attendance"}
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-2 md:flex-row">
        <div className="relative md:w-96">
          <FiSearch className="pointer-events-none absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search employee, position, date, time, status..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm"
          />
        </div>

        <select
          value={employeeFilter}
          onChange={(e) => setEmployeeFilter(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
        >
          <option value="all">All Employees</option>
          {employees.map((employee) => (
            <option key={employee.id} value={employee.id}>
              {employee.full_name}
            </option>
          ))}
        </select>

        <select
          value={dayStatusFilter}
          onChange={(e) => setDayStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
        >
          <option value="all">All Day Status</option>
          <option value="present">Present</option>
          <option value="absent">Absent</option>
          <option value="rest_day">Rest Day</option>
          <option value="offset">Offset</option>
        </select>

        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />

        <button
          onClick={resetFilters}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50"
        >
          Reset
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="border-b border-slate-200">
                <th className="px-4 py-3 text-left">Employee</th>
                <th className="px-4 py-3 text-left">Position</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Day Status</th>
                <th className="px-4 py-3 text-left">Time In</th>
                <th className="px-4 py-3 text-left">Time Out</th>
                <th className="px-4 py-3 text-left">Schedule</th>
                <th className="px-4 py-3 text-left">Break</th>
                <th className="px-4 py-3 text-left">Work Hours</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredAttendance.map((record) => (
                <tr key={record.id} className="border-b border-slate-100">
                  <td className="px-4 py-3 font-medium">{record.employee_name}</td>
                  <td className="px-4 py-3">{record.position || "-"}</td>
                  <td className="px-4 py-3">{formatDate(record.attendance_date)}</td>
                  <td className="px-4 py-3">{formatStatus(record.day_status)}</td>
                  <td className="px-4 py-3">{formatTime(record.time_in)}</td>
                  <td className="px-4 py-3">{formatTime(record.time_out)}</td>
                  <td className="px-4 py-3">
                    {formatTime(record.schedule_time_in)} - {formatTime(record.schedule_time_out)}
                  </td>
                  <td className="px-4 py-3">{record.break_minutes} mins</td>
                  <td className="px-4 py-3">{formatWorkHours(record.work_hours)}</td>
                  <td className="px-4 py-3">{formatStatus(record.attendance_status)}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setEditAttendance(record)}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold hover:bg-slate-50"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}

              {filteredAttendance.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-slate-500">
                    No attendance records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isAddOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-5 shadow-xl">
            <h2 className="mb-4 text-xl font-bold">Add Attendance</h2>

            <form onSubmit={handleAddAttendance} className="flex flex-col gap-3">
              <select
                value={getFormEmployeeId()}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    employee_id: Number(e.target.value),
                  })
                }
                className="rounded-lg border border-slate-200 px-3 py-2"
                required
              >
                {activeEmployeeOptions.length === 0 && (
                  <option value={0}>No active employees available</option>
                )}

                {activeEmployeeOptions.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.full_name}
                  </option>
                ))}
              </select>

              <input
                type="date"
                value={formData.attendance_date}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    attendance_date: e.target.value,
                  })
                }
                className="rounded-lg border border-slate-200 px-3 py-2"
                required
              />

              <select
                value={formData.day_status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    day_status: e.target.value,
                  })
                }
                className="rounded-lg border border-slate-200 px-3 py-2"
              >
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="rest_day">Rest Day</option>
                <option value="offset">Offset</option>
              </select>

              {!isNonWorkingStatus(formData.day_status) && (
                <>
                  <input
                    type="time"
                    value={formData.time_in}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        time_in: e.target.value,
                      })
                    }
                    className="rounded-lg border border-slate-200 px-3 py-2"
                  />

                  <input
                    type="time"
                    value={formData.time_out}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        time_out: e.target.value,
                      })
                    }
                    className="rounded-lg border border-slate-200 px-3 py-2"
                  />
                </>
              )}

              <input
                type="time"
                value={formData.schedule_time_in}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    schedule_time_in: e.target.value,
                  })
                }
                className="rounded-lg border border-slate-200 px-3 py-2"
              />

              <input
                type="time"
                value={formData.schedule_time_out}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    schedule_time_out: e.target.value,
                  })
                }
                className="rounded-lg border border-slate-200 px-3 py-2"
              />

              <input
                type="number"
                min={0}
                placeholder="Break minutes"
                value={formData.break_minutes}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    break_minutes: Number(e.target.value),
                  })
                }
                className="rounded-lg border border-slate-200 px-3 py-2"
              />

              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    resetForm()
                    setIsAddOpen(false)
                  }}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    createAttendanceMutation.isPending ||
                    activeEmployeeOptions.length === 0
                  }
                  className="rounded-lg border border-blue-600 bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {createAttendanceMutation.isPending
                    ? "Saving..."
                    : "Save Attendance"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editAttendance && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-5 shadow-xl">
            <h2 className="mb-4 text-xl font-bold">Edit Attendance</h2>

            <form
              onSubmit={handleUpdateAttendance}
              className="flex flex-col gap-3"
            >
              <select
                value={editAttendance.employee_id}
                onChange={(e) =>
                  setEditAttendance({
                    ...editAttendance,
                    employee_id: Number(e.target.value),
                  })
                }
                className="rounded-lg border border-slate-200 px-3 py-2"
                required
              >
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.full_name}
                  </option>
                ))}
              </select>

              <input
                type="date"
                value={formatDate(editAttendance.attendance_date)}
                onChange={(e) =>
                  setEditAttendance({
                    ...editAttendance,
                    attendance_date: e.target.value,
                  })
                }
                className="rounded-lg border border-slate-200 px-3 py-2"
                required
              />

              <select
                value={editAttendance.day_status || "present"}
                onChange={(e) =>
                  setEditAttendance({
                    ...editAttendance,
                    day_status: e.target.value,
                  })
                }
                className="rounded-lg border border-slate-200 px-3 py-2"
              >
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="rest_day">Rest Day</option>
                <option value="offset">Offset</option>
              </select>

              {!isNonWorkingStatus(editAttendance.day_status) && (
                <>
                  <input
                    type="time"
                    value={
                      editAttendance.time_in
                        ? formatTime(editAttendance.time_in)
                        : ""
                    }
                    onChange={(e) =>
                      setEditAttendance({
                        ...editAttendance,
                        time_in: e.target.value,
                      })
                    }
                    className="rounded-lg border border-slate-200 px-3 py-2"
                  />

                  <input
                    type="time"
                    value={
                      editAttendance.time_out
                        ? formatTime(editAttendance.time_out)
                        : ""
                    }
                    onChange={(e) =>
                      setEditAttendance({
                        ...editAttendance,
                        time_out: e.target.value,
                      })
                    }
                    className="rounded-lg border border-slate-200 px-3 py-2"
                  />
                </>
              )}

              <input
                type="time"
                value={
                  editAttendance.schedule_time_in
                    ? formatTime(editAttendance.schedule_time_in)
                    : "09:00"
                }
                onChange={(e) =>
                  setEditAttendance({
                    ...editAttendance,
                    schedule_time_in: e.target.value,
                  })
                }
                className="rounded-lg border border-slate-200 px-3 py-2"
              />

              <input
                type="time"
                value={
                  editAttendance.schedule_time_out
                    ? formatTime(editAttendance.schedule_time_out)
                    : "18:00"
                }
                onChange={(e) =>
                  setEditAttendance({
                    ...editAttendance,
                    schedule_time_out: e.target.value,
                  })
                }
                className="rounded-lg border border-slate-200 px-3 py-2"
              />

              <input
                type="number"
                min={0}
                value={Number(editAttendance.break_minutes || 60)}
                onChange={(e) =>
                  setEditAttendance({
                    ...editAttendance,
                    break_minutes: Number(e.target.value),
                  })
                }
                className="rounded-lg border border-slate-200 px-3 py-2"
              />

              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditAttendance(null)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={updateAttendanceMutation.isPending}
                  className="rounded-lg border border-blue-600 bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {updateAttendanceMutation.isPending
                    ? "Saving..."
                    : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Attendance
