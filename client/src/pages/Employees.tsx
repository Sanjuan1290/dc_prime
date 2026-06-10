import { useMemo, useState, type FormEvent } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import * as XLSX from "xlsx-js-style"
import {
  FiDownload,
  FiEdit2,
  FiEye,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiUsers,
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
import {
  formatMoney,
  formatNumber,
  formatTime,
  getLocalDate,
} from "../utils/formatters"
import { paginateRows } from "../utils/pagination"

type EmployeeStatus = "active" | "inactive" | string

type Employee = {
  id: number
  full_name: string
  position: string | null
  monthly_salary: number | string
  status: EmployeeStatus
  rest_days: string | null
  created_at: string
  updated_at: string
}

type EmployeeFormData = {
  full_name: string
  position: string
  monthly_salary: number
  status: EmployeeStatus
  rest_days: string[]
}

type EmployeesResponse = {
  employees: Employee[]
}

type EmployeeAttendanceLog = {
  id: number
  employee_id: number
  attendance_date: string
  day_status: string
  time_in: string | null
  time_out: string | null
  schedule_time_in: string | null
  schedule_time_out: string | null
  break_minutes: number
  computed_status: string
  worked_hours_with_ot: number
  regular_hours: number
  overtime_hours: number
  late_hours: number
}

type EmployeeAttendanceSummary = {
  employee: {
    id: number
    full_name: string
    position: string | null
    monthly_salary: number | string
    status: string
  }
  summary: {
    totalWorkedHoursWithOt: number
    totalRegularHours: number
    overtimeHours: number
    totalLateHours: number
    presentDays: number
    absentDays: number
    restDays: number
    offsetDays: number
    lateDays: number
    onTimeDays: number
    bonusCandidate: boolean
    bonusNote: string
  }
  logs: EmployeeAttendanceLog[]
}

const days = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
]

const emptyFormData: EmployeeFormData = {
  full_name: "",
  position: "",
  monthly_salary: 0,
  status: "active",
  rest_days: [],
}

const getCurrentExportRange = () => {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()

  const startDate = new Date(year, month, 1)
  const endDate = new Date(year, month + 1, 7)

  const formatLocal = (date: Date) => {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, "0")
    const d = String(date.getDate()).padStart(2, "0")

    return `${y}-${m}-${d}`
  }

  return {
    start: formatLocal(startDate),
    end: formatLocal(endDate),
  }
}

const fetchEmployees = async (): Promise<Employee[]> => {
  const res = await fetch(`${API_URL}/employees`, {
    credentials: "include",
  })

  if (!res.ok) {
    throw new Error(await getErrorMessage(res))
  }

  const data: EmployeesResponse = await res.json()
  return data.employees
}

const createEmployee = async (employeeData: EmployeeFormData) => {
  const res = await fetch(`${API_URL}/employees`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(employeeData),
  })

  if (!res.ok) {
    throw new Error(await getErrorMessage(res))
  }

  return res.json()
}

const updateEmployee = async ({
  id,
  employeeData,
}: {
  id: number
  employeeData: EmployeeFormData
}) => {
  const res = await fetch(`${API_URL}/employees/${id}`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(employeeData),
  })

  if (!res.ok) {
    throw new Error(await getErrorMessage(res))
  }

  return res.json()
}

const fetchEmployeeAttendanceSummary = async ({
  employeeId,
  startDate,
  endDate,
}: {
  employeeId: number
  startDate: string
  endDate: string
}): Promise<EmployeeAttendanceSummary> => {
  const params = new URLSearchParams({
    date_from: startDate,
    date_to: endDate,
  })

  const res = await fetch(
    `${API_URL}/employees/${employeeId}/attendance-summary?${params.toString()}`,
    {
      credentials: "include",
    }
  )

  if (!res.ok) {
    throw new Error(await getErrorMessage(res))
  }

  return res.json()
}

const parseRestDays = (restDays: string | null) => {
  if (!restDays) return []

  return restDays
    .split(",")
    .map((day) => day.trim())
    .filter(Boolean)
}

const formatDateValue = (date: string | null | undefined) => {
  if (!date) return "-"

  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date
  }

  return String(date).slice(0, 10)
}

const formatRestDays = (restDays: string | null) => {
  return restDays || "-"
}

const Employees = () => {
  const queryClient = useQueryClient()
  const defaultExportRange = getCurrentExportRange()

  const [searchInput, setSearchInput] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null)
  const [viewMoreEmployee, setViewMoreEmployee] = useState<Employee | null>(null)
  const [formData, setFormData] = useState<EmployeeFormData>(emptyFormData)

  const [exportStartDate, setExportStartDate] = useState(defaultExportRange.start)
  const [exportEndDate, setExportEndDate] = useState(defaultExportRange.end)
  const [attendancePage, setAttendancePage] = useState(1)
  const [attendanceRowsPerPage, setAttendanceRowsPerPage] = useState(10)

  const {
    data: employees = [],
    isLoading,
    error,
  } = useQuery<Employee[]>({
    queryKey: ["employees"],
    queryFn: fetchEmployees,
  })

  const {
    data: attendanceSummary,
    isLoading: isAttendanceSummaryLoading,
    error: attendanceSummaryError,
  } = useQuery<EmployeeAttendanceSummary>({
    queryKey: [
      "employee-attendance-summary",
      viewMoreEmployee?.id,
      exportStartDate,
      exportEndDate,
    ],
    queryFn: () =>
      fetchEmployeeAttendanceSummary({
        employeeId: viewMoreEmployee!.id,
        startDate: exportStartDate,
        endDate: exportEndDate,
      }),
    enabled: !!viewMoreEmployee && !!exportStartDate && !!exportEndDate,
  })

  const createEmployeeMutation = useMutation({
    mutationFn: createEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] })
      queryClient.invalidateQueries({ queryKey: ["attendance"] })
      setIsAddOpen(false)
      setFormData(emptyFormData)
    },
  })

  const updateEmployeeMutation = useMutation({
    mutationFn: updateEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] })
      queryClient.invalidateQueries({ queryKey: ["attendance"] })
      queryClient.invalidateQueries({
        queryKey: ["employee-attendance-summary"],
      })
      setEditEmployee(null)
    },
  })

  const toggleFormRestDay = (day: string) => {
    setFormData((current) => {
      const alreadySelected = current.rest_days.includes(day)

      return {
        ...current,
        rest_days: alreadySelected
          ? current.rest_days.filter((restDay) => restDay !== day)
          : [...current.rest_days, day],
      }
    })
  }

  const toggleEditRestDay = (day: string) => {
    if (!editEmployee) return

    const currentRestDays = parseRestDays(editEmployee.rest_days)
    const alreadySelected = currentRestDays.includes(day)

    const updatedRestDays = alreadySelected
      ? currentRestDays.filter((restDay) => restDay !== day)
      : [...currentRestDays, day]

    setEditEmployee({
      ...editEmployee,
      rest_days: updatedRestDays.join(", "),
    })
  }

  const resetFilters = () => {
    setSearchInput("")
    setStatusFilter("all")
    setPage(1)
  }

  const resetForm = () => {
    setFormData(emptyFormData)
  }

  const openAddModal = () => {
    resetForm()
    setIsAddOpen(true)
  }

  const openViewMoreModal = (employee: Employee) => {
    const range = getCurrentExportRange()
    setExportStartDate(range.start)
    setExportEndDate(range.end)
    setAttendancePage(1)
    setViewMoreEmployee(employee)
  }

  const handleAddEmployee = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    createEmployeeMutation.mutate(formData)
  }

  const handleUpdateEmployee = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!editEmployee) return

    updateEmployeeMutation.mutate({
      id: editEmployee.id,
      employeeData: {
        full_name: editEmployee.full_name,
        position: editEmployee.position || "",
        monthly_salary: Number(editEmployee.monthly_salary || 0),
        status: editEmployee.status,
        rest_days: parseRestDays(editEmployee.rest_days),
      },
    })
  }

  const convertHoursToExcelTime = (hours: number) => {
    return Number(hours || 0) / 24
  }

  const convertTimeToExcelTime = (time: string | null) => {
    if (!time || time === "-") return ""

    const [hours, minutes] = String(time).slice(0, 5).split(":").map(Number)

    if (Number.isNaN(hours) || Number.isNaN(minutes)) return ""

    return (hours * 60 + minutes) / 1440
  }

  const getDayName = (dateValue: string) => {
    const date = new Date(`${formatDateValue(dateValue)}T00:00:00`)

    if (Number.isNaN(date.getTime())) return "-"

    return date
      .toLocaleDateString("en-US", { weekday: "long" })
      .toUpperCase()
  }

  const getExcelDateNumber = (dateValue: string) => {
    const safeDate = formatDateValue(dateValue)
    const date = new Date(`${safeDate}T00:00:00`)
    const excelEpoch = new Date(Date.UTC(1899, 11, 30))

    return Math.floor(
      (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) -
        excelEpoch.getTime()) /
        86400000
    )
  }

  const getAttendanceCode = (status: string) => {
    if (status === "rest_day") return "RD"
    if (status === "absent") return "A"
    if (status === "offset") return "OFFSET"

    return null
  }

  const exportEmployeeAttendanceToExcel = () => {
    if (!attendanceSummary || !viewMoreEmployee) return

    const workbook = XLSX.utils.book_new()
    const employeeName = attendanceSummary.employee.full_name
    const logs = attendanceSummary.logs

    const sheetData: (string | number | null)[][] = [
      ["OFFICE LOG BOOK"],
      [`Employee: ${employeeName}`],
      [`Period: ${exportStartDate} to ${exportEndDate}`],
      [],
      [
        "Day",
        "Date",
        "Time In",
        "Time Out",
        "Total Hours Worked",
        "Total Time Late",
        "Scheduled Time Out",
        "Break Time",
        "Overtime",
        "Regular Working Hours",
        "Regular Hours Attended",
        "Scheduled Time In",
        "Late",
        "Total Time Late 2",
      ],
    ]

    logs.forEach((log) => {
      const attendanceCode = getAttendanceCode(log.day_status)

      if (attendanceCode) {
        sheetData.push([
          getDayName(log.attendance_date),
          getExcelDateNumber(log.attendance_date),
          attendanceCode,
          attendanceCode,
          attendanceCode,
          attendanceCode,
          attendanceCode,
          attendanceCode,
          attendanceCode,
          attendanceCode,
          attendanceCode,
          attendanceCode,
          attendanceCode,
          attendanceCode,
        ])

        return
      }

      const lateAsExcelTime = convertHoursToExcelTime(log.late_hours)

      sheetData.push([
        getDayName(log.attendance_date),
        getExcelDateNumber(log.attendance_date),
        convertTimeToExcelTime(log.time_in),
        convertTimeToExcelTime(log.time_out),
        convertHoursToExcelTime(log.worked_hours_with_ot),
        lateAsExcelTime,
        convertTimeToExcelTime(log.schedule_time_out),
        Number(log.break_minutes || 0) / 1440,
        convertHoursToExcelTime(log.overtime_hours),
        convertHoursToExcelTime(log.regular_hours),
        convertHoursToExcelTime(log.regular_hours),
        convertTimeToExcelTime(log.schedule_time_in),
        log.computed_status === "late" ? "Late" : "On Time",
        lateAsExcelTime,
      ])
    })

    const summaryTitleRow = sheetData.length + 1

    sheetData.push([])
    sheetData.push(["SUMMARY"])
    sheetData.push([
      "No. of Days",
      attendanceSummary.summary.presentDays,
      "",
      "Total Worked w/ OT",
      convertHoursToExcelTime(attendanceSummary.summary.totalWorkedHoursWithOt),
      "",
      "Late",
      convertHoursToExcelTime(attendanceSummary.summary.totalLateHours),
      "",
      "Overtime",
      convertHoursToExcelTime(attendanceSummary.summary.overtimeHours),
      "",
      "Hours Attended",
      convertHoursToExcelTime(attendanceSummary.summary.totalRegularHours),
    ])
    sheetData.push([
      "Absent Days",
      attendanceSummary.summary.absentDays,
      "",
      "Rest Days",
      attendanceSummary.summary.restDays,
      "",
      "Offset Days",
      attendanceSummary.summary.offsetDays,
      "",
      "Late Days",
      attendanceSummary.summary.lateDays,
      "",
      "On Time Days",
      attendanceSummary.summary.onTimeDays,
    ])

    const bonusTitleRow = sheetData.length + 1

    sheetData.push([])
    sheetData.push(["30-DAY BONUS CHECK"])
    sheetData.push([
      "Bonus Status",
      attendanceSummary.summary.bonusCandidate ? "Candidate" : "Not Candidate",
      "",
      "Note",
      attendanceSummary.summary.bonusNote,
    ])

    const employeeTitleRow = sheetData.length + 1

    sheetData.push([])
    sheetData.push(["EMPLOYEE CONFIRMATION"])
    sheetData.push(["ID#:", String(viewMoreEmployee.id)])
    sheetData.push(["Name of Employee:", employeeName])
    sheetData.push(["Signature:", ""])
    sheetData.push(["Date:", getExcelDateNumber(getLocalDate())])

    const worksheet = XLSX.utils.aoa_to_sheet(sheetData)

    worksheet["!cols"] = [
      { wch: 15 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 20 },
      { wch: 16 },
      { wch: 18 },
      { wch: 12 },
      { wch: 12 },
      { wch: 20 },
      { wch: 22 },
      { wch: 18 },
      { wch: 14 },
      { wch: 18 },
    ]

    worksheet["!rows"] = [
      { hpt: 28 },
      { hpt: 22 },
      { hpt: 22 },
      { hpt: 8 },
      { hpt: 45 },
    ]

    worksheet["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 13 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 13 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 13 } },
      { s: { r: summaryTitleRow, c: 0 }, e: { r: summaryTitleRow, c: 13 } },
      { s: { r: bonusTitleRow, c: 0 }, e: { r: bonusTitleRow, c: 13 } },
      { s: { r: bonusTitleRow + 1, c: 4 }, e: { r: bonusTitleRow + 1, c: 13 } },
      { s: { r: employeeTitleRow, c: 0 }, e: { r: employeeTitleRow, c: 13 } },
    ]

    const border = {
      top: { style: "thin", color: { rgb: "000000" } },
      bottom: { style: "thin", color: { rgb: "000000" } },
      left: { style: "thin", color: { rgb: "000000" } },
      right: { style: "thin", color: { rgb: "000000" } },
    }

    const centerStyle = {
      border,
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      font: {
        sz: 11,
      },
    }

    const leftStyle = {
      border,
      alignment: {
        horizontal: "left",
        vertical: "center",
        wrapText: true,
      },
      font: {
        sz: 11,
      },
    }

    const titleStyle = {
      border,
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      font: {
        bold: true,
        sz: 16,
      },
    }

    const sectionStyle = {
      border,
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      font: {
        bold: true,
        sz: 12,
      },
      fill: {
        fgColor: { rgb: "D9EAD3" },
      },
    }

    const headerStyle = {
      border,
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      font: {
        bold: true,
        sz: 11,
      },
      fill: {
        fgColor: { rgb: "D9EAD3" },
      },
    }

    const labelStyle = {
      ...centerStyle,
      font: { bold: true, sz: 11 },
      fill: { fgColor: { rgb: "FCE5CD" } },
    }

    const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1:N1")

    for (let row = range.s.r; row <= range.e.r; row++) {
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col })

        if (!worksheet[cellAddress]) {
          worksheet[cellAddress] = { t: "s", v: "" }
        }

        worksheet[cellAddress].s = centerStyle
      }
    }

    for (let col = 0; col <= 13; col++) {
      const titleCell = worksheet[XLSX.utils.encode_cell({ r: 0, c: col })]
      const employeeCell = worksheet[XLSX.utils.encode_cell({ r: 1, c: col })]
      const periodCell = worksheet[XLSX.utils.encode_cell({ r: 2, c: col })]

      if (titleCell) titleCell.s = titleStyle
      if (employeeCell) {
        employeeCell.s = {
          ...leftStyle,
          font: { bold: true, sz: 12 },
        }
      }
      if (periodCell) {
        periodCell.s = {
          ...leftStyle,
          font: { bold: true, sz: 12 },
        }
      }
    }

    for (let col = 0; col <= 13; col++) {
      const headerCell = worksheet[XLSX.utils.encode_cell({ r: 4, c: col })]
      if (headerCell) headerCell.s = headerStyle
    }

    const logStartRow = 5
    const logEndRow = 4 + logs.length

    for (let row = logStartRow; row <= logEndRow; row++) {
      const dateCell = worksheet[XLSX.utils.encode_cell({ r: row, c: 1 })]

      if (dateCell && typeof dateCell.v === "number") {
        dateCell.t = "n"
        dateCell.z = "m/d/yyyy"
      }

      const timeColumns = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13]

      timeColumns.forEach((col) => {
        const cell = worksheet[XLSX.utils.encode_cell({ r: row, c: col })]

        if (cell && typeof cell.v === "number") {
          cell.t = "n"
          cell.z = "[h]:mm"
        }
      })
    }

    for (let col = 0; col <= 13; col++) {
      const summaryCell =
        worksheet[XLSX.utils.encode_cell({ r: summaryTitleRow, c: col })]
      const bonusCell =
        worksheet[XLSX.utils.encode_cell({ r: bonusTitleRow, c: col })]
      const employeeCell =
        worksheet[XLSX.utils.encode_cell({ r: employeeTitleRow, c: col })]

      if (summaryCell) summaryCell.s = sectionStyle
      if (bonusCell) bonusCell.s = sectionStyle
      if (employeeCell) employeeCell.s = sectionStyle
    }

    const summaryRows = [summaryTitleRow + 1, summaryTitleRow + 2]

    summaryRows.forEach((row) => {
      for (let col = 0; col <= 13; col++) {
        const cell = worksheet[XLSX.utils.encode_cell({ r: row, c: col })]

        if (cell && [0, 3, 6, 9, 12].includes(col)) {
          cell.s = labelStyle
        }
      }
    })

    const summaryTimeCells = [
      { row: summaryTitleRow + 1, col: 4 },
      { row: summaryTitleRow + 1, col: 7 },
      { row: summaryTitleRow + 1, col: 10 },
      { row: summaryTitleRow + 1, col: 13 },
    ]

    summaryTimeCells.forEach(({ row, col }) => {
      const cell = worksheet[XLSX.utils.encode_cell({ r: row, c: col })]

      if (cell && typeof cell.v === "number") {
        cell.t = "n"
        cell.z = "[h]:mm"
      }
    })

    const generatedDateCell =
      worksheet[XLSX.utils.encode_cell({ r: employeeTitleRow + 4, c: 1 })]

    if (generatedDateCell && typeof generatedDateCell.v === "number") {
      generatedDateCell.t = "n"
      generatedDateCell.z = "m/d/yyyy"
    }

    if (logs.length > 0) {
      worksheet["!autofilter"] = {
        ref: `A5:N${logEndRow + 1}`,
      }
    }

    XLSX.utils.book_append_sheet(workbook, worksheet, "OFFICE LOG BOOK")

    const safeName = employeeName
      .replace(/[\\/:*?"<>|]/g, "")
      .replaceAll(" ", "_")

    XLSX.writeFile(
      workbook,
      `${safeName}_OFFICE_LOG_BOOK_${exportStartDate}_to_${exportEndDate}.xlsx`
    )
  }

  const filteredEmployees = useMemo(() => {
    return employees.filter((employee) => {
      const search = searchInput.toLowerCase().trim()

      const matchesSearch =
        search === "" ||
        employee.full_name.toLowerCase().includes(search) ||
        (employee.position || "").toLowerCase().includes(search) ||
        employee.status.toLowerCase().includes(search) ||
        (employee.rest_days || "").toLowerCase().includes(search)

      const matchesStatus =
        statusFilter === "all" || employee.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [employees, searchInput, statusFilter])

  const paginatedEmployees = paginateRows(filteredEmployees, page, rowsPerPage)
  const activeCount = employees.filter((employee) => employee.status === "active").length
  const payrollTotal = employees.reduce(
    (sum, employee) => sum + Number(employee.monthly_salary || 0),
    0
  )
  const withRestDays = employees.filter((employee) => employee.rest_days).length

  const paginatedAttendanceLogs = attendanceSummary
    ? paginateRows(attendanceSummary.logs, attendancePage, attendanceRowsPerPage)
    : []

  if (isLoading) {
    return <LoadingState label="Loading employees..." />
  }

  if (error) {
    return <Alert title="Failed to load employees" variant="error" />
  }

  return (
    <div className="p-4 sm:p-6">
      <PageHeader
        icon={<FiUsers />}
        title="Employees"
        subtitle="Manage employee records for attendance tracking"
        actions={
          <Button icon={<FiPlus />} onClick={openAddModal} variant="primary">
            Add Employee
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard label="Total Employees" value={formatNumber(employees.length)} />
        <StatCard label="Active Employees" value={formatNumber(activeCount)} />
        <StatCard label="Monthly Payroll" value={formatMoney(payrollTotal)} />
        <StatCard label="With Rest Days" value={formatNumber(withRestDays)} />
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_180px_auto]">
        <Input
          icon={<FiSearch />}
          placeholder="Search employee name, position, rest day, or status..."
          value={searchInput}
          onChange={(e) => {
            setSearchInput(e.target.value)
            setPage(1)
          }}
        />
        <Select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value)
            setPage(1)
          }}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Select>
        <Button icon={<FiRefreshCw />} onClick={resetFilters}>
          Reset
        </Button>
      </div>

      <TableContainer>
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">
                Employee Name
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">
                Position
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">
                Monthly Salary
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">
                Rest Days
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">
                Status
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">
                Created At
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {paginatedEmployees.map((employee) => (
              <tr key={employee.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-semibold text-slate-900">
                  {employee.full_name}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {employee.position || "-"}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {formatMoney(employee.monthly_salary)}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {formatRestDays(employee.rest_days)}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={employee.status} />
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {formatDateValue(employee.created_at)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      icon={<FiEdit2 />}
                      onClick={() => setEditEmployee(employee)}
                    >
                      Edit
                    </Button>
                    <Button
                      icon={<FiEye />}
                      onClick={() => openViewMoreModal(employee)}
                    >
                      View More
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredEmployees.length === 0 ? (
          <EmptyState
            title="No employees found"
            description="Try clearing filters or adding an employee."
          />
        ) : null}
      </TableContainer>

      <Pagination
        page={page}
        rowsPerPage={rowsPerPage}
        totalRows={filteredEmployees.length}
        onPageChange={setPage}
        onRowsPerPageChange={setRowsPerPage}
      />

      {isAddOpen ? (
        <Modal
          title="Add Employee"
          onClose={() => {
            resetForm()
            setIsAddOpen(false)
          }}
        >
          <form onSubmit={handleAddEmployee} className="space-y-4">
            <EmployeeFormFields
              formData={formData}
              onRestDayToggle={toggleFormRestDay}
              setFormData={setFormData}
            />

            {createEmployeeMutation.error instanceof Error ? (
              <Alert title={createEmployeeMutation.error.message} variant="error" />
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
                disabled={createEmployeeMutation.isPending}
                type="submit"
                variant="primary"
              >
                {createEmployeeMutation.isPending
                  ? "Saving..."
                  : "Save Employee"}
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}

      {editEmployee ? (
        <Modal title="Edit Employee" onClose={() => setEditEmployee(null)}>
          <form onSubmit={handleUpdateEmployee} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input
                label="Full Name"
                value={editEmployee.full_name}
                onChange={(e) =>
                  setEditEmployee({
                    ...editEmployee,
                    full_name: e.target.value,
                  })
                }
                required
              />
              <Input
                label="Position"
                value={editEmployee.position || ""}
                onChange={(e) =>
                  setEditEmployee({
                    ...editEmployee,
                    position: e.target.value,
                  })
                }
              />
              <Input
                label="Monthly Salary"
                type="number"
                min={0}
                step="0.01"
                value={Number(editEmployee.monthly_salary || 0)}
                onChange={(e) =>
                  setEditEmployee({
                    ...editEmployee,
                    monthly_salary: Number(e.target.value),
                  })
                }
              />
              <Select
                label="Status"
                value={editEmployee.status}
                onChange={(e) =>
                  setEditEmployee({
                    ...editEmployee,
                    status: e.target.value as EmployeeStatus,
                  })
                }
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>
            </div>

            <RestDayPicker
              selectedDays={parseRestDays(editEmployee.rest_days)}
              onToggle={toggleEditRestDay}
            />

            {updateEmployeeMutation.error instanceof Error ? (
              <Alert title={updateEmployeeMutation.error.message} variant="error" />
            ) : null}

            <div className="flex justify-end gap-2">
              <Button onClick={() => setEditEmployee(null)}>Cancel</Button>
              <Button
                disabled={updateEmployeeMutation.isPending}
                type="submit"
                variant="primary"
              >
                {updateEmployeeMutation.isPending
                  ? "Saving..."
                  : "Save Changes"}
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}

      {viewMoreEmployee ? (
        <Modal
          size="xl"
          title={viewMoreEmployee.full_name}
          onClose={() => setViewMoreEmployee(null)}
        >
          <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Attendance summary based on the office log book format.
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Showing records from {exportStartDate} to {exportEndDate}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-[160px_160px_auto_auto]">
              <Input
                label="Start Date"
                type="date"
                value={exportStartDate}
                onChange={(e) => {
                  setExportStartDate(e.target.value)
                  setAttendancePage(1)
                }}
              />
              <Input
                label="End Date"
                type="date"
                value={exportEndDate}
                onChange={(e) => {
                  setExportEndDate(e.target.value)
                  setAttendancePage(1)
                }}
              />
              <Button
                icon={<FiRefreshCw />}
                onClick={() => {
                  const range = getCurrentExportRange()
                  setExportStartDate(range.start)
                  setExportEndDate(range.end)
                  setAttendancePage(1)
                }}
              >
                Default Range
              </Button>
              <Button
                disabled={
                  !attendanceSummary ||
                  isAttendanceSummaryLoading ||
                  !exportStartDate ||
                  !exportEndDate
                }
                icon={<FiDownload />}
                onClick={exportEmployeeAttendanceToExcel}
                variant="primary"
              >
                Export Excel
              </Button>
            </div>
          </div>

          {isAttendanceSummaryLoading ? (
            <LoadingState label="Loading attendance summary..." />
          ) : attendanceSummaryError ? (
            <Alert title="Failed to load attendance summary" variant="error" />
          ) : attendanceSummary ? (
            <>
              <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
                <StatCard
                  label="Total Worked w/ OT"
                  value={`${attendanceSummary.summary.totalWorkedHoursWithOt}h`}
                />
                <StatCard
                  label="Overtime"
                  value={`${attendanceSummary.summary.overtimeHours}h`}
                />
                <StatCard
                  label="Present Days"
                  value={attendanceSummary.summary.presentDays}
                />
                <StatCard
                  label="Late Days"
                  value={attendanceSummary.summary.lateDays}
                />
              </div>

              <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-base font-bold text-slate-900">
                  30-Day Bonus Check
                </h3>
                <div className="mt-3 grid grid-cols-1 gap-3 text-sm md:grid-cols-4">
                  <SummaryItem
                    label="Bonus Status"
                    value={
                      attendanceSummary.summary.bonusCandidate
                        ? "Candidate"
                        : "Not Candidate"
                    }
                  />
                  <SummaryItem
                    label="Absent Days"
                    value={attendanceSummary.summary.absentDays}
                  />
                  <SummaryItem
                    label="Late Days"
                    value={attendanceSummary.summary.lateDays}
                  />
                  <SummaryItem
                    label="Late Hours"
                    value={`${attendanceSummary.summary.totalLateHours}h`}
                  />
                </div>
                <p className="mt-3 text-sm text-slate-500">
                  {attendanceSummary.summary.bonusNote}
                </p>
              </div>

              <TableContainer>
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      {[
                        "Date",
                        "Status",
                        "Time In",
                        "Time Out",
                        "Schedule In",
                        "Schedule Out",
                        "Break",
                        "Worked w/ OT",
                        "Regular Hours",
                        "Overtime",
                        "Late",
                      ].map((heading) => (
                        <th
                          key={heading}
                          className="px-4 py-3 text-left font-semibold text-slate-600"
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {paginatedAttendanceLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-slate-600">
                          {formatDateValue(log.attendance_date)}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={log.computed_status} />
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {formatTime(log.time_in)}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {formatTime(log.time_out)}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {formatTime(log.schedule_time_in)}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {formatTime(log.schedule_time_out)}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {log.break_minutes} mins
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {log.worked_hours_with_ot}h
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {log.regular_hours}h
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {log.overtime_hours}h
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {log.late_hours}h
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {attendanceSummary.logs.length === 0 ? (
                  <EmptyState title="No attendance records found for this period" />
                ) : null}
              </TableContainer>

              <Pagination
                page={attendancePage}
                rowsPerPage={attendanceRowsPerPage}
                totalRows={attendanceSummary.logs.length}
                onPageChange={setAttendancePage}
                onRowsPerPageChange={setAttendanceRowsPerPage}
              />
            </>
          ) : null}
        </Modal>
      ) : null}
    </div>
  )
}

type EmployeeFormFieldsProps = {
  formData: EmployeeFormData
  onRestDayToggle: (day: string) => void
  setFormData: (formData: EmployeeFormData) => void
}

const EmployeeFormFields = ({
  formData,
  onRestDayToggle,
  setFormData,
}: EmployeeFormFieldsProps) => {
  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input
          label="Full Name"
          value={formData.full_name}
          onChange={(e) =>
            setFormData({ ...formData, full_name: e.target.value })
          }
          required
        />
        <Input
          label="Position"
          value={formData.position}
          onChange={(e) =>
            setFormData({ ...formData, position: e.target.value })
          }
        />
        <Input
          label="Monthly Salary"
          type="number"
          min={0}
          step="0.01"
          value={formData.monthly_salary}
          onChange={(e) =>
            setFormData({
              ...formData,
              monthly_salary: Number(e.target.value),
            })
          }
        />
        <Select
          label="Status"
          value={formData.status}
          onChange={(e) =>
            setFormData({
              ...formData,
              status: e.target.value as EmployeeStatus,
            })
          }
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Select>
      </div>
      <RestDayPicker selectedDays={formData.rest_days} onToggle={onRestDayToggle} />
    </>
  )
}

const RestDayPicker = ({
  onToggle,
  selectedDays,
}: {
  onToggle: (day: string) => void
  selectedDays: string[]
}) => {
  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <p className="mb-3 text-sm font-semibold text-slate-700">Rest Days</p>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
        {days.map((day) => (
          <label
            key={day}
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
          >
            <input
              type="checkbox"
              checked={selectedDays.includes(day)}
              onChange={() => onToggle(day)}
            />
            {day}
          </label>
        ))}
      </div>
    </div>
  )
}

const SummaryItem = ({
  label,
  value,
}: {
  label: string
  value: number | string
}) => {
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-slate-400">{label}</p>
      <p className="mt-1 font-semibold text-slate-800">{value}</p>
    </div>
  )
}

export default Employees
