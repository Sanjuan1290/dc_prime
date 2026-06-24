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

type MetricCardData = {
  title: string
  value: ReactNode
  description: ReactNode
  formula?: ReactNode
  icon?: ReactNode
}

type MetricGroup = {
  title: string
  description: string
  icon: ReactNode
  metrics: MetricCardData[]
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

const formatPercent = (value: number) => `${value.toFixed(2)}%`

const toneStyles = {
  blue: "border-blue-100 bg-blue-50 text-blue-700",
  green: "border-emerald-100 bg-emerald-50 text-emerald-700",
  amber: "border-amber-100 bg-amber-50 text-amber-700",
  slate: "border-slate-200 bg-slate-50 text-slate-700",
}

const ScrollValue = ({
  children,
  size = "metric",
}: {
  children: ReactNode
  size?: "summary" | "metric"
}) => {
  const sizeClass = size === "summary" ? "text-xl" : "text-lg"

  return (
    <div className="mt-1 min-w-0 max-w-full overflow-x-auto overflow-y-hidden pb-1">
      <p
        className={[
          "inline-block min-w-max whitespace-nowrap font-bold leading-tight text-slate-950",
          sizeClass,
        ].join(" ")}
      >
        {children}
      </p>
    </div>
  )
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

          return { width, height }
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

const SummaryCard = ({
  description,
  icon,
  label,
  tone = "blue",
  value,
}: {
  description: ReactNode
  icon: ReactNode
  label: ReactNode
  tone?: keyof typeof toneStyles
  value: ReactNode
}) => {
  return (
    <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <ScrollValue size="summary">{value}</ScrollValue>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${toneStyles[tone]}`}
        >
          {icon}
        </div>
      </div>

      <p className="mt-3 text-sm leading-6 text-slate-500">{description}</p>
    </div>
  )
}

const MetricCard = ({
  description,
  formula,
  icon,
  title,
  value,
}: MetricCardData) => {
  return (
    <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-500">{title}</p>
          <ScrollValue>{value}</ScrollValue>
        </div>

        {icon ? (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
            {icon}
          </div>
        ) : null}
      </div>

      <p className="mt-3 text-sm leading-6 text-slate-500">{description}</p>

      {formula ? (
        <details className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
          <summary className="cursor-pointer font-semibold text-slate-700">
            How this is counted
          </summary>
          <div className="mt-2 leading-5">{formula}</div>
        </details>
      ) : null}
    </div>
  )
}

const MetricSection = ({ description, icon, metrics, title }: MetricGroup) => {
  return (
    <section className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 shadow-sm">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-blue-600 shadow-sm">
          {icon}
        </div>
        <div className="min-w-0">
          <h2 className="text-base font-bold text-slate-950">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
        </div>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {metrics.map((metric) => (
          <MetricCard key={metric.title} {...metric} />
        ))}
      </div>
    </section>
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
  const cancelledAccounts = safeNum(summary?.cancelledAccounts)
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

  const collectionProgressWidth = `${Math.min(
    Math.max(collectionProgress, 0),
    100,
  )}%`

  const metricGroups: MetricGroup[] = [
    {
      title: "Sales & Collections",
      description:
        "Shows booked contract value, reserved sales, verified payments, and how much of booked sales has already been collected.",
      icon: <FiDollarSign className="h-5 w-5" />,
      metrics: [
        {
          title: "Total Sales",
          value: formatMoney(totalSales),
          description:
            "Total contract value from active, reserved, fully paid, and closed client units.",
          formula:
            "SUM(TCP) from client units with status active, reserved, fully_paid, or closed.",
          icon: <FiDollarSign />,
        },
        {
          title: "Pending Sales",
          value: formatMoney(pendingSales),
          description:
            "Reserved accounts that are not yet fully active or fully paid.",
          formula: "SUM(TCP) from client units where status = reserved.",
          icon: <FiHome />,
        },
        {
          title: "Tracked Collections",
          value: formatMoney(trackedCollections),
          description:
            "Verified payments already posted in the Payments module.",
          formula:
            "SUM(payments.amount) where payment status = verified. Pending and rejected payments are excluded.",
          icon: <FiCreditCard />,
        },
        {
          title: "Collection Progress",
          value: formatPercent(collectionProgress),
          description:
            "Percent of total sales already collected through verified payments.",
          formula: "Tracked Collections / Total Sales × 100.",
          icon: <FiBarChart2 />,
        },
      ],
    },
    {
      title: "Inventory",
      description:
        "Shows how much lot value is listed, still available, or already sold.",
      icon: <FiHome className="h-5 w-5" />,
      metrics: [
        {
          title: "Listed Lot Value",
          value: formatMoney(listedLotValue),
          description:
            "Total value of listings that are still part of active inventory tracking.",
          formula:
            "SUM(TCP) from listings where status is available, reserved, sold, or pending_cancellation.",
          icon: <FiHome />,
        },
        {
          title: "Available Lot Value",
          value: formatMoney(availableLotValue),
          description: "Inventory value that can still be offered or reserved.",
          formula: "SUM(TCP) from listings where status = available.",
          icon: <FiHome />,
        },
        {
          title: "Sold Lot Value",
          value: formatMoney(soldLotValue),
          description: "Inventory value already marked as sold.",
          formula: "SUM(TCP) from listings where status = sold.",
          icon: <FiDollarSign />,
        },
      ],
    },
    {
      title: "Clients & Documents",
      description:
        "Shows client count and document checklist items that still need action.",
      icon: <FiUsers className="h-5 w-5" />,
      metrics: [
        {
          title: "Clients",
          value: formatNumber(clientsCount),
          description: "Total registered client records.",
          formula: "COUNT(*) from clients.",
          icon: <FiUsers />,
        },
        {
          title: "Pending Documents",
          value: formatNumber(pendingDocuments),
          description:
            "Checklist items still not submitted or already rejected.",
          formula:
            "COUNT(*) from client document checklist where status is not_submitted or rejected.",
          icon: <FiFileText />,
        },
      ],
    },
    {
      title: "Cancellations & Refunds",
      description:
        "Shows money retained, money refunded, pending refunds, and cancelled accounts cleared for resale.",
      icon: <FiCreditCard className="h-5 w-5" />,
      metrics: [
        {
          title: "Discontinued Money",
          value: formatMoney(discontinuedMoney),
          description:
            "Non-refundable cancelled-sale money retained by the company.",
          formula:
            "SUM(discontinued_amount) from settled cancellation settlements.",
          icon: <FiDollarSign />,
        },
        {
          title: "Refunded Amount",
          value: formatMoney(refundedAmount),
          description: "Refunds already released from settled cancellations.",
          formula:
            "SUM(refund_amount) from settled full-refund or partial-refund settlements.",
          icon: <FiCreditCard />,
        },
        {
          title: "Pending Refunds",
          value: formatMoney(pendingRefunds),
          description:
            "Approved refund amount not yet marked as released.",
          formula:
            "SUM(refund_amount) from cancellation settlements where status = approved_for_refund.",
          icon: <FiCreditCard />,
        },
        {
          title: "Pending Cancellations",
          value: formatNumber(pendingCancellations),
          description:
            "Units still locked while cancellation settlement is not complete.",
          formula:
            "COUNT(client_units) where status = pending_cancellation or cancellation_status is pending.",
          icon: <FiHome />,
        },
        {
          title: "Cancelled Accounts",
          value: formatNumber(cancelledAccounts),
          description: "Accounts already marked cancelled and settled.",
          formula:
            "COUNT(client_units) where status = cancelled and cancellation_status = settled.",
          icon: <FiUsers />,
        },
        {
          title: "Cleared for Resale",
          value: formatNumber(unitsClearedForResale),
          description:
            "Cancelled accounts whose listings returned to available status.",
          formula:
            "COUNT(client_units) where cleared_for_resale_at is not null.",
          icon: <FiHome />,
        },
      ],
    },
    {
      title: "Commissions",
      description:
        "Shows total seller commission liability, payable releases, released amount, cash advance deductions, and remaining balance.",
      icon: <FiDollarSign className="h-5 w-5" />,
      metrics: [
        {
          title: "Total Commission",
          value: formatMoney(totalCommissionLiability),
          description:
            "Full commission liability, including future milestone releases.",
          formula:
            "SUM(commissions.gross_commission) where commission status is not cancelled.",
          icon: <FiDollarSign />,
        },
        {
          title: "Eligible Now",
          value: formatMoney(commissionPayableNow),
          description: "Commission releases ready for payment.",
          formula:
            "SUM(commission_releases.net_release_amount) where release status = eligible.",
          icon: <FiDollarSign />,
        },
        {
          title: "Released",
          value: formatMoney(commissionReleased),
          description: "Commission amount already released to sellers.",
          formula:
            "SUM(commission_releases.net_release_amount) where release status = released.",
          icon: <FiDollarSign />,
        },
        {
          title: "Cash Advance Deducted",
          value: formatMoney(commissionCashAdvanceDeducted),
          description:
            "Cash advances already deducted from commission releases.",
          formula:
            "SUM(commission_releases.cash_advance_deduction) for non-cancelled commissions.",
          icon: <FiCreditCard />,
        },
        {
          title: "Net Remaining",
          value: formatMoney(commissionUnreleasedBalance),
          description:
            "Commission still payable after released amounts and cash advance deductions.",
          formula:
            "SUM(gross_commission) - SUM(released net_release_amount) - SUM(cash_advance_deduction).",
          icon: <FiDollarSign />,
        },
      ],
    },
  ]

  const commissionData = [
    {
      name: "Eligible Now",
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
    <div className="min-w-0 space-y-6">
      <PageHeader
        icon={<FiBarChart2 className="h-5 w-5" />}
        subtitle="Grouped system summary from MySQL"
        title="Dashboard"
      />

      <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">
              Business snapshot
            </p>
            <h2 className="mt-2 text-xl font-bold text-slate-950">
              Main numbers to check first
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              This section separates the main business picture from the detailed
              category cards below.
            </p>
          </div>

          <div className="min-w-[220px] rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="font-semibold text-slate-600">
                Collection progress
              </span>
              <span className="font-bold text-slate-950">
                {formatPercent(collectionProgress)}
              </span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-blue-600"
                style={{ width: collectionProgressWidth }}
              />
            </div>
          </div>
        </div>

        <div className="mt-5 grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            description="All active, reserved, fully paid, and closed contract value."
            icon={<FiDollarSign />}
            label="Total Sales"
            value={formatMoney(totalSales)}
          />
          <SummaryCard
            description="Verified payments already recorded in the system."
            icon={<FiCreditCard />}
            label="Collected"
            tone="green"
            value={formatMoney(trackedCollections)}
          />
          <SummaryCard
            description="Lot inventory value still available for selling."
            icon={<FiHome />}
            label="Available Inventory"
            tone="amber"
            value={formatMoney(availableLotValue)}
          />
          <SummaryCard
            description="Commission releases that are currently eligible for payout."
            icon={<FiDollarSign />}
            label="Payable Commission"
            tone="slate"
            value={formatMoney(commissionPayableNow)}
          />
        </div>
      </section>

      <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-2">
        <MetricSection {...metricGroups[0]} />
        <MetricSection {...metricGroups[1]} />
        <MetricSection {...metricGroups[2]} />
        <MetricSection {...metricGroups[4]} />
        <div className="xl:col-span-2">
          <MetricSection {...metricGroups[3]} />
        </div>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm xl:col-span-1">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Commission Status
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Split between eligible, released, deducted, and remaining
              commission.
            </p>
          </div>

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
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Sales vs Collections
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Compares booked contract value against verified payments.
            </p>
          </div>

          <MeasuredChart>
            {({ width, height }) => (
              <BarChart
                data={salesCollectionsData}
                height={height}
                margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                width={width}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => `${Number(value) / 1000000}M`} />
                <Tooltip formatter={(value) => formatMoney(value as number)} />
                <Bar dataKey="value" fill="#2563eb" radius={[8, 8, 0, 0]} />
              </BarChart>
            )}
          </MeasuredChart>
        </div>

        <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm xl:col-span-1">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Seller Performance
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Top sellers based on commission earned.
            </p>
          </div>

          {isAgentsLoading ? (
            <div className="mt-4">
              <LoadingState message="Loading seller performance..." />
            </div>
          ) : agentsError ? (
            <div className="mt-4">
              <Alert
                message={
                  agentsError instanceof Error
                    ? agentsError.message
                    : "Request failed"
                }
                title="Failed to load seller performance"
                variant="error"
              />
            </div>
          ) : agentChartData.length === 0 ? (
            <div className="mt-4">
              <EmptyState title="No seller performance records" />
            </div>
          ) : (
            <MeasuredChart>
              {({ width, height }) => (
                <BarChart
                  data={agentChartData}
                  height={height}
                  layout="vertical"
                  margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
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

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-4">
          <h2 className="text-base font-bold text-slate-950">
            Seller Performance Details
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Use this table when you need the exact seller totals behind the
            chart.
          </p>
        </div>

        <TableContainer>
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">
                  Seller
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
                <tr
                  className="transition hover:bg-slate-50"
                  key={agent.seller_id}
                >
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
            <EmptyState title="No seller performance records" />
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
      </section>
    </div>
  )
}

export default Dashboard