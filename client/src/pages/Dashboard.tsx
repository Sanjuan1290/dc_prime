import { useEffect, useRef, useState, type ReactNode } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
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
import Pagination from "../components/ui/Pagination"
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
  discontinuedMoney?: number | string
  refundedAmount?: number | string
  pendingRefunds?: number | string
  pendingCancellations?: number | string
  cancelledAccounts?: number | string
  unitsClearedForResale?: number | string
  totalCommissionLiability?: number | string
  commissionPayableNow?: number | string
  commissionReleased: number | string
  commissionCashAdvanceDeducted?: number | string
  commissionUnreleasedBalance?: number | string
  commissionPayable: number | string
  commissionRemaining: number | string
  cashAdvanceDeducted?: number | string
  netCommissionRemaining?: number | string
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

type ChartSize = {
  width: number
  height: number
}

type MeasuredChartProps = {
  children: (size: ChartSize) => ReactNode
  className?: string
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

const MeasuredChart = ({
  children,
  className = "mt-4 h-72 min-h-72 min-w-0",
}: MeasuredChartProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [size, setSize] = useState<ChartSize>({
    width: 0,
    height: 0,
  })

  useEffect(() => {
    const element = containerRef.current

    if (!element) return

    const updateSize = () => {
      const rect = element.getBoundingClientRect()
      const width = Math.floor(rect.width)
      const height = Math.floor(rect.height)

      if (width > 0 && height > 0) {
        setSize((currentSize) => {
          if (currentSize.width === width && currentSize.height === height) {
            return currentSize
          }

          return {
            width,
            height,
          }
        })
      }
    }

    updateSize()

    const resizeObserver = new ResizeObserver(updateSize)
    resizeObserver.observe(element)

    window.addEventListener("resize", updateSize)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener("resize", updateSize)
    }
  }, [])

  return (
    <div ref={containerRef} className={className}>
      {size.width > 0 && size.height > 0 ? (
        children(size)
      ) : (
        <div className="flex h-full min-h-72 items-center justify-center rounded-lg border border-slate-100 bg-slate-50 text-sm font-medium text-slate-400">
          Preparing chart...
        </div>
      )}
    </div>
  )
}

const Dashboard = () => {
  const [agentsPage, setAgentsPage] = useState(1)
  const [agentsRowsPerPage, setAgentsRowsPerPage] = useState(10)

  const {
    data: summary,
    isLoading: isSummaryLoading,
    error: summaryError,
  } = useQuery<DashboardSummary>({
    queryKey: ["dashboard-summary"],
    queryFn: fetchDashboardSummary,
    retry: false,
  })

  const {
    data: agents = [],
    isLoading: isAgentsLoading,
    error: agentsError,
  } = useQuery<AgentPerformance[]>({
    queryKey: ["dashboard-agent-performance"],
    queryFn: fetchAgentPerformance,
    retry: false,
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
  const discontinuedMoney = safeNum(summary?.discontinuedMoney)
  const refundedAmount = safeNum(summary?.refundedAmount)
  const pendingRefunds = safeNum(summary?.pendingRefunds)
  const pendingCancellations = safeNum(summary?.pendingCancellations)
  const unitsClearedForResale = safeNum(summary?.unitsClearedForResale)

  const totalCommissionLiability = safeNum(
    summary?.totalCommissionLiability ?? summary?.commissionPayable,
  )

  const commissionPayableNow = safeNum(
    summary?.commissionPayableNow ?? summary?.commissionPayable,
  )

  const commissionReleased = safeNum(summary?.commissionReleased)

  const commissionCashAdvanceDeducted = safeNum(
    summary?.commissionCashAdvanceDeducted ?? summary?.cashAdvanceDeducted,
  )

  const commissionUnreleasedBalance = safeNum(
    summary?.netCommissionRemaining ??
      summary?.commissionUnreleasedBalance ??
      summary?.commissionRemaining,
  )

  const stats = [
    {
      title: "Total Sales",
      value: formatMoney(totalSales),
      description:
        "Contract value from active, reserved, paid, and closed client units",
      formula:
        "SUM(TCP) from client units with status active, reserved, fully_paid, or closed.",
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
      formula:
        "SUM(payments.amount) where payment status = verified. Pending and rejected payments are excluded.",
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
      formula:
        "COUNT(*) from client document checklist where status is not_submitted or rejected.",
      icon: <FiFileText />,
    },
    {
      title: "Discontinued Money",
      value: formatMoney(discontinuedMoney),
      description: "Non-refundable cancelled-sale money retained by company",
      formula:
        "SUM(discontinued_amount) from settled cancellation settlements.",
      icon: <FiDollarSign />,
    },
    {
      title: "Refunded Amount",
      value: formatMoney(refundedAmount),
      description: "Refunds released from settled cancellations",
      formula:
        "SUM(refund_amount) from settled full-refund or partial-refund settlements.",
      icon: <FiCreditCard />,
    },
    {
      title: "Pending Refunds",
      value: formatMoney(pendingRefunds),
      description: "Approved refunds not yet marked as released",
      formula:
        "SUM(refund_amount) from cancellation settlements where status = approved_for_refund.",
      icon: <FiCreditCard />,
    },
    {
      title: "Pending Cancellations",
      value: formatNumber(pendingCancellations),
      description: "Units locked while cancellation settlement is not yet complete",
      formula:
        "COUNT(client_units) where status = pending_cancellation or cancellation_status is pending.",
      icon: <FiHome />,
    },
    {
      title: "Cleared for Resale",
      value: formatNumber(unitsClearedForResale),
      description: "Cancelled accounts whose listings were returned to available",
      formula: "COUNT(client_units) where cleared_for_resale_at is not null.",
      icon: <FiHome />,
    },
    {
      title: "Total Commission",
      value: formatMoney(totalCommissionLiability),
      description: "Full commission liability, including future releases",
      formula:
        "SUM(commissions.gross_commission) where commission status is not cancelled.",
      icon: <FiDollarSign />,
    },
    {
      title: "Eligible",
      value: formatMoney(commissionPayableNow),
      description: "Only eligible commission releases ready to pay",
      formula:
        "SUM(commission_releases.net_release_amount) where release status = eligible.",
      icon: <FiDollarSign />,
    },
    {
      title: "Commission Released",
      value: formatMoney(commissionReleased),
      description: "Already released commission value",
      formula:
        "SUM(commission_releases.net_release_amount) where release status = released.",
      icon: <FiDollarSign />,
    },
    {
      title: "Cash Advance Deducted",
      value: formatMoney(commissionCashAdvanceDeducted),
      description: "Cash advances already deducted from commission releases",
      formula:
        "SUM(commission_releases.cash_advance_deduction) for non-cancelled commissions.",
      icon: <FiCreditCard />,
    },
    {
      title: "Net Remaining",
      value: formatMoney(commissionUnreleasedBalance),
      description:
        "Commission still payable after released amounts and cash advances",
      formula:
        "SUM(gross_commission) - SUM(released net_release_amount) - SUM(cash_advance_deduction).",
      icon: <FiDollarSign />,
    },
  ]

  const commissionData = [
    {
      name: "Eligible",
      value: commissionPayableNow,
      color: "#2563eb",
    },
    {
      name: "Released",
      value: commissionReleased,
      color: "#10b981",
    },
    {
      name: "Cash Advance Deducted",
      value: commissionCashAdvanceDeducted,
      color: "#ef4444",
    },
    {
      name: "Net Remaining",
      value: commissionUnreleasedBalance,
      color: "#f59e0b",
    },
  ].filter((item) => item.value > 0)

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
    net: safeNum(agent.net),
    total: safeNum(agent.total_sales),
  }))

  const agentTotalPages = Math.max(
    Math.ceil(agents.length / agentsRowsPerPage),
    1,
  )

  const safeAgentsPage = Math.min(Math.max(agentsPage, 1), agentTotalPages)

  const paginatedAgents = agents.slice(
    (safeAgentsPage - 1) * agentsRowsPerPage,
    safeAgentsPage * agentsRowsPerPage,
  )

  if (isSummaryLoading) {
    return <LoadingState message="Loading dashboard..." />
  }

  if (summaryError) {
    return (
      <Alert
        message={
          summaryError instanceof Error ? summaryError.message : "Request failed"
        }
        title="Failed to load dashboard"
        variant="error"
      />
    )
  }

  return (
    <div className="min-w-0">
      <PageHeader
        icon={<FiBarChart2 className="h-5 w-5" />}
        subtitle="Real-time system summary from MySQL"
        title="Dashboard"
      />

      <div className="mb-6 grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
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

      <div className="mb-6 grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm xl:col-span-1">
          <h2 className="text-base font-bold text-slate-900">
            Eligible vs Released vs Net Remaining
          </h2>

          {commissionData.length === 0 ? (
            <div className="mt-4">
              <EmptyState title="No commission records to chart" />
            </div>
          ) : (
            <MeasuredChart>
              {({ width, height }) => (
                <PieChart height={height} width={width}>
                  <Pie
                    cx="50%"
                    cy="45%"
                    data={commissionData}
                    dataKey="value"
                    innerRadius={Math.min(width, height) * 0.18}
                    nameKey="name"
                    outerRadius={Math.min(width, height) * 0.3}
                    paddingAngle={3}
                  >
                    {commissionData.map((entry) => (
                      <Cell fill={entry.color} key={entry.name} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatMoney(value as number)} />
                  <Legend />
                </PieChart>
              )}
            </MeasuredChart>
          )}
        </div>

        <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm xl:col-span-1">
          <h2 className="text-base font-bold text-slate-900">
            Sales vs Collections
          </h2>

          <MeasuredChart>
            {({ width, height }) => (
              <BarChart
                data={salesCollectionsData}
                height={height}
                margin={{
                  top: 10,
                  right: 10,
                  left: 10,
                  bottom: 10,
                }}
                width={width}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis
                  tickFormatter={(value) => `${Number(value) / 1000000}M`}
                />
                <Tooltip formatter={(value) => formatMoney(value as number)} />
                <Bar dataKey="value" fill="#2563eb" radius={[8, 8, 0, 0]} />
              </BarChart>
            )}
          </MeasuredChart>
        </div>

        <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm xl:col-span-1">
          <h2 className="text-base font-bold text-slate-900">
            Agent Performance
          </h2>

          {isAgentsLoading ? (
            <div className="mt-4">
              <LoadingState message="Loading agent performance..." />
            </div>
          ) : agentsError ? (
            <div className="mt-4">
              <Alert
                message={
                  agentsError instanceof Error
                    ? agentsError.message
                    : "Request failed"
                }
                title="Failed to load agent performance"
                variant="error"
              />
            </div>
          ) : agentChartData.length === 0 ? (
            <div className="mt-4">
              <EmptyState title="No agent performance records" />
            </div>
          ) : (
            <MeasuredChart>
              {({ width, height }) => (
                <BarChart
                  data={agentChartData}
                  height={height}
                  layout="vertical"
                  margin={{
                    top: 10,
                    right: 10,
                    left: 10,
                    bottom: 10,
                  }}
                  width={width}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    tickFormatter={(value) => `${Number(value) / 1000000}M`}
                    type="number"
                  />
                  <YAxis dataKey="name" type="category" width={90} />
                  <Tooltip formatter={(value) => formatMoney(value as number)} />
                  <Bar
                    dataKey="net"
                    fill="#10b981"
                    name="Commission Earned"
                    radius={[0, 8, 8, 0]}
                  />
                </BarChart>
              )}
            </MeasuredChart>
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
                Commission Earned
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 bg-white">
            {paginatedAgents.map((agent) => (
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

        {agents.length === 0 ? (
          <EmptyState title="No agent performance records" />
        ) : null}
      </TableContainer>

      {agents.length > 0 ? (
        <Pagination
          onPageChange={setAgentsPage}
          onRowsPerPageChange={setAgentsRowsPerPage}
          page={safeAgentsPage}
          rowsPerPage={agentsRowsPerPage}
          totalRows={agents.length}
        />
      ) : null}
    </div>
  )
}

export default Dashboard
