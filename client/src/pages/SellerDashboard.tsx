import { useQuery } from "@tanstack/react-query"
import { FiBarChart2, FiDollarSign, FiGrid, FiUsers } from "react-icons/fi"
import Alert from "../components/ui/Alert"
import LoadingState from "../components/ui/LoadingState"
import PageHeader from "../components/ui/PageHeader"
import StatCard from "../components/ui/StatCard"
import TableContainer from "../components/ui/TableContainer"
import { API_URL, getErrorMessage } from "../utils/api"
import { formatDate, formatMoney, formatText } from "../utils/formatters"

type SellerDashboardData = {
  seller?: { full_name?: string; seller_role?: string } | null
  summary: {
    total_sales: number
    total_clients: number
    total_tcp: number
    available_units: number
  }
  teamCounts: { seller_role: string; count: number }[]
  recentSales: {
    id: number
    client_name: string
    unit_id: string
    project_name: string
    seller_name: string
    seller_role: string
    total_contract_price: number | string
    status: string
    created_at: string
  }[]
}

const fetchSellerDashboard = async () => {
  const res = await fetch(`${API_URL}/seller/dashboard`, { credentials: "include" })
  if (!res.ok) throw new Error(await getErrorMessage(res))
  return res.json() as Promise<SellerDashboardData>
}

const SellerDashboard = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["seller-dashboard"],
    queryFn: fetchSellerDashboard,
  })

  if (isLoading) return <LoadingState label="Loading seller dashboard..." />

  if (error) {
    return <div className="p-6"><Alert variant="error" title={error instanceof Error ? error.message : "Failed to load dashboard"} /></div>
  }

  const summary = data?.summary

  return (
    <div className="p-6">
      <PageHeader
        icon={<FiBarChart2 />}
        title="Seller Dashboard"
        subtitle={data?.seller ? `${data.seller.full_name} — ${formatText(data.seller.seller_role)}` : "Team and sales summary"}
      />

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={<FiUsers />} label="Sales" value={summary?.total_sales || 0} />
        <StatCard icon={<FiGrid />} label="Available Units" value={summary?.available_units || 0} />
        <StatCard icon={<FiDollarSign />} label="Total TCP" value={formatMoney(summary?.total_tcp || 0)} />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard label="Clients" value={summary?.total_clients || 0} />
      </div>

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-bold text-slate-900">Team Count</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
          {(data?.teamCounts || []).map((row) => (
            <div key={row.seller_role} className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase text-slate-500">{formatText(row.seller_role)}</p>
              <p className="mt-1 text-xl font-bold text-slate-900">{row.count}</p>
            </div>
          ))}
        </div>
      </div>

      <TableContainer>
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr className="border-b border-slate-200">
              <th className="px-4 py-3 text-left">Client</th>
              <th className="px-4 py-3 text-left">Unit</th>
              <th className="px-4 py-3 text-left">Seller</th>
              <th className="px-4 py-3 text-left">TCP</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Date</th>
            </tr>
          </thead>
          <tbody>
            {(data?.recentSales || []).map((sale) => (
              <tr className="border-b border-slate-100" key={sale.id}>
                <td className="px-4 py-3 font-semibold text-slate-900">{sale.client_name}</td>
                <td className="px-4 py-3 text-slate-600">{sale.unit_id}<br/><span className="text-xs text-slate-400">{sale.project_name}</span></td>
                <td className="px-4 py-3 text-slate-600">{sale.seller_name}<br/><span className="text-xs text-slate-400">{formatText(sale.seller_role)}</span></td>
                <td className="px-4 py-3 text-slate-600">{formatMoney(sale.total_contract_price)}</td>
                <td className="px-4 py-3 text-slate-600">{formatText(sale.status)}</td>
                <td className="px-4 py-3 text-slate-600">{formatDate(sale.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableContainer>
    </div>
  )
}

export default SellerDashboard

