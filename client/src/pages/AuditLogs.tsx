import { useState } from "react"

type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "login"
  | "logout"
  | "reserve"
  | "payment"
  | "document_check"

type AuditLog = {
  id: number
  user: string
  action: AuditAction
  module: string
  description: string
  ipAddress: string
  createdAt: string
}

const AuditLogs = () => {
  const [logs] = useState<AuditLog[]>([
    {
      id: 1,
      user: "christopher prime",
      action: "login",
      module: "Auth",
      description: "Admin logged in",
      ipAddress: "127.0.0.1",
      createdAt: "2026-06-06 09:12:00",
    },
    {
      id: 2,
      user: "christopher prime",
      action: "create",
      module: "Projects",
      description: "Created project Luntiang Aguinaldo",
      ipAddress: "127.0.0.1",
      createdAt: "2026-06-06 09:30:00",
    },
    {
      id: 3,
      user: "christopher prime",
      action: "reserve",
      module: "Client Units",
      description: "Reserved unit LA-0416 for AHMED, SARAH NACINO",
      ipAddress: "127.0.0.1",
      createdAt: "2026-06-06 10:15:00",
    },
    {
      id: 4,
      user: "christopher prime",
      action: "document_check",
      module: "Documents",
      description: "Marked Reservation Agreement as submitted",
      ipAddress: "127.0.0.1",
      createdAt: "2026-06-06 10:40:00",
    },
  ])

  const [searchInput, setSearchInput] = useState("")
  const [actionFilter, setActionFilter] = useState<"all" | AuditAction>("all")

  const filteredLogs = logs.filter((log) => {
    const search = searchInput.toLowerCase().trim()

    const matchesSearch =
      search === "" ||
      log.user.toLowerCase().includes(search) ||
      log.action.toLowerCase().includes(search) ||
      log.module.toLowerCase().includes(search) ||
      log.description.toLowerCase().includes(search) ||
      log.ipAddress.toLowerCase().includes(search) ||
      log.createdAt.toLowerCase().includes(search)

    const matchesAction = actionFilter === "all" || log.action === actionFilter

    return matchesSearch && matchesAction
  })

  return (
    <div className="p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Audit Logs</h1>
        <p className="text-sm text-gray-600">
          Track user actions and system activity
        </p>
      </div>

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2 md:flex-row">
          <input
            type="text"
            placeholder="Search user, module, action, description..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="border border-black px-3 py-2 md:w-96"
          />

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value as "all" | AuditAction)}
            className="border border-black px-3 py-2"
          >
            <option value="all">All Actions</option>
            <option value="create">Create</option>
            <option value="update">Update</option>
            <option value="delete">Delete</option>
            <option value="login">Login</option>
            <option value="logout">Logout</option>
            <option value="reserve">Reserve</option>
            <option value="payment">Payment</option>
            <option value="document_check">Document Check</option>
          </select>

          <button
            onClick={() => {
              setSearchInput("")
              setActionFilter("all")
            }}
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
              <th className="border-r border-black px-4 py-2 text-left">User ↕</th>
              <th className="border-r border-black px-4 py-2 text-left">Action ↕</th>
              <th className="border-r border-black px-4 py-2 text-left">Module ↕</th>
              <th className="border-r border-black px-4 py-2 text-left">Description ↕</th>
              <th className="border-r border-black px-4 py-2 text-left">IP Address ↕</th>
              <th className="px-4 py-2 text-left">Date ↕</th>
            </tr>
          </thead>

          <tbody>
            {filteredLogs.map((log) => (
              <tr key={log.id} className="border-b border-black">
                <td className="border-r border-black px-4 py-2">{log.user}</td>
                <td className="border-r border-black px-4 py-2 capitalize">
                  {log.action.replace("_", " ")}
                </td>
                <td className="border-r border-black px-4 py-2">{log.module}</td>
                <td className="border-r border-black px-4 py-2">{log.description}</td>
                <td className="border-r border-black px-4 py-2">{log.ipAddress}</td>
                <td className="px-4 py-2">{log.createdAt}</td>
              </tr>
            ))}

            {filteredLogs.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-600">
                  No audit logs found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AuditLogs