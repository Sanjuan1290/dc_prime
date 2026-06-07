import { useMemo, useState, type FormEvent } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  FiCalendar,
  FiEdit2,
  FiPlus,
  FiRefreshCw,
  FiSearch,
} from "react-icons/fi"
import Alert from "../components/ui/Alert"
import Button from "../components/ui/Button"
import EmptyState from "../components/ui/EmptyState"
import Input from "../components/ui/Input"
import LoadingState from "../components/ui/LoadingState"
import Modal from "../components/ui/Modal"
import PageHeader from "../components/ui/PageHeader"
import Pagination from "../components/ui/Pagination"
import Select from "../components/ui/Select"
import StatCard from "../components/ui/StatCard"
import StatusBadge from "../components/ui/StatusBadge"
import TableContainer from "../components/ui/TableContainer"
import { API_URL, getErrorMessage } from "../utils/api"
import { formatDate, formatNumber, formatTime, getLocalDate } from "../utils/formatters"
import { paginateRows } from "../utils/pagination"

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
  attendance_status:
    | "no_time_in"
    | "late"
    | "on_time"
    | "absent"
    | "rest_day"
    | "offset"
    | string
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

const emptyFormData: AttendanceFormData = {
  employee_id: 0,
  attendance_date: getLocalDate(),
  day_status: "present",
  time_in: "",
  time_out: "",
  schedule_time_in: "08:00",
  schedule_time_out: "17:00",
  break_minutes: 60,
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

const isNonWorkingStatus = (status: string) => {
  return status === "absent" || status === "rest_day" || status === "offset"
}

const getWorkHoursLabel = (hours: number | null) => {
  if (hours === null || hours === undefined) return "-"

  const wholeHours = Math.floor(hours)
  const minutes = Math.round((hours - wholeHours) * 60)

  if (minutes === 0) return `${wholeHours}h`

  return `${wholeHours}h ${minutes}m`
}

const Attendance = () => {
  const queryClient = useQueryClient()

  const [searchInput, setSearchInput] = useState("")
  const [employeeFilter, setEmployeeFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("")
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)

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
    queryKey: ["employees", "active"],
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
    resetForm()
    setIsAddOpen(true)
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
    setPage(1)
  }

  const filteredAttendance = useMemo(() => {
    return attendance.filter((record) => {
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
  }, [attendance, dateFilter, employeeFilter, searchInput])

  const paginatedAttendance = paginateRows(filteredAttendance, page, rowsPerPage)
  const presentCount = attendance.filter(
    (record) => record.day_status === "present"
  ).length
  const lateCount = attendance.filter(
    (record) => record.attendance_status === "late"
  ).length
  const absentCount = attendance.filter(
    (record) => record.day_status === "absent"
  ).length

  if (isLoading) {
    return <LoadingState label="Loading attendance..." />
  }

  if (error) {
    return <Alert title="Failed to load attendance" variant="error" />
  }

  return (
    <div className="p-4 sm:p-6">
      <PageHeader
        icon={<FiCalendar />}
        title="Attendance"
        subtitle="Record employee time in, time out, schedules, and attendance date"
        actions={
          <Button icon={<FiPlus />} onClick={openAddModal} variant="primary">
            Add Attendance
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard label="Total Records" value={formatNumber(attendance.length)} />
        <StatCard label="Present Days" value={formatNumber(presentCount)} />
        <StatCard label="Late Records" value={formatNumber(lateCount)} />
        <StatCard label="Absent Days" value={formatNumber(absentCount)} />
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_220px_180px_auto]">
        <Input
          icon={<FiSearch />}
          placeholder="Search employee, position, date, time, or status..."
          value={searchInput}
          onChange={(e) => {
            setSearchInput(e.target.value)
            setPage(1)
          }}
        />
        <Select
          value={employeeFilter}
          onChange={(e) => {
            setEmployeeFilter(e.target.value)
            setPage(1)
          }}
        >
          <option value="all">All Employees</option>
          {employees.map((employee) => (
            <option key={employee.id} value={employee.id}>
              {employee.full_name}
            </option>
          ))}
        </Select>
        <Input
          type="date"
          value={dateFilter}
          onChange={(e) => {
            setDateFilter(e.target.value)
            setPage(1)
          }}
        />
        <Button icon={<FiRefreshCw />} onClick={resetFilters}>
          Reset
        </Button>
      </div>

      <TableContainer>
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">
                Employee
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">
                Position
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">
                Date
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">
                Day Status
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">
                Time In
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">
                Time Out
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">
                Schedule
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">
                Break
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">
                Work Hours
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">
                Status
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {paginatedAttendance.map((record) => (
              <tr key={record.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-semibold text-slate-900">
                  {record.employee_name}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {record.position || "-"}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {formatDate(record.attendance_date)}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={record.day_status} />
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {formatTime(record.time_in)}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {formatTime(record.time_out)}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {formatTime(record.schedule_time_in)} -{" "}
                  {formatTime(record.schedule_time_out)}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {record.break_minutes} mins
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {getWorkHoursLabel(record.work_hours)}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={record.attendance_status} />
                </td>
                <td className="px-4 py-3">
                  <Button
                    icon={<FiEdit2 />}
                    onClick={() => setEditAttendance(record)}
                  >
                    Edit
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredAttendance.length === 0 ? (
          <EmptyState
            title="No attendance records found"
            description="Try adjusting the filters or adding an attendance record."
          />
        ) : null}
      </TableContainer>

      <Pagination
        page={page}
        rowsPerPage={rowsPerPage}
        totalRows={filteredAttendance.length}
        onPageChange={setPage}
        onRowsPerPageChange={setRowsPerPage}
      />

      {isAddOpen ? (
        <Modal
          title="Add Attendance"
          onClose={() => {
            resetForm()
            setIsAddOpen(false)
          }}
        >
          <form onSubmit={handleAddAttendance} className="space-y-4">
            <AttendanceFormFields
              employees={employees}
              formData={{
                ...formData,
                employee_id: getFormEmployeeId(),
              }}
              setFormData={setFormData}
            />

            {createAttendanceMutation.error instanceof Error ? (
              <Alert
                title={createAttendanceMutation.error.message}
                variant="error"
              />
            ) : null}

            <div className="flex justify-end gap-2">
              <Button
                onClick={() => {
                  resetForm()
                  setIsAddOpen(false)
                }}
              >
                Cancel
              </Button>
              <Button
                disabled={
                  createAttendanceMutation.isPending || employees.length === 0
                }
                type="submit"
                variant="primary"
              >
                {createAttendanceMutation.isPending
                  ? "Saving..."
                  : "Save Attendance"}
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}

      {editAttendance ? (
        <Modal title="Edit Attendance" onClose={() => setEditAttendance(null)}>
          <form onSubmit={handleUpdateAttendance} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Select
                label="Employee"
                value={editAttendance.employee_id}
                onChange={(e) =>
                  setEditAttendance({
                    ...editAttendance,
                    employee_id: Number(e.target.value),
                  })
                }
                required
              >
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.full_name}
                  </option>
                ))}
              </Select>
              <Input
                label="Attendance Date"
                type="date"
                value={formatDate(editAttendance.attendance_date)}
                onChange={(e) =>
                  setEditAttendance({
                    ...editAttendance,
                    attendance_date: e.target.value,
                  })
                }
                required
              />
              <Select
                label="Day Status"
                value={editAttendance.day_status || "present"}
                onChange={(e) =>
                  setEditAttendance({
                    ...editAttendance,
                    day_status: e.target.value,
                  })
                }
              >
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="rest_day">Rest Day</option>
                <option value="offset">Offset</option>
              </Select>
              {!isNonWorkingStatus(editAttendance.day_status) ? (
                <>
                  <Input
                    label="Time In"
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
                  />
                  <Input
                    label="Time Out"
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
                  />
                </>
              ) : null}
              <Input
                label="Schedule Time In"
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
              />
              <Input
                label="Schedule Time Out"
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
              />
              <Input
                label="Break Minutes"
                type="number"
                min={0}
                value={Number(editAttendance.break_minutes || 0)}
                onChange={(e) =>
                  setEditAttendance({
                    ...editAttendance,
                    break_minutes: Number(e.target.value),
                  })
                }
              />
            </div>

            {updateAttendanceMutation.error instanceof Error ? (
              <Alert
                title={updateAttendanceMutation.error.message}
                variant="error"
              />
            ) : null}

            <div className="flex justify-end gap-2">
              <Button onClick={() => setEditAttendance(null)}>Cancel</Button>
              <Button
                disabled={updateAttendanceMutation.isPending}
                type="submit"
                variant="primary"
              >
                {updateAttendanceMutation.isPending
                  ? "Saving..."
                  : "Save Changes"}
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}
    </div>
  )
}

type AttendanceFormFieldsProps = {
  employees: Employee[]
  formData: AttendanceFormData
  setFormData: (formData: AttendanceFormData) => void
}

const AttendanceFormFields = ({
  employees,
  formData,
  setFormData,
}: AttendanceFormFieldsProps) => {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Select
        label="Employee"
        value={formData.employee_id}
        onChange={(e) =>
          setFormData({
            ...formData,
            employee_id: Number(e.target.value),
          })
        }
        required
      >
        {employees.length === 0 ? (
          <option value={0}>No active employees available</option>
        ) : null}
        {employees.map((employee) => (
          <option key={employee.id} value={employee.id}>
            {employee.full_name}
          </option>
        ))}
      </Select>
      <Input
        label="Attendance Date"
        type="date"
        value={formData.attendance_date}
        onChange={(e) =>
          setFormData({
            ...formData,
            attendance_date: e.target.value,
          })
        }
        required
      />
      <Select
        label="Day Status"
        value={formData.day_status}
        onChange={(e) =>
          setFormData({
            ...formData,
            day_status: e.target.value,
          })
        }
      >
        <option value="present">Present</option>
        <option value="absent">Absent</option>
        <option value="rest_day">Rest Day</option>
        <option value="offset">Offset</option>
      </Select>
      {!isNonWorkingStatus(formData.day_status) ? (
        <>
          <Input
            label="Time In"
            type="time"
            value={formData.time_in}
            onChange={(e) =>
              setFormData({
                ...formData,
                time_in: e.target.value,
              })
            }
          />
          <Input
            label="Time Out"
            type="time"
            value={formData.time_out}
            onChange={(e) =>
              setFormData({
                ...formData,
                time_out: e.target.value,
              })
            }
          />
        </>
      ) : null}
      <Input
        label="Schedule Time In"
        type="time"
        value={formData.schedule_time_in}
        onChange={(e) =>
          setFormData({
            ...formData,
            schedule_time_in: e.target.value,
          })
        }
      />
      <Input
        label="Schedule Time Out"
        type="time"
        value={formData.schedule_time_out}
        onChange={(e) =>
          setFormData({
            ...formData,
            schedule_time_out: e.target.value,
          })
        }
      />
      <Input
        label="Break Minutes"
        type="number"
        min={0}
        value={formData.break_minutes}
        onChange={(e) =>
          setFormData({
            ...formData,
            break_minutes: Number(e.target.value),
          })
        }
      />
    </div>
  )
}

export default Attendance
