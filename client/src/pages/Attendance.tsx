import { useState } from "react"

type Employee = {
  id: number
  fullName: string
  position: string
}

type AttendanceRecord = {
  id: number
  employeeId: number
  employeeName: string
  position: string
  attendanceDate: string
  timeIn: string
  timeOut: string
  scheduleTimeIn: string
  scheduleTimeOut: string
}

const Attendance = () => {
  const employees: Employee[] = [
    {
      id: 1,
      fullName: "JUAN DELA CRUZ",
      position: "Admin Staff",
    },
    {
      id: 2,
      fullName: "MARIA SANTOS",
      position: "Treasury Staff",
    },
  ]

  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([
    {
      id: 1,
      employeeId: 1,
      employeeName: "JUAN DELA CRUZ",
      position: "Admin Staff",
      attendanceDate: "2026-06-06",
      timeIn: "08:00",
      timeOut: "17:00",
      scheduleTimeIn: "08:00",
      scheduleTimeOut: "17:00",
    },
    {
      id: 2,
      employeeId: 2,
      employeeName: "MARIA SANTOS",
      position: "Treasury Staff",
      attendanceDate: "2026-06-06",
      timeIn: "08:15",
      timeOut: "17:05",
      scheduleTimeIn: "08:00",
      scheduleTimeOut: "17:00",
    },
  ])

  const [searchInput, setSearchInput] = useState("")
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editAttendance, setEditAttendance] =
    useState<AttendanceRecord | null>(null)

  const [formData, setFormData] = useState({
    employeeId: 1,
    attendanceDate: new Date().toISOString().slice(0, 10),
    timeIn: "",
    timeOut: "",
    scheduleTimeIn: "08:00",
    scheduleTimeOut: "17:00",
  })

  const getEmployee = (employeeId: number) => {
    return employees.find((employee) => employee.id === employeeId)
  }

  const resetForm = () => {
    setFormData({
      employeeId: 1,
      attendanceDate: new Date().toISOString().slice(0, 10),
      timeIn: "",
      timeOut: "",
      scheduleTimeIn: "08:00",
      scheduleTimeOut: "17:00",
    })
  }

  const getWorkHours = (timeIn: string, timeOut: string) => {
    if (!timeIn || !timeOut) return "-"

    const [inHour, inMinute] = timeIn.split(":").map(Number)
    const [outHour, outMinute] = timeOut.split(":").map(Number)

    const inTotalMinutes = inHour * 60 + inMinute
    const outTotalMinutes = outHour * 60 + outMinute

    const diffMinutes = outTotalMinutes - inTotalMinutes

    if (diffMinutes <= 0) return "-"

    const hours = Math.floor(diffMinutes / 60)
    const minutes = diffMinutes % 60

    return `${hours}h ${minutes}m`
  }

  const getAttendanceStatus = (
    timeIn: string,
    scheduleTimeIn: string
  ) => {
    if (!timeIn) return "No Time In"

    return timeIn > scheduleTimeIn ? "Late" : "On Time"
  }

  const handleAddAttendance = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const selectedEmployee = getEmployee(formData.employeeId)

    if (!selectedEmployee) return

    const newAttendance: AttendanceRecord = {
      id: attendanceRecords.length + 1,
      employeeId: formData.employeeId,
      employeeName: selectedEmployee.fullName,
      position: selectedEmployee.position,
      attendanceDate: formData.attendanceDate,
      timeIn: formData.timeIn,
      timeOut: formData.timeOut,
      scheduleTimeIn: formData.scheduleTimeIn,
      scheduleTimeOut: formData.scheduleTimeOut,
    }

    setAttendanceRecords((prev) => [...prev, newAttendance])
    resetForm()
    setIsAddOpen(false)
  }

  const handleUpdateAttendance = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!editAttendance) return

    const selectedEmployee = getEmployee(editAttendance.employeeId)

    if (!selectedEmployee) return

    setAttendanceRecords((prev) =>
      prev.map((attendance) =>
        attendance.id === editAttendance.id
          ? {
              ...editAttendance,
              employeeName: selectedEmployee.fullName,
              position: selectedEmployee.position,
            }
          : attendance
      )
    )

    setEditAttendance(null)
  }

  const filteredAttendance = attendanceRecords.filter((attendance) => {
    const search = searchInput.toLowerCase().trim()

    return (
      search === "" ||
      attendance.employeeName.toLowerCase().includes(search) ||
      attendance.position.toLowerCase().includes(search) ||
      attendance.attendanceDate.toLowerCase().includes(search) ||
      attendance.timeIn.toLowerCase().includes(search) ||
      attendance.timeOut.toLowerCase().includes(search)
    )
  })

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
          onClick={() => setIsAddOpen(true)}
          className="w-fit border border-black px-4 py-2 hover:bg-gray-200"
        >
          Add Attendance
        </button>

        <div className="flex flex-col gap-2 md:flex-row">
          <input
            type="text"
            placeholder="Search employee, position, date, time..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="border border-black px-3 py-2 md:w-96"
          />

          <button
            onClick={() => setSearchInput("")}
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
                Work Hours ↕
              </th>
              <th className="border-r border-black px-4 py-2 text-left">
                Status ↕
              </th>
              <th className="px-4 py-2 text-left">
                Actions ↕
              </th>
            </tr>
          </thead>

          <tbody>
            {filteredAttendance.map((attendance) => (
              <tr key={attendance.id} className="border-b border-black">
                <td className="border-r border-black px-4 py-2">
                  {attendance.employeeName}
                </td>

                <td className="border-r border-black px-4 py-2">
                  {attendance.position || "-"}
                </td>

                <td className="border-r border-black px-4 py-2">
                  {attendance.attendanceDate}
                </td>

                <td className="border-r border-black px-4 py-2">
                  {attendance.timeIn || "-"}
                </td>

                <td className="border-r border-black px-4 py-2">
                  {attendance.timeOut || "-"}
                </td>

                <td className="border-r border-black px-4 py-2">
                  {attendance.scheduleTimeIn || "-"}
                </td>

                <td className="border-r border-black px-4 py-2">
                  {attendance.scheduleTimeOut || "-"}
                </td>

                <td className="border-r border-black px-4 py-2">
                  {getWorkHours(attendance.timeIn, attendance.timeOut)}
                </td>

                <td className="border-r border-black px-4 py-2">
                  {getAttendanceStatus(
                    attendance.timeIn,
                    attendance.scheduleTimeIn
                  )}
                </td>

                <td className="px-4 py-2">
                  <button
                    onClick={() => setEditAttendance(attendance)}
                    className="border border-black px-3 py-1 hover:bg-gray-200"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}

            {filteredAttendance.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-6 text-center text-gray-600">
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
                value={formData.employeeId}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    employeeId: Number(e.target.value),
                  })
                }
                className="border border-black px-3 py-2"
              >
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.fullName}
                  </option>
                ))}
              </select>

              <input
                type="date"
                value={formData.attendanceDate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    attendanceDate: e.target.value,
                  })
                }
                className="border border-black px-3 py-2"
                required
              />

              <input
                type="time"
                value={formData.timeIn}
                onChange={(e) =>
                  setFormData({ ...formData, timeIn: e.target.value })
                }
                className="border border-black px-3 py-2"
              />

              <input
                type="time"
                value={formData.timeOut}
                onChange={(e) =>
                  setFormData({ ...formData, timeOut: e.target.value })
                }
                className="border border-black px-3 py-2"
              />

              <input
                type="time"
                value={formData.scheduleTimeIn}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    scheduleTimeIn: e.target.value,
                  })
                }
                className="border border-black px-3 py-2"
              />

              <input
                type="time"
                value={formData.scheduleTimeOut}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    scheduleTimeOut: e.target.value,
                  })
                }
                className="border border-black px-3 py-2"
              />

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
                  className="border border-black px-4 py-2 hover:bg-gray-200"
                >
                  Save Attendance
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
                value={editAttendance.employeeId}
                onChange={(e) =>
                  setEditAttendance({
                    ...editAttendance,
                    employeeId: Number(e.target.value),
                  })
                }
                className="border border-black px-3 py-2"
              >
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.fullName}
                  </option>
                ))}
              </select>

              <input
                type="date"
                value={editAttendance.attendanceDate}
                onChange={(e) =>
                  setEditAttendance({
                    ...editAttendance,
                    attendanceDate: e.target.value,
                  })
                }
                className="border border-black px-3 py-2"
                required
              />

              <input
                type="time"
                value={editAttendance.timeIn}
                onChange={(e) =>
                  setEditAttendance({
                    ...editAttendance,
                    timeIn: e.target.value,
                  })
                }
                className="border border-black px-3 py-2"
              />

              <input
                type="time"
                value={editAttendance.timeOut}
                onChange={(e) =>
                  setEditAttendance({
                    ...editAttendance,
                    timeOut: e.target.value,
                  })
                }
                className="border border-black px-3 py-2"
              />

              <input
                type="time"
                value={editAttendance.scheduleTimeIn}
                onChange={(e) =>
                  setEditAttendance({
                    ...editAttendance,
                    scheduleTimeIn: e.target.value,
                  })
                }
                className="border border-black px-3 py-2"
              />

              <input
                type="time"
                value={editAttendance.scheduleTimeOut}
                onChange={(e) =>
                  setEditAttendance({
                    ...editAttendance,
                    scheduleTimeOut: e.target.value,
                  })
                }
                className="border border-black px-3 py-2"
              />

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
                  className="border border-black px-4 py-2 hover:bg-gray-200"
                >
                  Save Changes
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