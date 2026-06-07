import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import * as XLSX from "xlsx-js-style"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1"

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

const getLocalDate = () => {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
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

const Employees = () => {
  const queryClient = useQueryClient()

  const defaultExportRange = getCurrentExportRange()

  const [searchInput, setSearchInput] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null)
  const [viewMoreEmployee, setViewMoreEmployee] = useState<Employee | null>(null)
  const [formData, setFormData] = useState<EmployeeFormData>(emptyFormData)

  const [exportStartDate, setExportStartDate] = useState(defaultExportRange.start)
  const [exportEndDate, setExportEndDate] = useState(defaultExportRange.end)

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
        queryKey: [
          "employee-attendance-summary",
          viewMoreEmployee?.id,
          exportStartDate,
          exportEndDate,
        ],
      })
      setEditEmployee(null)
    },
  })

  const formatMoney = (amount: number | string) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(Number(amount || 0))
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

  const formatRestDays = (restDays: string | null) => {
    if (!restDays) return "-"

    return restDays
  }

  const formatStatus = (status: string) => {
    return status
      .replaceAll("_", " ")
      .split(" ")
      .map((word) => word[0]?.toUpperCase() + word.slice(1))
      .join(" ")
  }

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
  }

  const resetForm = () => {
    setFormData(emptyFormData)
  }

  const openAddModal = () => {
    resetForm()
    setIsAddOpen(true)
  }

  const openEditModal = (employee: Employee) => {
    setEditEmployee(employee)
  }

  const openViewMoreModal = (employee: Employee) => {
    const range = getCurrentExportRange()
    setExportStartDate(range.start)
    setExportEndDate(range.end)
    setViewMoreEmployee(employee)
  }

  const handleAddEmployee = (e: { preventDefault: () => void }) => {
    e.preventDefault()
    createEmployeeMutation.mutate(formData)
  }

  const handleUpdateEmployee = (e: { preventDefault: () => void }) => {
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
    const date = new Date(`${formatDate(dateValue)}T00:00:00`)

    if (Number.isNaN(date.getTime())) return "-"

    return date
      .toLocaleDateString("en-US", { weekday: "long" })
      .toUpperCase()
  }

  const getExcelDateNumber = (dateValue: string) => {
    const safeDate = formatDate(dateValue)
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
      const summaryCell = worksheet[XLSX.utils.encode_cell({ r: summaryTitleRow, c: col })]
      const bonusCell = worksheet[XLSX.utils.encode_cell({ r: bonusTitleRow, c: col })]
      const employeeCell = worksheet[XLSX.utils.encode_cell({ r: employeeTitleRow, c: col })]

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

  const filteredEmployees = employees.filter((employee) => {
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

  if (isLoading) {
    return <p className="p-4">Loading employees...</p>
  }

  if (error) {
    return <p className="p-4">Failed to load employees</p>
  }

  return (
    <div className="p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Employees</h1>
        <p className="text-sm text-gray-600">
          Manage employee records for attendance tracking
        </p>
      </div>

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <button
          onClick={openAddModal}
          className="w-fit border border-black px-4 py-2 hover:bg-gray-200"
        >
          Add Employee
        </button>

        <div className="flex flex-col gap-2 md:flex-row">
          <input
            type="text"
            placeholder="Search employee name, position, rest day, status..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="border border-black px-3 py-2 md:w-96"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-black px-3 py-2"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

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
                Employee Name ↕
              </th>
              <th className="border-r border-black px-4 py-2 text-left">
                Position ↕
              </th>
              <th className="border-r border-black px-4 py-2 text-left">
                Monthly Salary ↕
              </th>
              <th className="border-r border-black px-4 py-2 text-left">
                Rest Days ↕
              </th>
              <th className="border-r border-black px-4 py-2 text-left">
                Status ↕
              </th>
              <th className="border-r border-black px-4 py-2 text-left">
                Created At ↕
              </th>
              <th className="px-4 py-2 text-left">Actions ↕</th>
            </tr>
          </thead>

          <tbody>
            {filteredEmployees.map((employee) => (
              <tr key={employee.id} className="border-b border-black">
                <td className="border-r border-black px-4 py-2">
                  {employee.full_name}
                </td>

                <td className="border-r border-black px-4 py-2">
                  {employee.position || "-"}
                </td>

                <td className="border-r border-black px-4 py-2">
                  {formatMoney(employee.monthly_salary)}
                </td>

                <td className="border-r border-black px-4 py-2">
                  {formatRestDays(employee.rest_days)}
                </td>

                <td className="border-r border-black px-4 py-2 capitalize">
                  {employee.status}
                </td>

                <td className="border-r border-black px-4 py-2">
                  {formatDate(employee.created_at)}
                </td>

                <td className="px-4 py-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(employee)}
                      className="border border-black px-3 py-1 hover:bg-gray-200"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => openViewMoreModal(employee)}
                      className="border border-black px-3 py-1 hover:bg-gray-200"
                    >
                      View More
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {filteredEmployees.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-600">
                  No employees found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isAddOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg border border-black bg-white p-4">
            <h2 className="mb-4 text-2xl font-bold">Add Employee</h2>

            <form onSubmit={handleAddEmployee} className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Full name"
                value={formData.full_name}
                onChange={(e) =>
                  setFormData({ ...formData, full_name: e.target.value })
                }
                className="border border-black px-3 py-2"
                required
              />

              <input
                type="text"
                placeholder="Position"
                value={formData.position}
                onChange={(e) =>
                  setFormData({ ...formData, position: e.target.value })
                }
                className="border border-black px-3 py-2"
              />

              <input
                type="number"
                min={0}
                step="0.01"
                placeholder="Monthly salary"
                value={formData.monthly_salary}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    monthly_salary: Number(e.target.value),
                  })
                }
                className="border border-black px-3 py-2"
              />

              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as EmployeeStatus,
                  })
                }
                className="border border-black px-3 py-2"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              <div className="border border-black p-3">
                <p className="mb-2 font-semibold">Rest Days</p>

                <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                  {days.map((day) => (
                    <label key={day} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.rest_days.includes(day)}
                        onChange={() => toggleFormRestDay(day)}
                      />
                      {day}
                    </label>
                  ))}
                </div>
              </div>

              {createEmployeeMutation.isError && (
                <p className="border border-black px-4 py-2 text-red-600">
                  {createEmployeeMutation.error.message}
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
                  disabled={createEmployeeMutation.isPending}
                  className="border border-black px-4 py-2 hover:bg-gray-200 disabled:opacity-50"
                >
                  {createEmployeeMutation.isPending
                    ? "Saving..."
                    : "Save Employee"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editEmployee && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg border border-black bg-white p-4">
            <h2 className="mb-4 text-2xl font-bold">Edit Employee</h2>

            <form onSubmit={handleUpdateEmployee} className="flex flex-col gap-3">
              <input
                type="text"
                value={editEmployee.full_name}
                onChange={(e) =>
                  setEditEmployee({
                    ...editEmployee,
                    full_name: e.target.value,
                  })
                }
                className="border border-black px-3 py-2"
                required
              />

              <input
                type="text"
                value={editEmployee.position || ""}
                onChange={(e) =>
                  setEditEmployee({
                    ...editEmployee,
                    position: e.target.value,
                  })
                }
                className="border border-black px-3 py-2"
              />

              <input
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
                className="border border-black px-3 py-2"
              />

              <select
                value={editEmployee.status}
                onChange={(e) =>
                  setEditEmployee({
                    ...editEmployee,
                    status: e.target.value as EmployeeStatus,
                  })
                }
                className="border border-black px-3 py-2"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              <div className="border border-black p-3">
                <p className="mb-2 font-semibold">Rest Days</p>

                <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                  {days.map((day) => (
                    <label key={day} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={parseRestDays(editEmployee.rest_days).includes(
                          day
                        )}
                        onChange={() => toggleEditRestDay(day)}
                      />
                      {day}
                    </label>
                  ))}
                </div>
              </div>

              {updateEmployeeMutation.isError && (
                <p className="border border-black px-4 py-2 text-red-600">
                  {updateEmployeeMutation.error.message}
                </p>
              )}

              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditEmployee(null)}
                  className="border border-black px-4 py-2 hover:bg-gray-200"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={updateEmployeeMutation.isPending}
                  className="border border-black px-4 py-2 hover:bg-gray-200 disabled:opacity-50"
                >
                  {updateEmployeeMutation.isPending
                    ? "Saving..."
                    : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewMoreEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="flex max-h-[90vh] w-full max-w-6xl flex-col border border-black bg-white">
            <div className="border-b border-black p-4">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <h2 className="text-2xl font-bold">
                    {viewMoreEmployee.full_name}
                  </h2>
                  <p className="text-sm text-gray-600">
                    Attendance summary based on the office log book format
                  </p>
                  <p className="text-sm text-gray-600">
                    Showing records from {exportStartDate} to {exportEndDate}
                  </p>
                </div>

                <div className="flex flex-wrap items-end gap-2">
                  <div className="flex flex-col">
                    <label className="text-xs">Start Date</label>
                    <input
                      type="date"
                      value={exportStartDate}
                      onChange={(e) => setExportStartDate(e.target.value)}
                      className="border border-black px-3 py-2"
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="text-xs">End Date</label>
                    <input
                      type="date"
                      value={exportEndDate}
                      onChange={(e) => setExportEndDate(e.target.value)}
                      className="border border-black px-3 py-2"
                    />
                  </div>

                  <button
                    onClick={() => {
                      const range = getCurrentExportRange()
                      setExportStartDate(range.start)
                      setExportEndDate(range.end)
                    }}
                    className="w-fit border border-black px-4 py-2 hover:bg-gray-200"
                  >
                    Default Range
                  </button>

                  <button
                    onClick={exportEmployeeAttendanceToExcel}
                    disabled={
                      !attendanceSummary ||
                      isAttendanceSummaryLoading ||
                      !exportStartDate ||
                      !exportEndDate
                    }
                    className="w-fit border border-black px-4 py-2 hover:bg-gray-200 disabled:opacity-50"
                  >
                    Export to Excel
                  </button>

                  <button
                    onClick={() => setViewMoreEmployee(null)}
                    className="w-fit border border-black px-4 py-2 hover:bg-gray-200"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-y-auto p-4">
              {isAttendanceSummaryLoading ? (
                <p>Loading attendance summary...</p>
              ) : attendanceSummaryError ? (
                <p>Failed to load attendance summary</p>
              ) : attendanceSummary ? (
                <>
                  <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
                    <div className="border border-black px-4 py-3">
                      <p className="text-sm">Total Worked w/ OT</p>
                      <h3 className="text-2xl font-bold">
                        {attendanceSummary.summary.totalWorkedHoursWithOt}h
                      </h3>
                      <p className="text-sm text-gray-600">
                        Total hours worked including overtime
                      </p>
                    </div>

                    <div className="border border-black px-4 py-3">
                      <p className="text-sm">Overtime</p>
                      <h3 className="text-2xl font-bold">
                        {attendanceSummary.summary.overtimeHours}h
                      </h3>
                      <p className="text-sm text-gray-600">
                        Hours after scheduled time out
                      </p>
                    </div>

                    <div className="border border-black px-4 py-3">
                      <p className="text-sm">No. of Days</p>
                      <h3 className="text-2xl font-bold">
                        {attendanceSummary.summary.presentDays}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Present working days
                      </p>
                    </div>

                    <div className="border border-black px-4 py-3">
                      <p className="text-sm">Late Days</p>
                      <h3 className="text-2xl font-bold">
                        {attendanceSummary.summary.lateDays}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Total late records
                      </p>
                    </div>
                  </div>

                  <div className="mb-6 border border-black p-4">
                    <h3 className="text-xl font-bold">30-Day Bonus Check</h3>

                    <p className="mt-2">
                      <b>Status:</b>{" "}
                      {attendanceSummary.summary.bonusCandidate
                        ? "Candidate"
                        : "Not Candidate"}
                    </p>

                    <p>
                      <b>Absent Days:</b>{" "}
                      {attendanceSummary.summary.absentDays}
                    </p>

                    <p>
                      <b>Late Days:</b> {attendanceSummary.summary.lateDays}
                    </p>

                    <p>
                      <b>Total Late Hours:</b>{" "}
                      {attendanceSummary.summary.totalLateHours}h
                    </p>

                    <p className="mt-2 text-sm text-gray-600">
                      {attendanceSummary.summary.bonusNote}
                    </p>

                    <p className="mt-2 text-sm text-gray-600">
                      Bonus approval should still be reviewed by admin because
                      it can depend on lateness and company judgment.
                    </p>
                  </div>

                  <div className="mb-3">
                    <h3 className="text-xl font-bold">Office Log Book</h3>
                    <p className="text-sm text-gray-600">
                      Attendance rows based on date, time in, time out, worked
                      hours, late, overtime, and status.
                    </p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full border border-black text-sm">
                      <thead>
                        <tr className="border-b border-black">
                          <th className="border-r border-black px-4 py-2 text-left">
                            Date ↕
                          </th>
                          <th className="border-r border-black px-4 py-2 text-left">
                            Status ↕
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
                            Worked w/ OT ↕
                          </th>
                          <th className="border-r border-black px-4 py-2 text-left">
                            Regular Hours ↕
                          </th>
                          <th className="border-r border-black px-4 py-2 text-left">
                            Overtime ↕
                          </th>
                          <th className="px-4 py-2 text-left">Late ↕</th>
                        </tr>
                      </thead>

                      <tbody>
                        {attendanceSummary.logs.map((log) => (
                          <tr key={log.id} className="border-b border-black">
                            <td className="border-r border-black px-4 py-2">
                              {formatDate(log.attendance_date)}
                            </td>

                            <td className="border-r border-black px-4 py-2 capitalize">
                              {formatStatus(log.computed_status)}
                            </td>

                            <td className="border-r border-black px-4 py-2">
                              {formatTime(log.time_in)}
                            </td>

                            <td className="border-r border-black px-4 py-2">
                              {formatTime(log.time_out)}
                            </td>

                            <td className="border-r border-black px-4 py-2">
                              {formatTime(log.schedule_time_in)}
                            </td>

                            <td className="border-r border-black px-4 py-2">
                              {formatTime(log.schedule_time_out)}
                            </td>

                            <td className="border-r border-black px-4 py-2">
                              {log.break_minutes} mins
                            </td>

                            <td className="border-r border-black px-4 py-2">
                              {log.worked_hours_with_ot}h
                            </td>

                            <td className="border-r border-black px-4 py-2">
                              {log.regular_hours}h
                            </td>

                            <td className="border-r border-black px-4 py-2">
                              {log.overtime_hours}h
                            </td>

                            <td className="px-4 py-2">{log.late_hours}h</td>
                          </tr>
                        ))}

                        {attendanceSummary.logs.length === 0 && (
                          <tr>
                            <td
                              colSpan={11}
                              className="px-4 py-6 text-center text-gray-600"
                            >
                              No attendance records found for this period
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Employees