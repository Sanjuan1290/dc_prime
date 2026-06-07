import { useState, type FormEvent } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

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
  day_status: "present" | "absent" | "rest_day" | "offset" | string
  time_in: string | null
  time_out: string | null
  schedule_time_in: string | null
  schedule_time_out: string | null
  break_minutes: number
  work_hours: number | null
  attendance_status: "no_time_in" | "late" | "on_time" | "absent" | "rest_day" | "offset" | string
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

const today = getLocalDate()

const emptyFormData: AttendanceFormData = {
  employee_id: 0,
  attendance_date: today,
  day_status: "present",
  time_in: "",
  time_out: "",
  schedule_time_in: "08:00",
  schedule_time_out: "17:00",
  break_minutes: 60,
}

const getErrorMessage = async (response: Response) => {
  try {
    const data = await response.json()

    if (typeof data.message === "string") {
      return data.message
    }

    return "Something went wrong"
  } catch {
    return "Something went wrong"
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

const Attendance = () => {
  const queryClient = useQueryClient()

  const [searchInput, setSearchInput] = useState("")
  const [employeeFilter, setEmployeeFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("")

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editAttendance, setEditAttendance] =
    useState<AttendanceRecord | null>(null)
  const [formData, setFormData] = useState<AttendanceFormData>(emptyFormData)

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] })
      queryClient.invalidateQueries({ queryKey: ["employees"] })
      setIsAddOpen(false)
      setFormData({
        ...emptyFormData,
        attendance_date: getLocalDate(),
      })
    },
  })

  const updateAttendanceMutation = useMutation({
    mutationFn: updateAttendance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] })
      queryClient.invalidateQueries({ queryKey: ["employees"] })
      setEditAttendance(null)
    },
  })

  const getFormEmployeeId = () => {
    return formData.employee_id || employees[0]?.id || 0
  }

  const resetForm = () => {
    setFormData({
      ...emptyFormData,
      attendance_date: getLocalDate(),
      employee_id: employees[0]?.id || 0,
    })
  }

  const openAddModal = () => {
    setFormData({
      ...emptyFormData,
      attendance_date: getLocalDate(),
      employee_id: employees[0]?.id || 0,
    })
    setIsAddOpen(true)
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

  const handleAddAttendance = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const payload = {
      ...formData,
      employee_id: getFormEmployeeId(),
      time_in: isNonWorkingStatus(formData.day_status) ? "" : formData.time_in,
      time_out: isNonWorkingStatus(formData.day_status) ? "" : formData.time_out,
    }

    createAttendanceMutation.mutate(payload)
  }

  const handleUpdateAttendance = (e: FormEvent<HTMLFormElement>) => {
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
        : "",
      schedule_time_out: editAttendance.schedule_time_out
        ? formatTime(editAttendance.schedule_time_out)
        : "",
      break_minutes: Number(editAttendance.break_minutes || 0),
    }

    updateAttendanceMutation.mutate({
      id: editAttendance.id,
      attendanceData: payload,
    })
  }

  const resetFilters = () => {
    setSearchInput("")
    setEmployeeFilter("all")
    setDateFilter("")
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

    return matchesSearch && matchesEmployee && matchesDate
  })

  if (isLoading) {
    return <p className="p-4">Loading attendance...</p>
  }

  if (error) {
    return <p className="p-4">Failed to load attendance</p>
  }

  return (
    <div className="p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Attendance</h1>
        <p className="text-sm text-gray-600">
          Record employee time in, time out, and attendance date
        </p>
      </div>

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <button
          onClick={openAddModal}
          className="w-fit border border-black px-4 py-2 hover:bg-gray-200"
        >
          Add Attendance
        </button>

        <div className="flex flex-col gap-2 md:flex-row">
          <input
            type="text"
            placeholder="Search employee, position, date, time, status..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="border border-black px-3 py-2 md:w-96"
          />

          <select
            value={employeeFilter}
            onChange={(e) => setEmployeeFilter(e.target.value)}
            className="border border-black px-3 py-2"
          >
            <option value="all">All Employees</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.full_name}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="border border-black px-3 py-2"
          />

          <button
            onClick={resetFilters}
            className="border border-black px-4 py-2 hover:bg-gray-200"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border border-black text-sm">
          <thead>
            <tr className="border-b border-black">
              <th className="border-r border-black px-4 py-2 text-left">
                Employee ↕
              </th>
              <th className="border-r border-black px-4 py-2 text-left">
                Position ↕
              </th>
              <th className="border-r border-black px-4 py-2 text-left">
                Date ↕
              </th>
              <th className="border-r border-black px-4 py-2 text-left">
                Day Status ↕
              </th>
              <th className="border-r border-black px-4 py-2 text-left">
                Time In ↕
              </th>
              <th className="border-r border-black px-4 py-2 text-left">
                Time Out ↕
              </th>
              <th className="border-r border-black px-4 py-2 text-left">
                Schedule In ↕
              </th>
              <th className="border-r border-black px-4 py-2 text-left">
                Schedule Out ↕
              </th>
              <th className="border-r border-black px-4 py-2 text-left">
                Break ↕
              </th>
              <th className="border-r border-black px-4 py-2 text-left">
                Work Hours ↕
              </th>
              <th className="border-r border-black px-4 py-2 text-left">
                Status ↕
              </th>
              <th className="px-4 py-2 text-left">Actions ↕</th>
            </tr>
          </thead>

          <tbody>
            {filteredAttendance.map((record) => (
              <tr key={record.id} className="border-b border-black">
                <td className="border-r border-black px-4 py-2">
                  {record.employee_name}
                </td>

                <td className="border-r border-black px-4 py-2">
                  {record.position || "-"}
                </td>

                <td className="border-r border-black px-4 py-2">
                  {formatDate(record.attendance_date)}
                </td>

                <td className="border-r border-black px-4 py-2">
                  {formatStatus(record.day_status)}
                </td>

                <td className="border-r border-black px-4 py-2">
                  {formatTime(record.time_in)}
                </td>

                <td className="border-r border-black px-4 py-2">
                  {formatTime(record.time_out)}
                </td>

                <td className="border-r border-black px-4 py-2">
                  {formatTime(record.schedule_time_in)}
                </td>

                <td className="border-r border-black px-4 py-2">
                  {formatTime(record.schedule_time_out)}
                </td>

                <td className="border-r border-black px-4 py-2">
                  {record.break_minutes} mins
                </td>

                <td className="border-r border-black px-4 py-2">
                  {formatWorkHours(record.work_hours)}
                </td>

                <td className="border-r border-black px-4 py-2">
                  {formatStatus(record.attendance_status)}
                </td>

                <td className="px-4 py-2">
                  <button
                    onClick={() => setEditAttendance(record)}
                    className="border border-black px-3 py-1 hover:bg-gray-200"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}

            {filteredAttendance.length === 0 && (
              <tr>
                <td colSpan={12} className="px-4 py-6 text-center text-gray-600">
                  No attendance records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isAddOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg border border-black bg-white p-4">
            <h2 className="mb-4 text-2xl font-bold">Add Attendance</h2>

            <form onSubmit={handleAddAttendance} className="flex flex-col gap-3">
              <select
                value={getFormEmployeeId()}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    employee_id: Number(e.target.value),
                  })
                }
                className="border border-black px-3 py-2"
                required
              >
                {employees.length === 0 && (
                  <option value={0}>No active employees available</option>
                )}

                {employees.map((employee) => (
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
                className="border border-black px-3 py-2"
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
                className="border border-black px-3 py-2"
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
                    className="border border-black px-3 py-2"
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
                    className="border border-black px-3 py-2"
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
                className="border border-black px-3 py-2"
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
                className="border border-black px-3 py-2"
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
                className="border border-black px-3 py-2"
              />

              {createAttendanceMutation.isError && (
                <p className="border border-black px-4 py-2 text-red-600">
                  {createAttendanceMutation.error.message}
                </p>
              )}

              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    resetForm()
                    setIsAddOpen(false)
                  }}
                  className="border border-black px-4 py-2 hover:bg-gray-200"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    createAttendanceMutation.isPending || employees.length === 0
                  }
                  className="border border-black px-4 py-2 hover:bg-gray-200 disabled:opacity-50"
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
          <div className="w-full max-w-lg border border-black bg-white p-4">
            <h2 className="mb-4 text-2xl font-bold">Edit Attendance</h2>

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
                className="border border-black px-3 py-2"
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
                className="border border-black px-3 py-2"
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
                className="border border-black px-3 py-2"
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
                    className="border border-black px-3 py-2"
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
                    className="border border-black px-3 py-2"
                  />
                </>
              )}

              <input
                type="time"
                value={
                  editAttendance.schedule_time_in
                    ? formatTime(editAttendance.schedule_time_in)
                    : ""
                }
                onChange={(e) =>
                  setEditAttendance({
                    ...editAttendance,
                    schedule_time_in: e.target.value,
                  })
                }
                className="border border-black px-3 py-2"
              />

              <input
                type="time"
                value={
                  editAttendance.schedule_time_out
                    ? formatTime(editAttendance.schedule_time_out)
                    : ""
                }
                onChange={(e) =>
                  setEditAttendance({
                    ...editAttendance,
                    schedule_time_out: e.target.value,
                  })
                }
                className="border border-black px-3 py-2"
              />

              <input
                type="number"
                min={0}
                value={Number(editAttendance.break_minutes || 0)}
                onChange={(e) =>
                  setEditAttendance({
                    ...editAttendance,
                    break_minutes: Number(e.target.value),
                  })
                }
                className="border border-black px-3 py-2"
              />

              {updateAttendanceMutation.isError && (
                <p className="border border-black px-4 py-2 text-red-600">
                  {updateAttendanceMutation.error.message}
                </p>
              )}

              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditAttendance(null)}
                  className="border border-black px-4 py-2 hover:bg-gray-200"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={updateAttendanceMutation.isPending}
                  className="border border-black px-4 py-2 hover:bg-gray-200 disabled:opacity-50"
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