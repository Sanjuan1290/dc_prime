import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { FiSearch, FiUserCheck, FiUsers } from "react-icons/fi"
import Alert from "../components/ui/Alert"
import EmptyState from "../components/ui/EmptyState"
import Input from "../components/ui/Input"
import LoadingState from "../components/ui/LoadingState"
import PageHeader from "../components/ui/PageHeader"
import Pagination from "../components/ui/Pagination"
import Select from "../components/ui/Select"
import StatCard from "../components/ui/StatCard"
import StatusBadge from "../components/ui/StatusBadge"
import TableContainer from "../components/ui/TableContainer"
import { API_URL, getErrorMessage } from "../utils/api"
import { formatDate, formatNumber, formatText } from "../utils/formatters"
import { paginateRows } from "../utils/pagination"

type AccreditedSeller = {
  id: number
  user_id: number | null
  user_full_name?: string | null
  full_name: string
  email: string | null
  contact_no: string | null
  seller_role: string
  parent_seller_id: number | null
  parent_seller_name: string | null
  reports_under_display: string | null
  status: string
  accreditation_date: string | null
  commission_rate: number | string | null
  commission_pool_rate?: number | string | null
  personal_commission_rate?: number | string | null
  direct_to_developer_rate?: number | string | null
  rate_set_by_name?: string | null
  rate_updated_at?: string | null
  created_at: string
}

type SellersResponse = {
  accreditedSellers?: AccreditedSeller[]
  sellers?: AccreditedSeller[]
  data?: AccreditedSeller[]
}

const sellerStatuses = ["active", "inactive"]

const fetchSellers = async (): Promise<AccreditedSeller[]> => {
  const response = await fetch(`${API_URL}/accredited-sellers`, {
    credentials: "include",
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }

  const data = (await response.json()) as SellersResponse
  return data.accreditedSellers || data.sellers || data.data || []
}

const formatRate = (rate: number | string | null | undefined) => {
  if (rate === null || rate === undefined || rate === "") return "-"
  return `${formatNumber(rate)}%`
}

const getHierarchyPath = (seller: AccreditedSeller) => {
  if (seller.reports_under_display) return seller.reports_under_display
  if (seller.parent_seller_name) return seller.parent_seller_name
  return "Company / None"
}

const getCommissionSetup = (seller: AccreditedSeller) => {
  if (seller.seller_role === "broker_network_manager") {
    return <>BNM Pool: <span className="font-semibold text-slate-900">{formatRate(seller.commission_pool_rate)}</span></>
  }

  if (seller.seller_role === "broker") {
    return <>Broker Pool: <span className="font-semibold text-slate-900">{formatRate(seller.commission_pool_rate)}</span></>
  }

  if (seller.seller_role === "manager") {
    return <>Manager Rate: <span className="font-semibold text-slate-900">{formatRate(seller.personal_commission_rate || seller.commission_rate)}</span></>
  }

  return (
    <>
      Agent Rate: <span className="font-semibold text-slate-900">{formatRate(seller.personal_commission_rate || seller.commission_rate)}</span>
      <br />
      Direct Developer: <span className="font-semibold text-slate-900">{formatRate(seller.direct_to_developer_rate || seller.personal_commission_rate || seller.commission_rate)}</span>
    </>
  )
}

const AccredittedSellers = () => {
  const [searchInput, setSearchInput] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const {
    data: sellers = [],
    isLoading,
    error,
  } = useQuery<AccreditedSeller[]>({
    queryKey: ["accredited-sellers"],
    queryFn: fetchSellers,
  })

  const filteredSellers = useMemo(() => {
    const searchTerm = searchInput.toLowerCase().trim()

    return sellers.filter((seller) => {
      const matchesSearch = !searchTerm || [
        seller.full_name,
        seller.email,
        seller.contact_no,
        seller.seller_role,
        seller.parent_seller_name,
        seller.reports_under_display,
        seller.user_full_name,
        seller.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(searchTerm)

      const matchesRole = roleFilter === "all" || seller.seller_role === roleFilter
      const matchesStatus = statusFilter === "all" || seller.status === statusFilter

      return matchesSearch && matchesRole && matchesStatus
    })
  }, [roleFilter, searchInput, sellers, statusFilter])

  const paginatedSellers = useMemo(
    () => paginateRows(filteredSellers, page, rowsPerPage),
    [filteredSellers, page, rowsPerPage]
  )

  const stats = useMemo(() => {
    return {
      total: sellers.length,
      active: sellers.filter((seller) => seller.status === "active").length,
      inactive: sellers.filter((seller) => seller.status !== "active").length,
      bnm: sellers.filter((seller) => seller.seller_role === "broker_network_manager").length,
      brokers: sellers.filter((seller) => seller.seller_role === "broker").length,
      managers: sellers.filter((seller) => seller.seller_role === "manager").length,
      agents: sellers.filter((seller) => seller.seller_role === "agent").length,
    }
  }, [sellers])

  const roleStats = [
    { label: "BNM", value: stats.bnm, role: "Broker Network Manager" },
    { label: "Brokers", value: stats.brokers, role: "Broker group leaders" },
    { label: "Managers", value: stats.managers, role: "Unit managers" },
    { label: "Agents", value: stats.agents, role: "Frontline sellers" },
  ]

  return (
    <div className="p-6">
      <PageHeader
        icon={<FiUsers />}
        title="Accredited Sellers"
        subtitle="Read-only seller directory. Edit accounts, basic info, hierarchy, and commission rates in User Management."
      />

      {error ? (
        <Alert
          variant="error"
          title={error instanceof Error ? error.message : "Failed to load sellers"}
        />
      ) : null}

      <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1.6fr]">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            icon={<FiUserCheck />}
            label="Total Sellers"
            value={stats.total}
            description="All accredited seller records"
          />
          <StatCard
            icon={<FiUserCheck />}
            label="Active"
            value={stats.active}
            description="Can be assigned to clients"
          />
          <StatCard
            icon={<FiUserCheck />}
            label="Inactive"
            value={stats.inactive}
            description="Hidden from active assignment"
          />
        </div>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
                Role Breakdown
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Count per commission hierarchy level.
              </p>
            </div>
            <div className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-bold text-blue-700">
              {formatNumber(stats.total)} total
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {roleStats.map((item) => (
              <div
                className="rounded-xl border border-slate-100 bg-slate-50 p-4"
                key={item.label}
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {item.label}
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {formatNumber(item.value)}
                </p>
                <p className="mt-1 text-xs text-slate-500">{item.role}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-[1fr_220px_220px]">
        <Input
          icon={<FiSearch />}
          placeholder="Search sellers, users, roles, or reports under..."
          value={searchInput}
          onChange={(event) => {
            setSearchInput(event.target.value)
            setPage(1)
          }}
        />

        <Select
          value={roleFilter}
          onChange={(event) => {
            setRoleFilter(event.target.value)
            setPage(1)
          }}
        >
          <option value="all">All roles</option>
          <option value="broker_network_manager">Broker Network Manager</option>
          <option value="broker">Broker</option>
          <option value="manager">Manager</option>
          <option value="agent">Agent</option>
        </Select>

        <Select
          value={statusFilter}
          onChange={(event) => {
            setStatusFilter(event.target.value)
            setPage(1)
          }}
        >
          <option value="all">All statuses</option>
          {sellerStatuses.map((status) => (
            <option key={status} value={status}>{formatText(status)}</option>
          ))}
        </Select>
      </div>

      {isLoading ? <LoadingState label="Loading accredited sellers..." /> : null}

      <TableContainer>
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr className="border-b border-slate-200 text-slate-600">
              <th className="px-4 py-3 text-left">Seller</th>
              <th className="px-4 py-3 text-left">Contact</th>
              <th className="px-4 py-3 text-left">Role</th>
              <th className="px-4 py-3 text-left">Reports Under</th>
              <th className="px-4 py-3 text-left">Commission Setup</th>
              <th className="px-4 py-3 text-left">Accreditation</th>
              <th className="px-4 py-3 text-left">Status</th>
            </tr>
          </thead>

          <tbody>
            {paginatedSellers.map((seller) => (
              <tr key={seller.id} className="border-b border-slate-100">
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-900">{seller.full_name}</p>
                  <p className="text-xs text-slate-500">User: {seller.user_full_name || "Not linked"}</p>
                </td>

                <td className="px-4 py-3 text-slate-600">
                  <p>{seller.email || "-"}</p>
                  <p className="text-xs text-slate-500">{seller.contact_no || "-"}</p>
                </td>

                <td className="px-4 py-3 text-slate-600">{formatText(seller.seller_role)}</td>

                <td className="px-4 py-3 text-slate-600">
                  <p>{getHierarchyPath(seller)}</p>
                  <p className="text-xs text-slate-500">Managed through User Management</p>
                </td>

                <td className="px-4 py-3 text-slate-600">
                  {getCommissionSetup(seller)}
                  {seller.rate_updated_at ? (
                    <p className="mt-1 text-xs text-slate-400">
                      Updated {formatDate(seller.rate_updated_at)} by {seller.rate_set_by_name || "system"}
                    </p>
                  ) : null}
                </td>

                <td className="px-4 py-3 text-slate-600">{formatDate(seller.accreditation_date)}</td>

                <td className="px-4 py-3"><StatusBadge status={seller.status} /></td>
              </tr>
            ))}

            {paginatedSellers.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <EmptyState
                    title="No sellers found"
                    description="Create broker, manager, and agent accounts from User Management. Seller records will be linked automatically."
                  />
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </TableContainer>

      <Pagination
        page={page}
        rowsPerPage={rowsPerPage}
        totalRows={filteredSellers.length}
        onPageChange={setPage}
        onRowsPerPageChange={setRowsPerPage}
      />
    </div>
  )
}

export default AccredittedSellers
