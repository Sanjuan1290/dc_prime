import { useQuery } from "@tanstack/react-query"
import { FiUsers } from "react-icons/fi"
import Alert from "../components/ui/Alert"
import LoadingState from "../components/ui/LoadingState"
import PageHeader from "../components/ui/PageHeader"
import TableContainer from "../components/ui/TableContainer"
import { API_URL, getErrorMessage } from "../utils/api"
import { formatMoney, formatNumber, formatText } from "../utils/formatters"

type TeamMember = {
  id: number
  full_name: string
  email: string | null
  contact_no: string | null
  seller_role: string
  parent_seller_name: string | null
  commission_pool_rate: number | string | null
  personal_commission_rate: number | string | null
  override_commission_rate: number | string | null
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

const rate = (value: number | string | null | undefined) => value === null || value === undefined || value === "" ? "-" : `${formatNumber(value)}%`

const MyTeam = () => {
  const { data = [], isLoading, error } = useQuery({ queryKey: ["seller-team"], queryFn: fetchTeam })

  return (
    <div className="p-6">
      <PageHeader icon={<FiUsers />} title="My Team" subtitle="Only your downline sellers are shown here." />
      {error ? <Alert variant="error" title={error instanceof Error ? error.message : "Failed to load team"} /> : null}
      {isLoading ? <LoadingState label="Loading team..." /> : null}
      {!isLoading ? (
        <TableContainer>
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="border-b border-slate-200">
                <th className="px-4 py-3 text-left">Seller</th>
                <th className="px-4 py-3 text-left">Role</th>
                <th className="px-4 py-3 text-left">Reports Under</th>
                <th className="px-4 py-3 text-left">Rates</th>
                <th className="px-4 py-3 text-left">Sales</th>
                <th className="px-4 py-3 text-left">TCP</th>
              </tr>
            </thead>
            <tbody>
              {data.map((member) => (
                <tr className="border-b border-slate-100" key={member.id}>
                  <td className="px-4 py-3"><p className="font-semibold text-slate-900">{member.full_name}</p><p className="text-xs text-slate-500">{member.email || member.contact_no || "-"}</p></td>
                  <td className="px-4 py-3 text-slate-600">{formatText(member.seller_role)}</td>
                  <td className="px-4 py-3 text-slate-600">{member.parent_seller_name || "Company"}</td>
                  <td className="px-4 py-3 text-slate-600">Pool: {rate(member.commission_pool_rate)}<br/>Personal: {rate(member.personal_commission_rate)}<br/>Override: {rate(member.override_commission_rate)}</td>
                  <td className="px-4 py-3 text-slate-600">{formatNumber(member.total_sales)}</td>
                  <td className="px-4 py-3 text-slate-600">{formatMoney(member.total_tcp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableContainer>
      ) : null}
    </div>
  )
}

export default MyTeam
