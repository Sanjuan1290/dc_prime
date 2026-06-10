import { useQuery } from "@tanstack/react-query"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  FiBarChart2,
  FiCreditCard,
  FiDollarSign,
  FiFileText,
  FiHome,
  FiUsers,
} from "react-icons/fi"
import Alert from "../components/ui/Alert"
import EmptyState from "../components/ui/EmptyState"
import LoadingState from "../components/ui/LoadingState"
import PageHeader from "../components/ui/PageHeader"
import StatCard from "../components/ui/StatCard"
import TableContainer from "../components/ui/TableContainer"
import { API_URL, getErrorMessage } from "../utils/api"
import { formatMoney, formatNumber, formatText } from "../utils/formatters"

type DashboardSummary = {
  totalSales: number | string
  pendingSales: number | string
  listedLotValue: number | string
  availableLotValue: number | string
  soldLotValue: number | string
  trackedCollections: number | string
  collectionProgress: number | string
  clientsCount: number | string
  pendingDocuments: number | string
  totalCommissionLiability?: number | string
  commissionPayableNow?: number | string
  commissionReleased: number | string
  commissionUnreleasedBalance?: number | string
  commissionPayable: number | string
  commissionRemaining: number | string
}

type AgentPerformance = {
  seller_id: number
  agent: string
  seller_role: string
  total_sales: number | string
  active: number | string
  cancelled: number | string
  net: number | string
}

type DashboardSummaryResponse = {
  summary: DashboardSummary
}

type AgentPerformanceResponse = {
  agents: AgentPerformance[]
}

const fetchDashboardSummary = async (): Promise<DashboardSummary> => {
  const res = await fetch(`${API_URL}/dashboard/summary`, {
    credentials: "include",
  })

  if (!res.ok) {
    throw new Error(await getErrorMessage(res))
  }

  const data: DashboardSummaryResponse = await res.json()
  return data.summary
}

const fetchAgentPerformance = async (): Promise<AgentPerformance[]> => {
  const res = await fetch(`${API_URL}/dashboard/agent-performance`, {
    credentials: "include",
  })

  if (!res.ok) {
    throw new Error(await getErrorMessage(res))
  }

  const data: AgentPerformanceResponse = await res.json()
  return data.agents
}


const safeNum = (value: unknown) => {
  const numberValue = Number(value ?? 0)
  return Number.isNaN(numberValue) ? 0 : numberValue
}

const Dashboard = () => {
  const {
    data: summary,
    isLoading: isSummaryLoading,
    error: summaryError,
  } = useQuery<DashboardSummary>({
    queryKey: ["dashboard-summary"],
    queryFn: fetchDashboardSummary,
  })

  const {
    data: agents = [],
    isLoading: isAgentsLoading,
    error: agentsError,
  } = useQuery<AgentPerformance[]>({
    queryKey: ["dashboard-agent-performance"],
    queryFn: fetchAgentPerformance,
  })

  const totalSales = safeNum(summary?.totalSales)
  const pendingSales = safeNum(summary?.pendingSales)
  const trackedCollections = safeNum(summary?.trackedCollections)
  const collectionProgress = safeNum(summary?.collectionProgress)
  const clientsCount = safeNum(summary?.clientsCount)
  const listedLotValue = safeNum(summary?.listedLotValue)
  const availableLotValue = safeNum(summary?.availableLotValue)
  const soldLotValue = safeNum(summary?.soldLotValue)
  const pendingDocuments = safeNum(summary?.pendingDocuments)
  const totalCommissionLiability = safeNum(
    summary?.totalCommissionLiability ?? summary?.commissionPayable
  )
  const commissionPayableNow = safeNum(
    summary?.commissionPayableNow ?? summary?.commissionPayable
  )
  const commissionReleased = safeNum(summary?.commissionReleased)
  const commissionUnreleasedBalance = safeNum(
    summary?.commissionUnreleasedBalance ?? summary?.commissionRemaining
  )

  const stats = [
    {
      title: "Total Sales",
      value: formatMoney(totalSales),
      description: "Contract value from active, reserved, paid, and closed client units",
      formula: "SUM(TCP) from client units with status active, reserved, fully_paid, or closed.",
      icon: <FiDollarSign />,
    },
    {
      title: "Pending Sales",
      value: formatMoney(pendingSales),
      description: "Reserved client-unit contract value",
      formula: "SUM(TCP) from client units where status = reserved.",
      icon: <FiHome />,
    },
    {
      title: "Tracked Collections",
      value: formatMoney(trackedCollections),
      description: `${collectionProgress.toFixed(2)}% collection progress`,
      formula: "SUM(payments.amount) where payment status = verified. Pending and rejected payments are excluded.",
      icon: <FiCreditCard />,
    },
    {
      title: "Clients",
      value: formatNumber(clientsCount),
      description: "Registered client records",
      formula: "COUNT(*) from clients.",
      icon: <FiUsers />,
    },
    {
      title: "Listed Lot Value",
      value: formatMoney(listedLotValue),
      description: "All non-inactive listings",
      formula: "SUM(TCP) from listings where status is not inactive.",
      icon: <FiHome />,
    },
    {
      title: "Available Lot Value",
      value: formatMoney(availableLotValue),
      description: "Available inventory value",
      formula: "SUM(TCP) from listings where status = available.",
      icon: <FiHome />,
    },
    {
      title: "Sold Lot Value",
      value: formatMoney(soldLotValue),
      description: "Sold inventory value",
      formula: "SUM(TCP) from listings where status = sold.",
      icon: <FiDollarSign />,
    },
    {
      title: "Pending Documents",
      value: formatNumber(pendingDocuments),
      description: "Not submitted or rejected checklist items",
      formula: "COUNT(*) from client document checklist where status is not_submitted or rejected.",
      icon: <FiFileText />,
    },
    {
      title: "Total Commission",
      value: formatMoney(totalCommissionLiability),
      description: "Full commission liability, including future releases",
      formula: "SUM(commissions.amount) where commission status is not cancelled.",
      icon: <FiDollarSign />,
    },
    {
      title: "Payable Now",
      value: formatMoney(commissionPayableNow),
      description: "Only eligible commission releases ready to pay",
      formula: "SUM(commission_releases.net_release_amount) where release status = eligible.",
      icon: <FiDollarSign />,
    },
    {
      title: "Commission Released",
      value: formatMoney(commissionReleased),
      description: "Already released commission value",
      formula: "SUM(commission_releases.net_release_amount) where release status = released.",
      icon: <FiDollarSign />,
    },
    {
      title: "Unreleased Commission",
      value: formatMoney(commissionUnreleasedBalance),
      description: "Total commission liability minus released releases",
      formula: "SUM(commissions.amount) minus SUM(released commission release net amounts).",
      icon: <FiDollarSign />,
    },
  ]

  const commissionData = [
    {
      name: "Payable Now",
      value: commissionPayableNow,
      color: "#2563eb",
    },
    {
      name: "Released",
      value: commissionReleased,
      color: "#10b981",
    },
    {
      name: "Unreleased",
      value: commissionUnreleasedBalance,
      color: "#f59e0b",
    },
  ]

  const salesCollectionsData = [
    {
      name: "Sales",
      value: totalSales,
    },
    {
      name: "Collections",
      value: trackedCollections,
    },
  ]

  const agentChartData = agents.slice(0, 8).map((agent) => ({
    name: agent.agent,
    net: Number(agent.net || 0),
    total: Number(agent.total_sales || 0),
  }))

  if (isSummaryLoading) {
    return <LoadingState message="Loading dashboard..." />
  }

  if (summaryError) {
    return <Alert type="error">Failed to load dashboard</Alert>
  }

  return (
    <div>
      <PageHeader
        icon={<FiBarChart2 className="h-5 w-5" />}
        subtitle="Real-time system summary from MySQL"
        title="Dashboard"
      />

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard
            description={stat.description}
            formula={stat.formula}
            icon={stat.icon}
            key={stat.title}
            title={stat.title}
            value={stat.value}
          />
        ))}
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm xl:col-span-1">
          <h2 className="text-base font-bold text-slate-900">
            Payable Now vs Released vs Unreleased
          </h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer height="100%" width="100%">
              <PieChart>
                <Pie
                  data={commissionData}
                  dataKey="value"
                  innerRadius={62}
                  nameKey="name"
                  outerRadius={96}
                  paddingAngle={3}
                >
                  {commissionData.map((entry) => (
                    <Cell fill={entry.color} key={entry.name} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatMoney(value as number)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm xl:col-span-1">
          <h2 className="text-base font-bold text-slate-900">
            Sales vs Collections
          </h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer height="100%" width="100%">
              <BarChart data={salesCollectionsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => `${Number(value) / 1000000}M`} />
                <Tooltip formatter={(value) => formatMoney(value as number)} />
                <Bar dataKey="value" fill="#2563eb" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm xl:col-span-1">
          <h2 className="text-base font-bold text-slate-900">
            Agent Performance
          </h2>
          {isAgentsLoading ? (
            <div className="mt-4">
              <LoadingState message="Loading agent performance..." />
            </div>
          ) : agentsError ? (
            <div className="mt-4">
              <Alert type="error">Failed to load agent performance</Alert>
            </div>
          ) : agentChartData.length === 0 ? (
            <div className="mt-4">
              <EmptyState title="No agent performance records" />
            </div>
          ) : (
            <div className="mt-4 h-72">
              <ResponsiveContainer height="100%" width="100%">
                <BarChart data={agentChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis tickFormatter={(value) => `${Number(value) / 1000000}M`} type="number" />
                  <YAxis dataKey="name" type="category" width={90} />
                  <Tooltip formatter={(value) => formatMoney(value as number)} />
                  <Bar dataKey="net" fill="#10b981" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <TableContainer>
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">
                Agent
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">
                Role
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">
                Total Sales
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">
                Active
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">
                Cancelled
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">
                Net
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {agents.map((agent) => (
              <tr className="transition hover:bg-slate-50" key={agent.seller_id}>
                <td className="px-4 py-3 font-medium text-slate-900">
                  {agent.agent}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {formatText(agent.seller_role)}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {formatMoney(agent.total_sales)}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {formatNumber(agent.active)}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {formatNumber(agent.cancelled)}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {formatMoney(agent.net)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableContainer>
    </div>
  )
}

export default Dashboard
