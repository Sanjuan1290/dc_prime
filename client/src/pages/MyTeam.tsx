import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { FiUsers } from "react-icons/fi"
import Alert from "../components/ui/Alert"
import Button from "../components/ui/Button"
import Input from "../components/ui/Input"
import LoadingState from "../components/ui/LoadingState"
import Modal from "../components/ui/Modal"
import PageHeader from "../components/ui/PageHeader"
import Pagination from "../components/ui/Pagination"
import TableContainer from "../components/ui/TableContainer"
import { API_URL, getErrorMessage } from "../utils/api"
import { formatMoney, formatNumber, formatText } from "../utils/formatters"
import { paginateRows } from "../utils/pagination"
import useCurrentUser from "../utils/useCurrentUser"

type TeamMember = {
  id: number
  full_name: string
  email: string | null
  contact_no: string | null
  seller_role: string
  parent_seller_name: string | null
  commission_pool_rate: number | string | null
  personal_commission_rate: number | string | null
  commission_rate: number | string | null
  override_commission_rate: number | string | null
  direct_to_developer_rate: number | string | null
  total_sales: number | string
  total_tcp: number | string
  status: string
}

type CurrentUserResponse = {
  user?: {
    role?: string
  }
}

const fetchTeam = async () => {
  const res = await fetch(`${API_URL}/seller/team`, { credentials: "include" })
  if (!res.ok) throw new Error(await getErrorMessage(res))
  const data = await res.json()
  return (data.team || data.data || []) as TeamMember[]
}

const updateTeamRate = async ({ sellerId, rate }: { sellerId: number; rate: string }) => {
  const res = await fetch(`${API_URL}/seller/team/${sellerId}/rate`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rate: rate === "" ? null : Number(rate) }),
  })
  if (!res.ok) throw new Error(await getErrorMessage(res))
  return res.json()
}

const rate = (value: number | string | null | undefined) =>
  value === null || value === undefined || value === "" ? "-" : `${formatNumber(value)}%`

const assignedRate = (member: TeamMember) => {
  if (member.seller_role === "broker_network_manager") return member.commission_pool_rate
  if (member.seller_role === "broker") return member.commission_pool_rate
  if (member.seller_role === "manager") return member.personal_commission_rate ?? member.commission_rate
  if (member.seller_role === "agent") return member.personal_commission_rate ?? member.commission_rate
  return null
}

const rateLabel = (member: TeamMember) => {
  if (member.seller_role === "broker_network_manager") return "BNM Pool Rate"
  if (member.seller_role === "broker") return "Broker Pool Rate"
  if (member.seller_role === "manager") return "Manager Rate"
  if (member.seller_role === "agent") return "Agent Rate"
  return "Rate"
}

const canEditMember = (currentRole: string | undefined, member: TeamMember) => {
  if (currentRole === "broker_network_manager") return member.seller_role === "broker"
  if (currentRole === "broker") return member.seller_role === "manager"
  if (currentRole === "manager") return member.seller_role === "agent"
  return false
}

const viewOnlyReason = (currentRole: string | undefined, member: TeamMember) => {
  if (currentRole === "broker" && member.seller_role === "agent") {
    return "Only the manager can edit agent rate"
  }
  return "View only"
}

const rateRules = (currentRole: string | undefined, member: TeamMember) => {
  if (currentRole === "broker_network_manager" && member.seller_role === "broker") {
    return "You are setting a Broker Pool Rate. This rate cannot exceed your BNM Pool Rate. Broker managers and agents will be calculated under this broker pool."
  }

  if (currentRole === "broker" && member.seller_role === "manager") {
    return "You are setting a Manager Rate. This rate cannot exceed your Broker Pool Rate. The manager will use this as the maximum pool for their agents."
  }

  if (currentRole === "manager" && member.seller_role === "agent") {
    return "You are setting an Agent Rate. This rate cannot exceed your Manager Rate. The same rate is used for the agent's personal and direct-to-developer commission."
  }

  return "Rate rules: BNM sets broker pool only. Broker sets manager rate only. Manager sets agent rate only. Broker can view agent rate but cannot edit it."
}

const normalizeSearch = (value: unknown) => String(value ?? "").toLowerCase()

const matchesSearch = (fields: unknown[], searchQuery: string) => {
  const query = searchQuery.trim().toLowerCase()
  if (!query) return true

  return fields.some((field) => normalizeSearch(field).includes(query))
}

const MyTeam = () => {
  const queryClient = useQueryClient()
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null)
  const [rateValue, setRateValue] = useState("")
  const [message, setMessage] = useState("")
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [search, setSearch] = useState("")
  const { data: currentUserData } = useCurrentUser()
  const currentRole = (currentUserData as CurrentUserResponse | null)?.user?.role?.toLowerCase().trim()

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
            rateLabel(member),
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

  const rateMutation = useMutation({
    mutationFn: updateTeamRate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller-team"] })
      setEditingMember(null)
      setMessage("Team rate updated successfully.")
    },
  })

  const openEdit = (member: TeamMember) => {
    setEditingMember(member)
    const currentRate = assignedRate(member)
    setRateValue(currentRate === null || currentRate === undefined ? "" : String(currentRate))
  }

  return (
    <div className="p-6">
      <PageHeader icon={<FiUsers />} title="My Team" subtitle="View your hierarchy and manage only the rates allowed for your role." />
      {message ? <Alert variant="success" title={message} /> : null}
      {error ? <Alert variant="error" title={error instanceof Error ? error.message : "Failed to load team"} /> : null}
      {rateMutation.error ? <Alert variant="error" title={rateMutation.error instanceof Error ? rateMutation.error.message : "Failed to update rate"} /> : null}
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
              placeholder="Search seller, role, reports under, rate, sales, TCP, contact, or status..."
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
                  <th className="px-4 py-3 text-left">Assigned Rate</th>
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
                      <p className="font-medium text-slate-900">{rateLabel(member)}</p>
                      <p>{rate(assignedRate(member))}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{formatNumber(member.total_sales)}</td>
                    <td className="px-4 py-3 text-slate-600">{formatMoney(member.total_tcp)}</td>
                    <td className="px-4 py-3">
                      {canEditMember(currentRole, member) ? (
                        <Button onClick={() => openEdit(member)}>Edit Rate</Button>
                      ) : (
                        <span className="text-xs text-slate-400">{viewOnlyReason(currentRole, member)}</span>
                      )}
                    </td>
                  </tr>
                ))}
                {!paginatedTeam.length ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500">No team members found.</td>
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

      {editingMember ? (
        <Modal
          title={`Edit ${rateLabel(editingMember)}`}
          onClose={() => setEditingMember(null)}
          footer={
            <div className="flex justify-end gap-2">
              <Button onClick={() => setEditingMember(null)}>Cancel</Button>
              <Button
                disabled={rateMutation.isPending}
                onClick={() => rateMutation.mutate({ sellerId: editingMember.id, rate: rateValue })}
                variant="primary"
              >
                {rateMutation.isPending ? "Saving..." : "Save Rate"}
              </Button>
            </div>
          }
        >
          <Alert
            variant="info"
            title="Rate rules"
            message={rateRules(currentRole, editingMember)}
          />
          <Input
            label={`${rateLabel(editingMember)} (%)`}
            min={0}
            max={100}
            step="0.01"
            type="number"
            value={rateValue}
            onChange={(e) => setRateValue(e.target.value)}
          />
        </Modal>
      ) : null}
    </div>
  )
}

export default MyTeam
