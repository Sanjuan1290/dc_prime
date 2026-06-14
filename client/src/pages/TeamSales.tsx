import { useQuery } from "@tanstack/react-query"
import { FiBarChart2 } from "react-icons/fi"
import Alert from "../components/ui/Alert"
import LoadingState from "../components/ui/LoadingState"
import PageHeader from "../components/ui/PageHeader"
import TableContainer from "../components/ui/TableContainer"
import { API_URL, getErrorMessage } from "../utils/api"
import { formatDate, formatMoney, formatText } from "../utils/formatters"

type Sale = {
  id: number
  status: string
  mode_of_payment: string
  starting_date: string | null
  due_date: string | null
  client_name: string
  unit_id: string
  project_name: string
  seller_name: string
  seller_role: string
  total_contract_price: number | string
  seller_commission: number | string
  released_commission: number | string
  created_at: string
}

const fetchSales = async () => {
  const res = await fetch(`${API_URL}/seller/sales`, { credentials: "include" })
  if (!res.ok) throw new Error(await getErrorMessage(res))
  const data = await res.json()
  return (data.sales || data.data || []) as Sale[]
}

const TeamSales = () => {
  const { data = [], isLoading, error } = useQuery({ queryKey: ["seller-sales"], queryFn: fetchSales })

  return (
    <div className="p-6">
      <PageHeader icon={<FiBarChart2 />} title="Sales" subtitle="Filtered by your role. Agents see own sales only." />
      {error ? <Alert variant="error" title={error instanceof Error ? error.message : "Failed to load sales"} /> : null}
      {isLoading ? <LoadingState label="Loading sales..." /> : null}
      {!isLoading ? (
        <TableContainer>
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="border-b border-slate-200">
                <th className="px-4 py-3 text-left">Client</th>
                <th className="px-4 py-3 text-left">Unit</th>
                <th className="px-4 py-3 text-left">Seller</th>
                <th className="px-4 py-3 text-left">TCP</th>
                <th className="px-4 py-3 text-left">Commission</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Date</th>
              </tr>
            </thead>
            <tbody>
              {data.map((sale) => (
                <tr className="border-b border-slate-100" key={sale.id}>
                  <td className="px-4 py-3 font-semibold text-slate-900">{sale.client_name}</td>
                  <td className="px-4 py-3 text-slate-600">{sale.unit_id}<br/><span className="text-xs text-slate-400">{sale.project_name}</span></td>
                  <td className="px-4 py-3 text-slate-600">{sale.seller_name}<br/><span className="text-xs text-slate-400">{formatText(sale.seller_role)}</span></td>
                  <td className="px-4 py-3 text-slate-600">{formatMoney(sale.total_contract_price)}</td>
                  <td className="px-4 py-3 text-slate-600">{formatMoney(sale.seller_commission)}<br/><span className="text-xs text-slate-400">Released: {formatMoney(sale.released_commission)}</span></td>
                  <td className="px-4 py-3 text-slate-600">{formatText(sale.status)}</td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(sale.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableContainer>
      ) : null}
    </div>
  )
}

export default TeamSales
