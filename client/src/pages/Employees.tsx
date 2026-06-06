import { useState } from "react"

type EmployeeStatus = "active" | "inactive"

type Employee = {
  id: number
  fullName: string
  position: string
  monthlySalary: number
  status: EmployeeStatus
  createdAt: string
}

const Employees = () => {
  const [employees, setEmployees] = useState<Employee[]>([
    {
      id: 1,
      fullName: "JUAN DELA CRUZ",
      position: "Admin Staff",
      monthlySalary: 25000,
      status: "active",
      createdAt: "2026-06-06",
    },
    {
      id: 2,
      fullName: "MARIA SANTOS",
      position: "Treasury Staff",
      monthlySalary: 28000,
      status: "active",
      createdAt: "2026-06-06",
    },
  ])

  const [searchInput, setSearchInput] = useState("")
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null)

  const [formData, setFormData] = useState({
    fullName: "",
    position: "",
    monthlySalary: 0,
    status: "active" as EmployeeStatus,
  })

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount)
  }

  const resetForm = () => {
    setFormData({
      fullName: "",
      position: "",
      monthlySalary: 0,
      status: "active",
    })
  }

  const handleAddEmployee = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const newEmployee: Employee = {
      id: employees.length + 1,
      ...formData,
      createdAt: new Date().toISOString().slice(0, 10),
    }

    setEmployees((prev) => [...prev, newEmployee])
    resetForm()
    setIsAddOpen(false)
  }

  const handleUpdateEmployee = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!editEmployee) return

    setEmployees((prev) =>
      prev.map((employee) =>
        employee.id === editEmployee.id ? editEmployee : employee
      )
    )

    setEditEmployee(null)
  }

  const filteredEmployees = employees.filter((employee) => {
    const search = searchInput.toLowerCase().trim()

    return (
      search === "" ||
      employee.fullName.toLowerCase().includes(search) ||
      employee.position.toLowerCase().includes(search) ||
      employee.status.toLowerCase().includes(search) ||
      employee.createdAt.toLowerCase().includes(search)
    )
  })

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
          onClick={() => setIsAddOpen(true)}
          className="w-fit border border-black px-4 py-2 hover:bg-gray-200"
        >
          Add Employee
        </button>

        <div className="flex flex-col gap-2 md:flex-row">
          <input
            type="text"
            placeholder="Search employee name, position, status..."
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
                Employee Name ↕
              </th>
              <th className="border-r border-black px-4 py-2 text-left">
                Position ↕
              </th>
              <th className="border-r border-black px-4 py-2 text-left">
                Monthly Salary ↕
              </th>
              <th className="border-r border-black px-4 py-2 text-left">
                Status ↕
              </th>
              <th className="border-r border-black px-4 py-2 text-left">
                Created At ↕
              </th>
              <th className="px-4 py-2 text-left">
                Actions ↕
              </th>
            </tr>
          </thead>

          <tbody>
            {filteredEmployees.map((employee) => (
              <tr key={employee.id} className="border-b border-black">
                <td className="border-r border-black px-4 py-2">
                  {employee.fullName}
                </td>

                <td className="border-r border-black px-4 py-2">
                  {employee.position || "-"}
                </td>

                <td className="border-r border-black px-4 py-2">
                  {formatMoney(employee.monthlySalary)}
                </td>

                <td className="border-r border-black px-4 py-2 capitalize">
                  {employee.status}
                </td>

                <td className="border-r border-black px-4 py-2">
                  {employee.createdAt}
                </td>

                <td className="px-4 py-2">
                  <button
                    onClick={() => setEditEmployee(employee)}
                    className="border border-black px-3 py-1 hover:bg-gray-200"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}

            {filteredEmployees.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-600">
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
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
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
                placeholder="Monthly salary"
                value={formData.monthlySalary}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    monthlySalary: Number(e.target.value),
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
                  Save Employee
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
                value={editEmployee.fullName}
                onChange={(e) =>
                  setEditEmployee({
                    ...editEmployee,
                    fullName: e.target.value,
                  })
                }
                className="border border-black px-3 py-2"
                required
              />

              <input
                type="text"
                value={editEmployee.position}
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
                value={editEmployee.monthlySalary}
                onChange={(e) =>
                  setEditEmployee({
                    ...editEmployee,
                    monthlySalary: Number(e.target.value),
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

export default Employees