import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { FiUsers } from "react-icons/fi"
import Alert from "../components/ui/Alert"
import Button from "../components/ui/Button"
import Input from "../components/ui/Input"
import LoadingState from "../components/ui/LoadingState"
import Modal from "../components/ui/Modal"
import PageHeader from "../components/ui/PageHeader"
import TableContainer from "../components/ui/TableContainer"
import { API_URL, getErrorMessage } from "../utils/api"
import { formatMoney, formatNumber, formatText } from "../utils/formatters"
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
  if (currentRole === "broker") return member.seller_role === "manager" || member.seller_role === "agent"
  if (currentRole === "manager") return member.seller_role === "agent"
  return false
}

const MyTeam = () => {
  const queryClient = useQueryClient()
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null)
  const [rateValue, setRateValue] = useState("")
  const [message, setMessage] = useState("")
  const { data: currentUserData } = useCurrentUser()
  const currentRole = (currentUserData as CurrentUserResponse | null)?.user?.role

  const { data = [], isLoading, error } = useQuery({ queryKey: ["seller-team"], queryFn: fetchTeam })

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
      <PageHeader icon={<FiUsers />} title="My Team" subtitle="Manage rates for sellers under your hierarchy." />
      {message ? <Alert variant="success" title={message} /> : null}
      {error ? <Alert variant="error" title={error instanceof Error ? error.message : "Failed to load team"} /> : null}
      {rateMutation.error ? <Alert variant="error" title={rateMutation.error instanceof Error ? rateMutation.error.message : "Failed to update rate"} /> : null}
      {isLoading ? <LoadingState label="Loading team..." /> : null}
      {!isLoading ? (
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
              {data.map((member) => (
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
                      <span className="text-xs text-slate-400">View only</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableContainer>
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
            message="Broker rate cannot exceed BNM pool. Manager rate cannot exceed broker pool. Agent rate cannot exceed manager rate."
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
