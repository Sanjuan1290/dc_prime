import { useQuery } from "@tanstack/react-query"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1"

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
  commissionPayable: number | string
  commissionReleased: number | string
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

  const formatMoney = (amount: number | string | undefined) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(Number(amount || 0))
  }

  const formatNumber = (value: number | string | undefined) => {
    return new Intl.NumberFormat("en-PH").format(Number(value || 0))
  }

  const formatPercent = (value: number | string | undefined) => {
    return `${Number(value || 0).toFixed(2)}%`
  }

  const formatText = (value: string | null | undefined) => {
    if (!value) return "-"

    return value
      .replaceAll("_", " ")
      .split(" ")
      .map((word) => word[0]?.toUpperCase() + word.slice(1))
      .join(" ")
  }

  const stats = [
    {
      title: "Total Sales",
      value: formatMoney(summary?.totalSales),
      description: "Total contract price from client units",
    },
    {
      title: "Pending Sales",
      value: formatMoney(summary?.pendingSales),
      description: "Total value from reserved client units",
    },
    {
      title: "Listed Lot Value",
      value: formatMoney(summary?.listedLotValue),
      description: "Total value of all active listed lots",
    },
    {
      title: "Available Lot Value",
      value: formatMoney(summary?.availableLotValue),
      description: "Total value of available lots",
    },
    {
      title: "Sold Lot Value",
      value: formatMoney(summary?.soldLotValue),
      description: "Total value of sold lots",
    },
    {
      title: "Tracked Collections",
      value: formatMoney(summary?.trackedCollections),
      description: "Total payments collected from clients",
    },
    {
      title: "Collection Progress",
      value: formatPercent(summary?.collectionProgress),
      description: "Collected amount compared to total sales",
    },
    {
      title: "Clients",
      value: formatNumber(summary?.clientsCount),
      description: "Total registered clients",
    },
    {
      title: "Pending Documents",
      value: formatNumber(summary?.pendingDocuments),
      description: "Client documents not submitted or rejected",
    },
    {
      title: "Commission Payable",
      value: formatMoney(summary?.commissionPayable),
      description: "Total commission amount payable",
    },
    {
      title: "Commission Released",
      value: formatMoney(summary?.commissionReleased),
      description: "Total commission already released",
    },
    {
      title: "Commission Remaining",
      value: formatMoney(summary?.commissionRemaining),
      description: "Remaining commission balance",
    },
  ]

  if (isSummaryLoading) {
    return <p className="p-4">Loading dashboard...</p>
  }

  if (summaryError) {
    return <p className="p-4">Failed to load dashboard</p>
  }

  return (
    <div className="p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-sm text-gray-600">
          Real-time system summary from MySQL
        </p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.title} className="border border-black px-4 py-3">
            <p className="text-sm">{stat.title}</p>
            <h3 className="text-2xl font-bold">{stat.value}</h3>
            <p className="text-sm text-gray-600">{stat.description}</p>
          </div>
        ))}
      </div>

      <div>
        <div className="mb-3">
          <h2 className="text-2xl font-bold">Agent Performance</h2>
          <p className="text-sm text-gray-600">
            Sales performance grouped by accredited seller
          </p>
        </div>

        {isAgentsLoading ? (
          <p>Loading agent performance...</p>
        ) : agentsError ? (
          <p>Failed to load agent performance</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border border-black text-sm">
              <thead>
                <tr className="border-b border-black">
                  <th className="border-r border-black px-4 py-2 text-left">
                    Agent ↕
                  </th>
                  <th className="border-r border-black px-4 py-2 text-left">
                    Role ↕
                  </th>
                  <th className="border-r border-black px-4 py-2 text-left">
                    Total Sales ↕
                  </th>
                  <th className="border-r border-black px-4 py-2 text-left">
                    Active ↕
                  </th>
                  <th className="border-r border-black px-4 py-2 text-left">
                    Cancelled ↕
                  </th>
                  <th className="px-4 py-2 text-left">Net ↕</th>
                </tr>
              </thead>

              <tbody>
                {agents.map((agent) => (
                  <tr key={agent.seller_id} className="border-b border-black">
                    <td className="border-r border-black px-4 py-2">
                      {agent.agent}
                    </td>

                    <td className="border-r border-black px-4 py-2">
                      {formatText(agent.seller_role)}
                    </td>

                    <td className="border-r border-black px-4 py-2">
                      {formatMoney(agent.total_sales)}
                    </td>

                    <td className="border-r border-black px-4 py-2">
                      {formatNumber(agent.active)}
                    </td>

                    <td className="border-r border-black px-4 py-2">
                      {formatNumber(agent.cancelled)}
                    </td>

                    <td className="px-4 py-2">
                      {formatMoney(agent.net)}
                    </td>
                  </tr>
                ))}

                {agents.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-6 text-center text-gray-600"
                    >
                      No agent performance records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard  