import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { FiActivity, FiRefreshCw, FiSearch } from "react-icons/fi"
import Alert from "../components/ui/Alert"
import Button from "../components/ui/Button"
import EmptyState from "../components/ui/EmptyState"
import Input from "../components/ui/Input"
import LoadingState from "../components/ui/LoadingState"
import PageHeader from "../components/ui/PageHeader"
import Pagination from "../components/ui/Pagination"
import Select from "../components/ui/Select"
import StatCard from "../components/ui/StatCard"
import TableContainer from "../components/ui/TableContainer"
import { API_URL, getErrorMessage } from "../utils/api"
import { formatDate, formatNumber, formatText } from "../utils/formatters"
import { paginateRows } from "../utils/pagination"

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

const AuditLogs = () => {
  const [searchInput, setSearchInput] = useState("")
  const [actionFilter, setActionFilter] = useState("all")
  const [moduleFilter, setModuleFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("")
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const {
    data: auditLogs = [],
    isLoading,
    error,
  } = useQuery<AuditLog[]>({
    queryKey: ["audit-logs"],
    queryFn: fetchAuditLogs,
  })

  const actions = useMemo(
    () => [...new Set(auditLogs.map((log) => log.action).filter(Boolean))],
    [auditLogs]
  )
  const modules = useMemo(
    () => [...new Set(auditLogs.map((log) => log.module).filter(Boolean))],
    [auditLogs]
  )

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
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
        dateFilter === "" || formatDate(log.created_at) === dateFilter

      return matchesSearch && matchesAction && matchesModule && matchesDate
    })
  }, [actionFilter, auditLogs, dateFilter, moduleFilter, searchInput])

  const paginatedLogs = paginateRows(filteredLogs, page, rowsPerPage)

  const resetFilters = () => {
    setSearchInput("")
    setActionFilter("all")
    setModuleFilter("all")
    setDateFilter("")
    setPage(1)
  }

  if (isLoading) {
    return <LoadingState label="Loading audit logs..." />
  }

  if (error) {
    return <Alert title="Failed to load audit logs" variant="error" />
  }

  return (
    <div className="p-4 sm:p-6">
      <PageHeader
        icon={<FiActivity />}
        title="Audit Logs"
        subtitle="Track user actions and system activity from MySQL"
      />

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard label="Total Logs" value={formatNumber(auditLogs.length)} />
        <StatCard
          label="Filtered Logs"
          value={formatNumber(filteredLogs.length)}
        />
        <StatCard label="Modules" value={formatNumber(modules.length)} />
        <StatCard label="Actions" value={formatNumber(actions.length)} />
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_180px_180px_180px_auto]">
        <Input
          icon={<FiSearch />}
          placeholder="Search user, action, module, description, or IP..."
          value={searchInput}
          onChange={(e) => {
            setSearchInput(e.target.value)
            setPage(1)
          }}
        />
        <Select
          value={actionFilter}
          onChange={(e) => {
            setActionFilter(e.target.value)
            setPage(1)
          }}
        >
          <option value="all">All Actions</option>
          {actions.map((action) => (
            <option key={action} value={action}>
              {formatText(action)}
            </option>
          ))}
        </Select>
        <Select
          value={moduleFilter}
          onChange={(e) => {
            setModuleFilter(e.target.value)
            setPage(1)
          }}
        >
          <option value="all">All Modules</option>
          {modules.map((module) => (
            <option key={module} value={module}>
              {module}
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
                User
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">
                Email
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">
                Role
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">
                Action
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">
                Module
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">
                Description
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">
                IP Address
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {paginatedLogs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-semibold text-slate-900">
                  {log.user_name || "-"}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {log.user_email || "-"}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {formatText(log.user_role)}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {formatText(log.action)}
                </td>
                <td className="px-4 py-3 text-slate-600">{log.module}</td>
                <td className="max-w-md px-4 py-3 text-slate-600">
                  {log.description || "-"}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {log.ip_address || "-"}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {formatDateTime(log.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredLogs.length === 0 ? (
          <EmptyState
            title="No audit logs found"
            description="Try clearing filters to broaden the audit trail."
          />
        ) : null}
      </TableContainer>

      <Pagination
        page={page}
        rowsPerPage={rowsPerPage}
        totalRows={filteredLogs.length}
        onPageChange={setPage}
        onRowsPerPageChange={setRowsPerPage}
      />
    </div>
  )
}

export default AuditLogs
