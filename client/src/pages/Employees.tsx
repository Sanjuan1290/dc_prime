import { useState, type FormEvent } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

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

const parseRestDays = (restDays: string | null) => {
  if (!restDays) return []

  return restDays
    .split(",")
    .map((day) => day.trim())
    .filter(Boolean)
}

const Employees = () => {
  const queryClient = useQueryClient()

  const [searchInput, setSearchInput] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null)
  const [formData, setFormData] = useState<EmployeeFormData>(emptyFormData)

  const {
    data: employees = [],
    isLoading,
    error,
  } = useQuery<Employee[]>({
    queryKey: ["employees"],
    queryFn: fetchEmployees,
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
      setEditEmployee(null)
    },
  })

  const formatMoney = (amount: number | string) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(Number(amount || 0))
  }

  const formatDate = (date: string) => {
    if (!date) return "-"

    return date.slice(0, 10)
  }

  const formatRestDays = (restDays: string | null) => {
    if (!restDays) return "-"

    return restDays
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
                  <button
                    onClick={() => openEditModal(employee)}
                    className="border border-black px-3 py-1 hover:bg-gray-200"
                  >
                    Edit
                  </button>
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
    </div>
  )
}

export default Employees