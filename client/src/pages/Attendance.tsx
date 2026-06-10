import { useMemo, useState, type ReactNode } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  FiCalendar,
  FiCheckSquare,
  FiClock,
  FiRefreshCcw,
  FiSearch,
  FiUserCheck,
  FiUsers,
} from "react-icons/fi"
import Pagination from "../components/ui/Pagination"
import { paginateRows } from "../utils/pagination"

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
  return data.attendance || []
}

const fetchEmployees = async (): Promise<Employee[]> => {
  const res = await fetch(`${API_URL}/employees?status=active`, {
    credentials: "include",
  })

  if (!res.ok) {
    throw new Error(await getErrorMessage(res))
  }

  const data: EmployeesResponse = await res.json()
  return data.employees || []
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

const createBulkDefaultAttendance = async (employeeIds: number[]) => {
  const res = await fetch(`${API_URL}/attendance/default/bulk`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      employee_ids: employeeIds,
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
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const [quickEmployeeSearch, setQuickEmployeeSearch] = useState("")
  const [quickEmployeeId, setQuickEmployeeId] = useState(0)
  const [selectedQuickEmployeeIds, setSelectedQuickEmployeeIds] = useState<number[]>([])

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

  const bulkDefaultAttendanceMutation = useMutation({
    mutationFn: createBulkDefaultAttendance,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] })
      queryClient.invalidateQueries({ queryKey: ["employees"] })
      setSelectedQuickEmployeeIds([])
      setSuccessMessage(
        `${data.message || "Quick attendance finished"}. Present: ${data.createdPresent || 0}, rest days: ${data.createdRestDays || 0}, absents: ${data.createdAbsents || 0}, existing: ${data.skippedExisting || 0}.`
      )
    },
  })

  const generateTodayMutation = useMutation({
    mutationFn: generateTodayAttendance,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] })
      queryClient.invalidateQueries({ queryKey: ["employees"] })

      setSuccessMessage(
        `${data.message}. Rest days: ${data.createdRestDays || 0}, absents: ${data.createdAbsents || 0}, existing: ${data.skippedExisting || 0}.`
      )
    },
  })

  const activeEmployeeOptions = useMemo(() => {
    return employees.filter((employee) => employee.status === "active")
  }, [employees])

  const quickEmployeeOptions = useMemo(() => {
    const search = quickEmployeeSearch.toLowerCase().trim()

    if (!search) return activeEmployeeOptions

    return activeEmployeeOptions.filter((employee) => {
      return (
        employee.full_name.toLowerCase().includes(search) ||
        (employee.position || "").toLowerCase().includes(search)
      )
    })
  }, [activeEmployeeOptions, quickEmployeeSearch])

  const getFormEmployeeId = () => {
    return formData.employee_id || activeEmployeeOptions[0]?.id || 0
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
    setPage(1)
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
    const employeeId = quickEmployeeId || quickEmployeeOptions[0]?.id || 0

    if (!employeeId) return

    defaultAttendanceMutation.mutate(employeeId)
  }

  const toggleQuickEmployee = (employeeId: number) => {
    setSelectedQuickEmployeeIds((current) => {
      if (current.includes(employeeId)) {
        return current.filter((id) => id !== employeeId)
      }

      return [...current, employeeId]
    })
  }

  const selectAllFilteredQuickEmployees = () => {
    setSelectedQuickEmployeeIds(quickEmployeeOptions.map((employee) => employee.id))
  }

  const clearQuickEmployees = () => {
    setSelectedQuickEmployeeIds([])
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

  const paginatedAttendance = paginateRows(
    filteredAttendance,
    page,
    rowsPerPage
  )

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
    bulkDefaultAttendanceMutation.error?.message ||
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
            Record attendance, auto-mark absences after 6 PM, and edit records if admin needs to correct them.
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
        <SummaryCard icon={<FiUserCheck className="text-blue-600" />} label="Today Present" value={todayPresent} />
        <SummaryCard icon={<FiUsers className="text-red-600" />} label="Today Absent" value={todayAbsent} />
        <SummaryCard icon={<FiCalendar className="text-amber-600" />} label="Today Rest Days" value={todayRestDays} />
        <SummaryCard icon={<FiClock className="text-orange-600" />} label="Late Records" value={lateRecords} />
      </div>

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Quick Attendance</h2>
            <p className="text-sm text-slate-500">
              Search employees, select one or many, then save today’s default 9 AM to 6 PM attendance in one click. After 6 PM, missing employees are auto-marked absent.
            </p>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
            Auto absent runs after 6:00 PM when attendance loads or Generate Today is clicked.
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1fr_1fr_auto_auto]">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">
              Search Employee for Quick Attendance
            </span>
            <div className="relative">
              <FiSearch className="pointer-events-none absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search name or position"
                value={quickEmployeeSearch}
                onChange={(e) => setQuickEmployeeSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm"
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">
              Single Employee Quick Attendance
            </span>
            <select
              value={quickEmployeeId || quickEmployeeOptions[0]?.id || 0}
              onChange={(e) => setQuickEmployeeId(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              {quickEmployeeOptions.length === 0 && (
                <option value={0}>No matching active employees</option>
              )}

              {quickEmployeeOptions.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.full_name} {employee.position ? `— ${employee.position}` : ""}
                </option>
              ))}
            </select>
          </label>

          <button
            onClick={handleDefaultAttendance}
            disabled={
              defaultAttendanceMutation.isPending ||
              quickEmployeeOptions.length === 0
            }
            className="mt-6 rounded-lg border border-emerald-600 bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {defaultAttendanceMutation.isPending
              ? "Setting..."
              : "Set One Employee"}
          </button>

          <button
            onClick={() => generateTodayMutation.mutate()}
            disabled={generateTodayMutation.isPending}
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            <FiRefreshCcw />
            {generateTodayMutation.isPending
              ? "Generating..."
              : "Generate Today"}
          </button>
        </div>

        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-bold text-slate-900">
                Multi-Employee Quick Attendance
              </p>
              <p className="text-xs text-slate-500">
                Selected: {selectedQuickEmployeeIds.length} employee(s)
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={selectAllFilteredQuickEmployees}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Select Filtered
              </button>
              <button
                type="button"
                onClick={clearQuickEmployees}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => bulkDefaultAttendanceMutation.mutate(selectedQuickEmployeeIds)}
                disabled={
                  selectedQuickEmployeeIds.length === 0 ||
                  bulkDefaultAttendanceMutation.isPending
                }
                className="inline-flex items-center gap-2 rounded-lg border border-blue-600 bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                <FiCheckSquare />
                {bulkDefaultAttendanceMutation.isPending
                  ? "Saving..."
                  : "Set Selected"}
              </button>
            </div>
          </div>

          <div className="grid max-h-52 grid-cols-1 gap-2 overflow-y-auto md:grid-cols-2 xl:grid-cols-3">
            {quickEmployeeOptions.map((employee) => (
              <label
                key={employee.id}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  checked={selectedQuickEmployeeIds.includes(employee.id)}
                  onChange={() => toggleQuickEmployee(employee.id)}
                />
                <span>
                  <span className="font-semibold text-slate-900">
                    {employee.full_name}
                  </span>
                  <span className="block text-xs text-slate-500">
                    {employee.position || "No position"}
                  </span>
                </span>
              </label>
            ))}

            {quickEmployeeOptions.length === 0 ? (
              <p className="text-sm text-slate-500">No employees found.</p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-2 md:grid-cols-[1fr_220px_190px_170px_auto]">
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-slate-700">
            Search Attendance
          </span>
          <div className="relative">
            <FiSearch className="pointer-events-none absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search employee, position, date, time, status"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value)
                setPage(1)
              }}
              className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm"
            />
          </div>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-slate-700">
            Employee Filter
          </span>
          <select
            value={employeeFilter}
            onChange={(e) => {
              setEmployeeFilter(e.target.value)
              setPage(1)
            }}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="all">All Employees</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.full_name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-slate-700">
            Day Status Filter
          </span>
          <select
            value={dayStatusFilter}
            onChange={(e) => {
              setDayStatusFilter(e.target.value)
              setPage(1)
            }}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="all">All Day Status</option>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="rest_day">Rest Day</option>
            <option value="offset">Offset</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-slate-700">
            Date Filter
          </span>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value)
              setPage(1)
            }}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </label>

        <button
          onClick={resetFilters}
          className="mt-6 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50"
        >
          Reset
        </button>
      </div>

      <div className="overflow-hidden rounded-t-xl border border-slate-200 bg-white shadow-sm">
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
              {paginatedAttendance.map((record) => (
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

              {paginatedAttendance.length === 0 && (
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

      <Pagination
        page={page}
        rowsPerPage={rowsPerPage}
        totalRows={filteredAttendance.length}
        onPageChange={setPage}
        onRowsPerPageChange={setRowsPerPage}
      />

      {isAddOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-5 shadow-xl">
            <h2 className="mb-4 text-xl font-bold">Add Attendance</h2>

            <form onSubmit={handleAddAttendance} className="flex flex-col gap-3">
              <AttendanceFormFields
                activeEmployeeOptions={activeEmployeeOptions}
                formData={formData}
                getFormEmployeeId={getFormEmployeeId}
                isNonWorkingStatus={isNonWorkingStatus}
                setFormData={setFormData}
              />

              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={createAttendanceMutation.isPending}
                  className="rounded-lg border border-blue-600 bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {createAttendanceMutation.isPending ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editAttendance && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-5 shadow-xl">
            <h2 className="mb-4 text-xl font-bold">Edit Attendance</h2>

            <form onSubmit={handleUpdateAttendance} className="flex flex-col gap-3">
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Employee
                </span>
                <input
                  value={editAttendance.employee_name}
                  disabled
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Attendance Date
                </span>
                <input
                  type="date"
                  value={formatDate(editAttendance.attendance_date)}
                  onChange={(e) =>
                    setEditAttendance({
                      ...editAttendance,
                      attendance_date: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Day Status
                </span>
                <select
                  value={editAttendance.day_status}
                  onChange={(e) =>
                    setEditAttendance({
                      ...editAttendance,
                      day_status: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2"
                >
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="rest_day">Rest Day</option>
                  <option value="offset">Offset</option>
                </select>
              </label>

              {!isNonWorkingStatus(editAttendance.day_status) && (
                <>
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Time In
                    </span>
                    <input
                      type="time"
                      value={editAttendance.time_in ? formatTime(editAttendance.time_in) : ""}
                      onChange={(e) =>
                        setEditAttendance({
                          ...editAttendance,
                          time_in: e.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-slate-200 px-3 py-2"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Time Out
                    </span>
                    <input
                      type="time"
                      value={editAttendance.time_out ? formatTime(editAttendance.time_out) : ""}
                      onChange={(e) =>
                        setEditAttendance({
                          ...editAttendance,
                          time_out: e.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-slate-200 px-3 py-2"
                    />
                  </label>
                </>
              )}

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Schedule Time In
                  </span>
                  <input
                    type="time"
                    value={editAttendance.schedule_time_in ? formatTime(editAttendance.schedule_time_in) : "09:00"}
                    onChange={(e) =>
                      setEditAttendance({
                        ...editAttendance,
                        schedule_time_in: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Schedule Time Out
                  </span>
                  <input
                    type="time"
                    value={editAttendance.schedule_time_out ? formatTime(editAttendance.schedule_time_out) : "18:00"}
                    onChange={(e) =>
                      setEditAttendance({
                        ...editAttendance,
                        schedule_time_out: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Break Minutes
                  </span>
                  <input
                    type="number"
                    value={editAttendance.break_minutes}
                    onChange={(e) =>
                      setEditAttendance({
                        ...editAttendance,
                        break_minutes: Number(e.target.value),
                      })
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2"
                  />
                </label>
              </div>

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
                  {updateAttendanceMutation.isPending ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

type SummaryCardProps = {
  icon: ReactNode
  label: string
  value: number
}

const SummaryCard = ({ icon, label, value }: SummaryCardProps) => {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-500">{label}</p>
        {icon}
      </div>
      <h3 className="mt-2 text-2xl font-bold">{value}</h3>
    </div>
  )
}

type AttendanceFormFieldsProps = {
  activeEmployeeOptions: Employee[]
  formData: AttendanceFormData
  getFormEmployeeId: () => number
  isNonWorkingStatus: (status: string) => boolean
  setFormData: (data: AttendanceFormData) => void
}

const AttendanceFormFields = ({
  activeEmployeeOptions,
  formData,
  getFormEmployeeId,
  isNonWorkingStatus,
  setFormData,
}: AttendanceFormFieldsProps) => {
  return (
    <>
      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-slate-700">
          Employee
        </span>
        <select
          value={getFormEmployeeId()}
          onChange={(e) =>
            setFormData({
              ...formData,
              employee_id: Number(e.target.value),
            })
          }
          className="w-full rounded-lg border border-slate-200 px-3 py-2"
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
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-slate-700">
          Attendance Date
        </span>
        <input
          type="date"
          value={formData.attendance_date}
          onChange={(e) =>
            setFormData({
              ...formData,
              attendance_date: e.target.value,
            })
          }
          className="w-full rounded-lg border border-slate-200 px-3 py-2"
          required
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-slate-700">
          Day Status
        </span>
        <select
          value={formData.day_status}
          onChange={(e) =>
            setFormData({
              ...formData,
              day_status: e.target.value,
            })
          }
          className="w-full rounded-lg border border-slate-200 px-3 py-2"
        >
          <option value="present">Present</option>
          <option value="absent">Absent</option>
          <option value="rest_day">Rest Day</option>
          <option value="offset">Offset</option>
        </select>
      </label>

      {!isNonWorkingStatus(formData.day_status) && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">
              Time In
            </span>
            <input
              type="time"
              value={formData.time_in}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  time_in: e.target.value,
                })
              }
              className="w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">
              Time Out
            </span>
            <input
              type="time"
              value={formData.time_out}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  time_out: e.target.value,
                })
              }
              className="w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-slate-700">
            Schedule Time In
          </span>
          <input
            type="time"
            value={formData.schedule_time_in}
            onChange={(e) =>
              setFormData({
                ...formData,
                schedule_time_in: e.target.value,
              })
            }
            className="w-full rounded-lg border border-slate-200 px-3 py-2"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-slate-700">
            Schedule Time Out
          </span>
          <input
            type="time"
            value={formData.schedule_time_out}
            onChange={(e) =>
              setFormData({
                ...formData,
                schedule_time_out: e.target.value,
              })
            }
            className="w-full rounded-lg border border-slate-200 px-3 py-2"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-slate-700">
            Break Minutes
          </span>
          <input
            type="number"
            value={formData.break_minutes}
            onChange={(e) =>
              setFormData({
                ...formData,
                break_minutes: Number(e.target.value),
              })
            }
            className="w-full rounded-lg border border-slate-200 px-3 py-2"
          />
        </label>
      </div>
    </>
  )
}

export default Attendance
