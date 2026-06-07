import { useState } from "react"
import { useQuery } from "@tanstack/react-query"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1"

type AuditLog = {
  id: number
  user_id: number | null
  user_name: string | null
  user_email: string | null
  user_role: string | null
  action: string
  module: string
  description: string | null
  ip_address: string | null
  created_at: string
}

type AuditLogsResponse = {
  auditLogs: AuditLog[]
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

const fetchAuditLogs = async (): Promise<AuditLog[]> => {
  const res = await fetch(`${API_URL}/audit-logs`, {
    credentials: "include",
  })

  if (!res.ok) {
    throw new Error(await getErrorMessage(res))
  }

  const data: AuditLogsResponse = await res.json()
  return data.auditLogs
}

const AuditLogs = () => {
  const [searchInput, setSearchInput] = useState("")
  const [actionFilter, setActionFilter] = useState("all")
  const [moduleFilter, setModuleFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("")

  const {
    data: auditLogs = [],
    isLoading,
    error,
  } = useQuery<AuditLog[]>({
    queryKey: ["audit-logs"],
    queryFn: fetchAuditLogs,
  })

  const formatText = (value: string | null | undefined) => {
    if (!value) return "-"

    return value
      .replaceAll("_", " ")
      .split(" ")
      .map((word) => word[0]?.toUpperCase() + word.slice(1))
      .join(" ")
  }

  const formatDateTime = (date: string | null) => {
    if (!date) return "-"

    return new Date(date).toLocaleString("en-PH", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatDateOnly = (date: string | null) => {
    if (!date) return "-"

    return date.slice(0, 10)
  }

  const resetFilters = () => {
    setSearchInput("")
    setActionFilter("all")
    setModuleFilter("all")
    setDateFilter("")
  }

  const actions = [
    ...new Set(auditLogs.map((log) => log.action).filter(Boolean)),
  ]

  const modules = [
    ...new Set(auditLogs.map((log) => log.module).filter(Boolean)),
  ]

  const filteredLogs = auditLogs.filter((log) => {
    const search = searchInput.toLowerCase().trim()

    const matchesSearch =
      search === "" ||
      (log.user_name || "").toLowerCase().includes(search) ||
      (log.user_email || "").toLowerCase().includes(search) ||
      (log.user_role || "").toLowerCase().includes(search) ||
      log.action.toLowerCase().includes(search) ||
      log.module.toLowerCase().includes(search) ||
      (log.description || "").toLowerCase().includes(search) ||
      (log.ip_address || "").toLowerCase().includes(search)

    const matchesAction =
      actionFilter === "all" || log.action === actionFilter

    const matchesModule =
      moduleFilter === "all" || log.module === moduleFilter

    const matchesDate =
      dateFilter === "" || formatDateOnly(log.created_at) === dateFilter

    return matchesSearch && matchesAction && matchesModule && matchesDate
  })

  if (isLoading) {
    return <p className="p-4">Loading audit logs...</p>
  }

  if (error) {
    return <p className="p-4">Failed to load audit logs</p>
  }

  return (
    <div className="p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Audit Logs</h1>
        <p className="text-sm text-gray-600">
          Track user actions and system activity from MySQL
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="border border-black px-4 py-3">
          <p className="text-sm">Total Logs</p>
          <h3 className="text-2xl font-bold">{auditLogs.length}</h3>
          <p className="text-sm text-gray-600">All recorded system actions</p>
        </div>

        <div className="border border-black px-4 py-3">
          <p className="text-sm">Filtered Logs</p>
          <h3 className="text-2xl font-bold">{filteredLogs.length}</h3>
          <p className="text-sm text-gray-600">Currently visible records</p>
        </div>

        <div className="border border-black px-4 py-3">
          <p className="text-sm">Modules</p>
          <h3 className="text-2xl font-bold">{modules.length}</h3>
          <p className="text-sm text-gray-600">Modules with recorded actions</p>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2 md:flex-row">
          <input
            type="text"
            placeholder="Search user, action, module, description, IP..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="border border-black px-3 py-2 md:w-96"
          />

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="border border-black px-3 py-2"
          >
            <option value="all">All Actions</option>
            {actions.map((action) => (
              <option key={action} value={action}>
                {formatText(action)}
              </option>
            ))}
          </select>

          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="border border-black px-3 py-2"
          >
            <option value="all">All Modules</option>
            {modules.map((module) => (
              <option key={module} value={module}>
                {module}
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
                User ↕
              </th>
              <th className="border-r border-black px-4 py-2 text-left">
                Email ↕
              </th>
              <th className="border-r border-black px-4 py-2 text-left">
                Role ↕
              </th>
              <th className="border-r border-black px-4 py-2 text-left">
                Action ↕
              </th>
              <th className="border-r border-black px-4 py-2 text-left">
                Module ↕
              </th>
              <th className="border-r border-black px-4 py-2 text-left">
                Description ↕
              </th>
              <th className="border-r border-black px-4 py-2 text-left">
                IP Address ↕
              </th>
              <th className="px-4 py-2 text-left">Date ↕</th>
            </tr>
          </thead>

          <tbody>
            {filteredLogs.map((log) => (
              <tr key={log.id} className="border-b border-black">
                <td className="border-r border-black px-4 py-2">
                  {log.user_name || "-"}
                </td>

                <td className="border-r border-black px-4 py-2">
                  {log.user_email || "-"}
                </td>

                <td className="border-r border-black px-4 py-2">
                  {formatText(log.user_role)}
                </td>

                <td className="border-r border-black px-4 py-2">
                  {formatText(log.action)}
                </td>

                <td className="border-r border-black px-4 py-2">
                  {log.module}
                </td>

                <td className="border-r border-black px-4 py-2">
                  {log.description || "-"}
                </td>

                <td className="border-r border-black px-4 py-2">
                  {log.ip_address || "-"}
                </td>

                <td className="px-4 py-2">
                  {formatDateTime(log.created_at)}
                </td>
              </tr>
            ))}

            {filteredLogs.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-gray-600">
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