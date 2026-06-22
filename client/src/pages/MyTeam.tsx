import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { FiUsers } from "react-icons/fi"
import Alert from "../components/ui/Alert"
import LoadingState from "../components/ui/LoadingState"
import PageHeader from "../components/ui/PageHeader"
import Pagination from "../components/ui/Pagination"
import TableContainer from "../components/ui/TableContainer"
import { API_URL, getErrorMessage } from "../utils/api"
import { formatMoney, formatNumber, formatText } from "../utils/formatters"
import { paginateRows } from "../utils/pagination"

type TeamMember = {
  id: number
  full_name: string
  email: string | null
  contact_no: string | null
  seller_role: string
  parent_seller_name: string | null
  seller_group_id: number | null
  seller_group_name: string | null
  seller_group_pool_rate: number | string | null
  seller_group_role_rate: number | string | null
  commission_pool_rate: number | string | null
  personal_commission_rate: number | string | null
  commission_rate: number | string | null
  total_sales: number | string
  total_tcp: number | string
  status: string
}

const fetchTeam = async () => {
  const res = await fetch(`${API_URL}/seller/team`, { credentials: "include" })
  if (!res.ok) throw new Error(await getErrorMessage(res))
  const data = await res.json()
  return (data.team || data.data || []) as TeamMember[]
}

const rate = (value: number | string | null | undefined) =>
  value === null || value === undefined || value === "" ? "-" : `${formatNumber(value)}%`

const assignedRate = (member: TeamMember) => {
  if (member.seller_group_role_rate !== null && member.seller_group_role_rate !== undefined) return member.seller_group_role_rate
  if (member.seller_role === "broker_network_manager") return member.commission_pool_rate
  if (member.seller_role === "broker") return member.commission_pool_rate
  if (member.seller_role === "manager") return member.personal_commission_rate ?? member.commission_rate
  if (member.seller_role === "agent") return member.personal_commission_rate ?? member.commission_rate
  return null
}

const normalizeSearch = (value: unknown) => String(value ?? "").toLowerCase()

const matchesSearch = (fields: unknown[], searchQuery: string) => {
  const query = searchQuery.trim().toLowerCase()
  if (!query) return true
  return fields.some((field) => normalizeSearch(field).includes(query))
}

const MyTeam = () => {
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [search, setSearch] = useState("")

  const { data = [], isLoading, error } = useQuery({
    queryKey: ["seller-team"],
    queryFn: fetchTeam,
    retry: false,
    refetchOnWindowFocus: false,
  })

  const filteredTeam = useMemo(
    () =>
      data.filter((member) =>
        matchesSearch(
          [
            member.full_name,
            member.email,
            member.contact_no,
            member.seller_role,
            formatText(member.seller_role),
            member.parent_seller_name || "Company",
            member.seller_group_name,
            member.seller_group_pool_rate,
            assignedRate(member),
            rate(assignedRate(member)),
            member.total_sales,
            member.total_tcp,
            formatMoney(member.total_tcp),
            member.status,
            formatText(member.status),
          ],
          search
        )
      ),
    [data, search]
  )

  const paginatedTeam = useMemo(
    () => paginateRows(filteredTeam, page, rowsPerPage),
    [filteredTeam, page, rowsPerPage]
  )

  return (
    <div className="p-6">
      <PageHeader icon={<FiUsers />} title="My Team" subtitle="View your hierarchy. Rates are view-only and controlled by admin per Seller Group." />
      <Alert variant="info" title="Rate editing is disabled for seller accounts. Admin manages group pool rate and role distribution in User Management → Seller Groups." />
      {error ? <Alert variant="error" title={error instanceof Error ? error.message : "Failed to load team"} /> : null}
      {isLoading ? <LoadingState label="Loading team..." /> : null}
      {!isLoading ? (
        <>
          <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <label className="block text-sm font-semibold text-slate-700" htmlFor="my-team-search">
              Search my team
            </label>
            <input
              id="my-team-search"
              className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Search seller, role, reports under, group, rate, sales, TCP, contact, or status..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(1)
              }}
            />
            <p className="mt-2 text-xs text-slate-500">
              Showing {filteredTeam.length} of {data.length} team members
            </p>
          </div>

          <TableContainer>
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-200">
                  <th className="px-4 py-3 text-left">Seller</th>
                  <th className="px-4 py-3 text-left">Role</th>
                  <th className="px-4 py-3 text-left">Reports Under</th>
                  <th className="px-4 py-3 text-left">Seller Group</th>
                  <th className="px-4 py-3 text-left">Approved Rate</th>
                  <th className="px-4 py-3 text-left">Sales</th>
                  <th className="px-4 py-3 text-left">TCP</th>
                  <th className="px-4 py-3 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTeam.map((member) => (
                  <tr className="border-b border-slate-100" key={member.id}>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">{member.full_name}</p>
                      <p className="text-xs text-slate-500">{member.email || member.contact_no || "-"}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{formatText(member.seller_role)}</td>
                    <td className="px-4 py-3 text-slate-600">{member.parent_seller_name || "Company"}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {member.seller_group_name ? (
                        <>
                          <p className="font-medium text-slate-900">{member.seller_group_name}</p>
                          <p className="text-xs text-slate-500">Pool {rate(member.seller_group_pool_rate)}</p>
                        </>
                      ) : (
                        <span className="text-amber-600">No group</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <p className="font-medium text-slate-900">{formatText(member.seller_role)} Rate</p>
                      <p>{rate(assignedRate(member))}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{formatNumber(member.total_sales)}</td>
                    <td className="px-4 py-3 text-slate-600">{formatMoney(member.total_tcp)}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-slate-400">View only</td>
                  </tr>
                ))}
                {!paginatedTeam.length ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-sm text-slate-500">No team members found.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </TableContainer>
          <Pagination
            page={page}
            rowsPerPage={rowsPerPage}
            totalRows={filteredTeam.length}
            onPageChange={setPage}
            onRowsPerPageChange={setRowsPerPage}
          />
        </>
      ) : null}
    </div>
  )
}

export default MyTeam
