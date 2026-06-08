import { useMemo, useState, type ReactNode } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  FiDollarSign,
  FiEdit2,
  FiEye,
  FiPause,
  FiPlay,
  FiSearch,
} from "react-icons/fi"
import Alert from "../components/ui/Alert"
import Button from "../components/ui/Button"
import EmptyState from "../components/ui/EmptyState"
import Input from "../components/ui/Input"
import LoadingState from "../components/ui/LoadingState"
import Modal from "../components/ui/Modal"
import PageHeader from "../components/ui/PageHeader"
import Pagination from "../components/ui/Pagination"
import Select from "../components/ui/Select"
import StatCard from "../components/ui/StatCard"
import StatusBadge from "../components/ui/StatusBadge"
import TableContainer from "../components/ui/TableContainer"
import { API_URL, getErrorMessage } from "../utils/api"
import {
  formatDate,
  formatMoney,
  formatNumber,
  formatText,
} from "../utils/formatters"
import { paginateRows } from "../utils/pagination"

type CommissionStatus =
  | "active"
  | "partially_released"
  | "released"
  | "cancelled"
  | "on_hold"
  | string

type ReleaseStatus =
  | "pending"
  | "eligible"
  | "released"
  | "cancelled"
  | "on_hold"
  | string

type Commission = {
  id: number
  client_unit_id: number
  seller_id: number
  commission_role: string | null
  source_type: "main" | "override" | string
  parent_commission_id: number | null
  sale_type: "distributed" | "direct" | string
  cash_kaliwaan_amount: number | string
  cash_kaliwaan_date: string | null
  cash_kaliwaan_notes: string | null
  override_notes: string | null
  seller_name: string
  seller_role: string
  reports_under: string | null
  client_name: string
  unit_id: string
  project_name: string
  mode_of_payment?: string | null
  lot_area_sqm: number | string
  price_per_sqm: number | string
  net_selling_price: number | string
  legal_misc_fee: number | string
  total_contract_price: number | string
  commission_base: number | string
  gross_commission: number | string
  rate: number | string
  eligible_amount: number | string
  released_amount: number | string
  cash_advance_deduction: number | string
  cash_advance_amount: number | string
  cash_advance_remaining: number | string
  cash_advance_deducted: number | string
  remaining_amount: number | string
  total_released_percent: number | string
  first_release_amount: number | string
  second_release_amount: number | string
  third_release_amount: number | string
  fourth_release_amount: number | string
  retention_amount: number | string
  first_release_status: ReleaseStatus | null
  second_release_status: ReleaseStatus | null
  third_release_status: ReleaseStatus | null
  fourth_release_status: ReleaseStatus | null
  retention_status: ReleaseStatus | null
  total_paid: number | string
  payment_percentage: number | string
  status: CommissionStatus
  notes?: string | null
  created_at: string
  updated_at: string
}

type CommissionRelease = {
  id: number
  commission_id: number
  release_stage: string
  trigger_payment_percent: number | string | null
  release_percent: number | string
  cumulative_release_percent: number | string | null
  gross_release_amount: number | string
  cash_advance_deduction: number | string
  net_release_amount: number | string
  status: ReleaseStatus
  released_at: string | null
  released_by: number | null
  released_by_name?: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

type CashAdvanceDeduction = {
  id: number
  cash_advance_id: number
  commission_release_id: number
  amount: number | string
  notes: string | null
  created_at: string
  seller_id: number
  client_unit_id: number | null
  commission_id: number | null
  cash_advance_status: string
  remaining_balance: number | string
  seller_name: string
  release_stage: string
  created_by_name: string | null
}

type CashAdvance = {
  id: number
  seller_id: number
  client_unit_id: number | null
  commission_id: number | null
  amount: number | string
  remaining_balance: number | string
  status: string
  requested_at: string | null
  approved_at: string | null
  approved_by: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

type CommissionDetails = Commission & {
  releases: CommissionRelease[]
  cashAdvanceDeductions: CashAdvanceDeduction[]
}

type Seller = {
  id: number
  full_name: string
  seller_role: string
  commission_rate?: number | string | null
  reports_under_display?: string | null
}

type CommissionSummary = {
  total_commissions: number | string
  total_amount: number | string
  total_eligible: number | string
  total_released: number | string
  total_remaining: number | string
  total_cash_advance_deduction: number | string
  active_count: number | string
  partially_released_count: number | string
  released_count: number | string
  cancelled_count: number | string
  main_count: number | string
  override_count: number | string
}

type CommissionEditData = {
  seller_id: number | ""
  rate: string
  commission_role: string
  source_type: "main" | "override"
  sale_type: "distributed" | "direct"
  cash_kaliwaan_amount: string
  cash_kaliwaan_date: string
  cash_kaliwaan_notes: string
  override_notes: string
  status: CommissionStatus
  notes: string
}

type DeductAdvanceData = {
  cash_advance_id: number | ""
  amount: string
  notes: string
}

type CommissionsResponse = {
  commissions?: Commission[]
  data?: Commission[]
}

type CommissionResponse = {
  commission?: CommissionDetails
  data?: CommissionDetails
}

type CommissionSummaryResponse = {
  summary?: CommissionSummary
  data?: CommissionSummary
}

type SellersResponse = {
  accreditedSellers?: Seller[]
  sellers?: Seller[]
  data?: Seller[]
}

type CashAdvancesResponse = {
  cashAdvances?: CashAdvance[]
  data?: CashAdvance[]
}

const defaultCommissionEditData: CommissionEditData = {
  seller_id: "",
  rate: "",
  commission_role: "",
  source_type: "main",
  sale_type: "distributed",
  cash_kaliwaan_amount: "",
  cash_kaliwaan_date: "",
  cash_kaliwaan_notes: "",
  override_notes: "",
  status: "active",
  notes: "",
}

const defaultDeductAdvanceData: DeductAdvanceData = {
  cash_advance_id: "",
  amount: "",
  notes: "",
}

const fetchCommissions = async (): Promise<Commission[]> => {
  const res = await fetch(`${API_URL}/commissions`, {
    credentials: "include",
  })

  if (!res.ok) throw new Error(await getErrorMessage(res))

  const data = (await res.json()) as CommissionsResponse
  return data.commissions || data.data || []
}

const fetchCommissionSummary = async (): Promise<CommissionSummary> => {
  const res = await fetch(`${API_URL}/commissions-summary`, {
    credentials: "include",
  })

  if (!res.ok) throw new Error(await getErrorMessage(res))

  const data = (await res.json()) as CommissionSummaryResponse

  return (
    data.summary ||
    data.data || {
      total_commissions: 0,
      total_amount: 0,
      total_eligible: 0,
      total_released: 0,
      total_remaining: 0,
      total_cash_advance_deduction: 0,
      active_count: 0,
      partially_released_count: 0,
      released_count: 0,
      cancelled_count: 0,
      main_count: 0,
      override_count: 0,
    }
  )
}

const fetchSellers = async (): Promise<Seller[]> => {
  const res = await fetch(`${API_URL}/accredited-sellers?status=active`, {
    credentials: "include",
  })

  if (!res.ok) throw new Error(await getErrorMessage(res))

  const data = (await res.json()) as SellersResponse
  return data.accreditedSellers || data.sellers || data.data || []
}

const fetchCommissionDetails = async (commissionId: number) => {
  const res = await fetch(`${API_URL}/commissions/${commissionId}`, {
    credentials: "include",
  })

  if (!res.ok) throw new Error(await getErrorMessage(res))

  const data = (await res.json()) as CommissionResponse
  return data.commission || data.data
}

const fetchApprovedCashAdvances = async (sellerId: number | null) => {
  if (!sellerId) return []

  const res = await fetch(`${API_URL}/sellers/${sellerId}/approved-cash-advances`, {
    credentials: "include",
  })

  if (!res.ok) throw new Error(await getErrorMessage(res))

  const data = (await res.json()) as CashAdvancesResponse
  return data.cashAdvances || data.data || []
}

const updateCommission = async ({
  id,
  commissionData,
}: {
  id: number
  commissionData: CommissionEditData
}) => {
  const res = await fetch(`${API_URL}/commissions/${id}`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      seller_id: commissionData.seller_id || null,
      rate: commissionData.rate === "" ? null : Number(commissionData.rate),
      commission_role: commissionData.commission_role || null,
      source_type: commissionData.source_type,
      sale_type: commissionData.sale_type,
      cash_kaliwaan_amount:
        commissionData.cash_kaliwaan_amount === ""
          ? 0
          : Number(commissionData.cash_kaliwaan_amount),
      cash_kaliwaan_date: commissionData.cash_kaliwaan_date || null,
      cash_kaliwaan_notes: commissionData.cash_kaliwaan_notes || null,
      override_notes: commissionData.override_notes || null,
      status: commissionData.status,
      notes: commissionData.notes || null,
    }),
  })

  if (!res.ok) throw new Error(await getErrorMessage(res))

  return res.json()
}

const generateMilestones = async (commissionId: number) => {
  const res = await fetch(`${API_URL}/commissions/${commissionId}/releases/generate`, {
    method: "POST",
    credentials: "include",
  })

  if (!res.ok) throw new Error(await getErrorMessage(res))

  return res.json()
}

const markRelease = async (releaseId: number) => {
  const res = await fetch(`${API_URL}/commission-releases/${releaseId}/mark-released`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  })

  if (!res.ok) throw new Error(await getErrorMessage(res))

  return res.json()
}

const deductAdvance = async ({
  releaseId,
  deductData,
}: {
  releaseId: number
  deductData: DeductAdvanceData
}) => {
  const res = await fetch(`${API_URL}/commission-releases/${releaseId}/deduct-advance`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      cash_advance_id: deductData.cash_advance_id || null,
      amount: Number(deductData.amount || 0),
      notes: deductData.notes || null,
    }),
  })

  if (!res.ok) throw new Error(await getErrorMessage(res))

  return res.json()
}

const cancelRelease = async (releaseId: number) => {
  const res = await fetch(`${API_URL}/commission-releases/${releaseId}/cancel`, {
    method: "PATCH",
    credentials: "include",
  })

  if (!res.ok) throw new Error(await getErrorMessage(res))

  return res.json()
}

const holdRelease = async (releaseId: number) => {
  const res = await fetch(`${API_URL}/commission-releases/${releaseId}/hold`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  })

  if (!res.ok) throw new Error(await getErrorMessage(res))

  return res.json()
}

const unholdRelease = async (releaseId: number) => {
  const res = await fetch(`${API_URL}/commission-releases/${releaseId}/unhold`, {
    method: "PATCH",
    credentials: "include",
  })

  if (!res.ok) throw new Error(await getErrorMessage(res))

  return res.json()
}

const commissionToEditData = (commission: Commission): CommissionEditData => ({
  seller_id: commission.seller_id,
  rate:
    commission.rate === null || commission.rate === undefined
      ? ""
      : String(commission.rate),
  commission_role: commission.commission_role || "",
  source_type: commission.source_type === "override" ? "override" : "main",
  sale_type: commission.sale_type === "direct" ? "direct" : "distributed",
  cash_kaliwaan_amount:
    Number(commission.cash_kaliwaan_amount || 0) > 0
      ? String(commission.cash_kaliwaan_amount)
      : "",
  cash_kaliwaan_date: commission.cash_kaliwaan_date
    ? commission.cash_kaliwaan_date.slice(0, 10)
    : "",
  cash_kaliwaan_notes: commission.cash_kaliwaan_notes || "",
  override_notes: commission.override_notes || "",
  status: commission.status || "active",
  notes: commission.notes || "",
})

const formatReleaseCell = (
  amount: number | string | null | undefined,
  status: ReleaseStatus | null | undefined
) => {
  const formattedAmount = formatMoney(amount || 0)
  const formattedStatus = status ? formatText(status) : "No milestone"

  return `${formattedAmount} / ${formattedStatus}`
}

const getReleaseStageLabel = (stage: string) => {
  switch (stage) {
    case "1st_release":
      return "1st Release 20%"
    case "2nd_release":
      return "2nd Release 40%"
    case "3rd_release":
      return "3rd Release 60%"
    case "4th_release":
      return "4th Release 75%"
    case "retention":
      return "Retention 25%"
    default:
      return formatText(stage)
  }
}

const groupCommissionsByClientUnit = (commissions: Commission[]) => {
  const groups = new Map<number, Commission[]>()

  commissions.forEach((commission) => {
    const existing = groups.get(commission.client_unit_id) || []
    existing.push(commission)
    groups.set(commission.client_unit_id, existing)
  })

  return Array.from(groups.entries()).map(([client_unit_id, group]) => {
    const main =
      group.find((commission) => commission.source_type === "main") || group[0]
    const override =
      group.find((commission) => commission.source_type === "override") || null

    return {
      client_unit_id,
      main,
      override,
      all: group,
    }
  })
}

const CashAdvanceCell = ({
  amount,
  remaining,
  deducted,
}: {
  amount: number | string
  remaining: number | string
  deducted: number | string
}) => {
  const hasCashAdvance =
    Number(amount || 0) > 0 ||
    Number(remaining || 0) > 0 ||
    Number(deducted || 0) > 0

  if (!hasCashAdvance) return <span>-</span>

  return (
    <>
      <p>{formatMoney(amount || 0)}</p>
      <p className="text-xs text-slate-500">
        Rem: {formatMoney(remaining || 0)}
      </p>
      <p className="text-xs text-slate-500">
        Deducted: {formatMoney(deducted || 0)}
      </p>
    </>
  )
}

const Commissions = () => {
  const queryClient = useQueryClient()

  const [searchInput, setSearchInput] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sourceTypeFilter, setSourceTypeFilter] = useState("all")
  const [saleTypeFilter, setSaleTypeFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [viewCommissionId, setViewCommissionId] = useState<number | null>(null)
  const [editCommission, setEditCommission] = useState<Commission | null>(null)
  const [editData, setEditData] =
    useState<CommissionEditData>(defaultCommissionEditData)
  const [deductReleaseId, setDeductReleaseId] = useState<number | null>(null)
  const [deductData, setDeductData] =
    useState<DeductAdvanceData>(defaultDeductAdvanceData)
  const [successMessage, setSuccessMessage] = useState("")

  const {
    data: commissions = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["commissions"],
    queryFn: fetchCommissions,
  })

  const { data: summary } = useQuery({
    queryKey: ["commission-summary"],
    queryFn: fetchCommissionSummary,
  })

  const { data: sellers = [] } = useQuery({
    queryKey: ["accredited-sellers", "active"],
    queryFn: fetchSellers,
  })

  const {
    data: commissionDetails,
    isLoading: isDetailsLoading,
    error: detailsError,
  } = useQuery({
    queryKey: ["commission-details", viewCommissionId],
    queryFn: () => fetchCommissionDetails(viewCommissionId || 0),
    enabled: Boolean(viewCommissionId),
  })

  const { data: approvedCashAdvances = [] } = useQuery({
    queryKey: [
      "approved-cash-advances",
      commissionDetails?.seller_id || null,
    ],
    queryFn: () => fetchApprovedCashAdvances(commissionDetails?.seller_id || null),
    enabled: Boolean(commissionDetails?.seller_id && deductReleaseId),
  })

  const invalidateCommissionQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["commissions"] })
    queryClient.invalidateQueries({ queryKey: ["commission-summary"] })
    queryClient.invalidateQueries({ queryKey: ["commission-releases"] })
    queryClient.invalidateQueries({ queryKey: ["cash-advances"] })
    queryClient.invalidateQueries({ queryKey: ["cash-advances-summary"] })

    if (viewCommissionId) {
      queryClient.invalidateQueries({
        queryKey: ["commission-details", viewCommissionId],
      })
    }

    if (commissionDetails?.seller_id) {
      queryClient.invalidateQueries({
        queryKey: ["approved-cash-advances", commissionDetails.seller_id],
      })
    }
  }

  const updateMutation = useMutation({
    mutationFn: updateCommission,
    onSuccess: () => {
      invalidateCommissionQueries()
      setEditCommission(null)
      setSuccessMessage("Commission updated successfully")
    },
  })

  const generateMutation = useMutation({
    mutationFn: generateMilestones,
    onSuccess: () => {
      invalidateCommissionQueries()
      setSuccessMessage("Milestones generated successfully")
    },
  })

  const markReleaseMutation = useMutation({
    mutationFn: markRelease,
    onSuccess: () => {
      invalidateCommissionQueries()
      setSuccessMessage("Release marked as released")
    },
  })

  const deductMutation = useMutation({
    mutationFn: deductAdvance,
    onSuccess: () => {
      invalidateCommissionQueries()
      setDeductReleaseId(null)
      setDeductData(defaultDeductAdvanceData)
      setSuccessMessage("Cash advance deducted successfully")
    },
  })

  const cancelReleaseMutation = useMutation({
    mutationFn: cancelRelease,
    onSuccess: () => {
      invalidateCommissionQueries()
      setSuccessMessage("Release cancelled successfully")
    },
  })

  const holdReleaseMutation = useMutation({
    mutationFn: holdRelease,
    onSuccess: () => {
      invalidateCommissionQueries()
      setSuccessMessage("Release put on hold")
    },
  })

  const unholdReleaseMutation = useMutation({
    mutationFn: unholdRelease,
    onSuccess: () => {
      invalidateCommissionQueries()
      setSuccessMessage("Release restored")
    },
  })

  const filteredCommissions = commissions.filter((commission) => {
    const search = searchInput.toLowerCase().trim()

    const matchesSearch =
      search === "" ||
      commission.client_name.toLowerCase().includes(search) ||
      commission.unit_id.toLowerCase().includes(search) ||
      commission.project_name.toLowerCase().includes(search) ||
      commission.seller_name.toLowerCase().includes(search) ||
      (commission.commission_role || "").toLowerCase().includes(search) ||
      (commission.reports_under || "").toLowerCase().includes(search) ||
      (commission.mode_of_payment || "").toLowerCase().includes(search) ||
      commission.sale_type.toLowerCase().includes(search) ||
      commission.source_type.toLowerCase().includes(search)

    const matchesStatus =
      statusFilter === "all" || commission.status === statusFilter

    const matchesSourceType =
      sourceTypeFilter === "all" || commission.source_type === sourceTypeFilter

    const matchesSaleType =
      saleTypeFilter === "all" || commission.sale_type === saleTypeFilter

    return matchesSearch && matchesStatus && matchesSourceType && matchesSaleType
  })

  const groupedRows = groupCommissionsByClientUnit(filteredCommissions)
  const paginatedGroups = paginateRows(groupedRows, page, rowsPerPage)

  const openEditModal = (commission: Commission) => {
    setEditCommission(commission)
    setEditData(commissionToEditData(commission))
    setSuccessMessage("")
  }

  const handleUpdateCommission = () => {
    if (!editCommission) return

    updateMutation.mutate({
      id: editCommission.id,
      commissionData: editData,
    })
  }

  const handleDeduct = () => {
    if (!deductReleaseId) return

    deductMutation.mutate({
      releaseId: deductReleaseId,
      deductData,
    })
  }

  const mutationError =
    updateMutation.error?.message ||
    generateMutation.error?.message ||
    markReleaseMutation.error?.message ||
    deductMutation.error?.message ||
    cancelReleaseMutation.error?.message ||
    holdReleaseMutation.error?.message ||
    unholdReleaseMutation.error?.message

  const totalRows = groupedRows.length

  if (isLoading) {
    return <LoadingState label="Loading commissions..." />
  }

  if (error) {
    return <Alert variant="error" title="Failed to load commissions" />
  }

  return (
    <div>
      <PageHeader
        icon={<FiDollarSign />}
        title="Commissions"
        subtitle="Track auto-generated commissions, release milestones, cash advances, retention, and optional cash kaliwaan."
      />

      {successMessage ? <Alert variant="success" title={successMessage} /> : null}
      {mutationError ? <Alert variant="error" title={mutationError} /> : null}

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4 xl:grid-cols-6">
        <StatCard
          label="Total Commissions"
          value={formatNumber(summary?.total_commissions || 0)}
        />
        <StatCard
          label="Gross Commission"
          value={formatMoney(summary?.total_amount || 0)}
        />
        <StatCard
          label="Eligible"
          value={formatMoney(summary?.total_eligible || 0)}
        />
        <StatCard
          label="Released"
          value={formatMoney(summary?.total_released || 0)}
        />
        <StatCard
          label="Remaining"
          value={formatMoney(summary?.total_remaining || 0)}
        />
        <StatCard
          label="Cash Advance Deductions"
          value={formatMoney(summary?.total_cash_advance_deduction || 0)}
        />
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-5">
        <Input
          icon={<FiSearch />}
          placeholder="Search buyer, unit, project, seller..."
          value={searchInput}
          onChange={(e) => {
            setSearchInput(e.target.value)
            setPage(1)
          }}
        />

        <Select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value)
            setPage(1)
          }}
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="partially_released">Partially Released</option>
          <option value="released">Released</option>
          <option value="cancelled">Cancelled</option>
          <option value="on_hold">On Hold</option>
        </Select>

        <Select
          value={sourceTypeFilter}
          onChange={(e) => {
            setSourceTypeFilter(e.target.value)
            setPage(1)
          }}
        >
          <option value="all">All Types</option>
          <option value="main">Main</option>
          <option value="override">Override / Agent</option>
        </Select>

        <Select
          value={saleTypeFilter}
          onChange={(e) => {
            setSaleTypeFilter(e.target.value)
            setPage(1)
          }}
        >
          <option value="all">Distributed / Direct</option>
          <option value="distributed">Distributed</option>
          <option value="direct">Direct</option>
        </Select>

        <Button
          onClick={() => {
            setSearchInput("")
            setStatusFilter("all")
            setSourceTypeFilter("all")
            setSaleTypeFilter("all")
            setPage(1)
          }}
        >
          Reset
        </Button>
      </div>

      <TableContainer>
        <div className="overflow-x-auto">
          <table className="min-w-[3400px] text-sm">
            <thead className="bg-slate-50">
              <tr className="border-b border-slate-200">
                <th
                  colSpan={8}
                  className="border-r border-slate-200 px-4 py-3 text-left text-slate-900"
                >
                  Sale Details
                </th>
                <th
                  colSpan={12}
                  className="border-r border-slate-200 px-4 py-3 text-left text-slate-900"
                >
                  Unit Manager / Main Seller Commission
                </th>
                <th
                  colSpan={13}
                  className="px-4 py-3 text-left text-slate-900"
                >
                  Agent / Optional Override Commission
                </th>
              </tr>

              <tr className="border-b border-slate-200">
                <th className="px-4 py-3 text-left">Buyer’s Name</th>
                <th className="px-4 py-3 text-left">Unit ID</th>
                <th className="px-4 py-3 text-left">Mode of Payment</th>
                <th className="px-4 py-3 text-left">Area</th>
                <th className="px-4 py-3 text-left">Price per SQM</th>
                <th className="px-4 py-3 text-left">Net Selling Price</th>
                <th className="px-4 py-3 text-left">Distributed / Direct</th>
                <th className="border-r border-slate-200 px-4 py-3 text-left">
                  Project
                </th>

                <th className="px-4 py-3 text-left">Unit Manager</th>
                <th className="px-4 py-3 text-left">Rate</th>
                <th className="px-4 py-3 text-left">Commission</th>
                <th className="px-4 py-3 text-left">Payment Percentage</th>
                <th className="px-4 py-3 text-left">1st Release 20%</th>
                <th className="px-4 py-3 text-left">2nd Release 40%</th>
                <th className="px-4 py-3 text-left">3rd Release 60%</th>
                <th className="px-4 py-3 text-left">4th Release 75%</th>
                <th className="px-4 py-3 text-left">Retention 25%</th>
                <th className="px-4 py-3 text-left">Received %</th>
                <th className="px-4 py-3 text-left">Total Remaining</th>
                <th className="border-r border-slate-200 px-4 py-3 text-left">
                  Cash Advance
                </th>

                <th className="px-4 py-3 text-left">Agent’s Name</th>
                <th className="px-4 py-3 text-left">Rate</th>
                <th className="px-4 py-3 text-left">Commission</th>
                <th className="px-4 py-3 text-left">Payment Percentage</th>
                <th className="px-4 py-3 text-left">1st Release 20%</th>
                <th className="px-4 py-3 text-left">2nd Release 40%</th>
                <th className="px-4 py-3 text-left">3rd Release 60%</th>
                <th className="px-4 py-3 text-left">4th Release 75%</th>
                <th className="px-4 py-3 text-left">Retention 25%</th>
                <th className="px-4 py-3 text-left">Received %</th>
                <th className="px-4 py-3 text-left">Total Remaining</th>
                <th className="px-4 py-3 text-left">Cash Advance</th>
                <th className="px-4 py-3 text-left">Cash Kaliwaan / Date</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>

            <tbody>
              {paginatedGroups.map((group) => {
                const main = group.main
                const override = group.override

                return (
                  <tr
                    key={group.client_unit_id}
                    className="border-b border-slate-100 align-top"
                  >
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {main.client_name}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {main.unit_id}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatText(main.mode_of_payment || "-")}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatNumber(main.lot_area_sqm)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatMoney(main.price_per_sqm)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatMoney(main.net_selling_price)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatText(main.sale_type)}
                    </td>
                    <td className="border-r border-slate-200 px-4 py-3 text-slate-600">
                      {main.project_name}
                    </td>

                    <td className="px-4 py-3 text-slate-600">
                      <p className="font-semibold text-slate-900">
                        {main.seller_name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatText(main.commission_role || main.seller_role)}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatNumber(main.rate)}%
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatMoney(main.gross_commission)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatNumber(main.payment_percentage || 0)}%
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatReleaseCell(
                        main.first_release_amount,
                        main.first_release_status
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatReleaseCell(
                        main.second_release_amount,
                        main.second_release_status
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatReleaseCell(
                        main.third_release_amount,
                        main.third_release_status
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatReleaseCell(
                        main.fourth_release_amount,
                        main.fourth_release_status
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatReleaseCell(
                        main.retention_amount,
                        main.retention_status
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatNumber(main.total_released_percent || 0)}%
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatMoney(main.remaining_amount)}
                    </td>
                    <td className="border-r border-slate-200 px-4 py-3 text-slate-600">
                      <CashAdvanceCell
                        amount={main.cash_advance_amount || 0}
                        remaining={main.cash_advance_remaining || 0}
                        deducted={main.cash_advance_deducted || 0}
                      />
                    </td>

                    <td className="px-4 py-3 text-slate-600">
                      {override ? (
                        <>
                          <p className="font-semibold text-slate-900">
                            {override.seller_name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {formatText(
                              override.commission_role || override.seller_role
                            )}
                          </p>
                        </>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {override ? `${formatNumber(override.rate)}%` : "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {override ? formatMoney(override.gross_commission) : "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {override
                        ? `${formatNumber(override.payment_percentage || 0)}%`
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {override
                        ? formatReleaseCell(
                            override.first_release_amount,
                            override.first_release_status
                          )
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {override
                        ? formatReleaseCell(
                            override.second_release_amount,
                            override.second_release_status
                          )
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {override
                        ? formatReleaseCell(
                            override.third_release_amount,
                            override.third_release_status
                          )
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {override
                        ? formatReleaseCell(
                            override.fourth_release_amount,
                            override.fourth_release_status
                          )
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {override
                        ? formatReleaseCell(
                            override.retention_amount,
                            override.retention_status
                          )
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {override
                        ? `${formatNumber(override.total_released_percent || 0)}%`
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {override ? formatMoney(override.remaining_amount) : "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {override ? (
                        <CashAdvanceCell
                          amount={override.cash_advance_amount || 0}
                          remaining={override.cash_advance_remaining || 0}
                          deducted={override.cash_advance_deducted || 0}
                        />
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {override &&
                      Number(override.cash_kaliwaan_amount || 0) > 0 ? (
                        <>
                          <p>{formatMoney(override.cash_kaliwaan_amount)}</p>
                          <p className="text-xs text-slate-500">
                            {formatDate(override.cash_kaliwaan_date)}
                          </p>
                        </>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          icon={<FiEye />}
                          onClick={() => setViewCommissionId(main.id)}
                        >
                          Main
                        </Button>

                        <Button
                          icon={<FiEdit2 />}
                          onClick={() => openEditModal(main)}
                        >
                          Edit Main
                        </Button>

                        {override ? (
                          <>
                            <Button
                              icon={<FiEye />}
                              onClick={() => setViewCommissionId(override.id)}
                            >
                              Agent
                            </Button>
                            <Button
                              icon={<FiEdit2 />}
                              onClick={() => openEditModal(override)}
                            >
                              Edit Agent
                            </Button>
                          </>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                )
              })}

              {paginatedGroups.length === 0 ? (
                <tr>
                  <td colSpan={34}>
                    <EmptyState
                      title="No commissions found"
                      description="Commissions are generated automatically when a listing is reserved."
                    />
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </TableContainer>

      <Pagination
        page={page}
        rowsPerPage={rowsPerPage}
        totalRows={totalRows}
        onPageChange={setPage}
        onRowsPerPageChange={setRowsPerPage}
      />

      {editCommission ? (
        <Modal
          title={`Edit Commission - ${editCommission.seller_name}`}
          onClose={() => setEditCommission(null)}
          size="lg"
          footer={
            <div className="flex justify-end gap-2">
              <Button onClick={() => setEditCommission(null)}>Cancel</Button>
              <Button
                disabled={updateMutation.isPending}
                onClick={handleUpdateCommission}
                variant="primary"
              >
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          }
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Select
              label="Seller"
              value={editData.seller_id}
              onChange={(e) =>
                setEditData({
                  ...editData,
                  seller_id: e.target.value ? Number(e.target.value) : "",
                })
              }
            >
              <option value="">Select seller</option>
              {sellers.map((seller) => (
                <option key={seller.id} value={seller.id}>
                  {seller.full_name} - {formatText(seller.seller_role)}
                </option>
              ))}
            </Select>

            <Input
              label="Rate (%)"
              type="number"
              min={0}
              max={100}
              step="0.01"
              value={editData.rate}
              onChange={(e) =>
                setEditData({
                  ...editData,
                  rate: e.target.value,
                })
              }
            />

            <Input
              label="Commission Role"
              value={editData.commission_role}
              onChange={(e) =>
                setEditData({
                  ...editData,
                  commission_role: e.target.value,
                })
              }
            />

            <Select
              label="Source Type"
              value={editData.source_type}
              onChange={(e) =>
                setEditData({
                  ...editData,
                  source_type: e.target.value as "main" | "override",
                })
              }
            >
              <option value="main">Main</option>
              <option value="override">Override / Agent</option>
            </Select>

            <Select
              label="Distributed / Direct"
              value={editData.sale_type}
              onChange={(e) =>
                setEditData({
                  ...editData,
                  sale_type: e.target.value as "distributed" | "direct",
                })
              }
            >
              <option value="distributed">Distributed</option>
              <option value="direct">Direct</option>
            </Select>

            <Select
              label="Status"
              value={editData.status}
              onChange={(e) =>
                setEditData({
                  ...editData,
                  status: e.target.value,
                })
              }
            >
              <option value="active">Active</option>
              <option value="partially_released">Partially Released</option>
              <option value="released">Released</option>
              <option value="cancelled">Cancelled</option>
              <option value="on_hold">On Hold</option>
            </Select>

            <Input
              label="Cash Kaliwaan Amount"
              type="number"
              min={0}
              step="0.01"
              value={editData.cash_kaliwaan_amount}
              onChange={(e) =>
                setEditData({
                  ...editData,
                  cash_kaliwaan_amount: e.target.value,
                })
              }
              placeholder="Optional"
            />

            <Input
              label="Cash Kaliwaan Date"
              type="date"
              value={editData.cash_kaliwaan_date}
              onChange={(e) =>
                setEditData({
                  ...editData,
                  cash_kaliwaan_date: e.target.value,
                })
              }
            />

            <Input
              label="Cash Kaliwaan Notes"
              value={editData.cash_kaliwaan_notes}
              onChange={(e) =>
                setEditData({
                  ...editData,
                  cash_kaliwaan_notes: e.target.value,
                })
              }
              placeholder="Optional"
            />

            <Input
              label="Override Notes"
              value={editData.override_notes}
              onChange={(e) =>
                setEditData({
                  ...editData,
                  override_notes: e.target.value,
                })
              }
              placeholder="Optional"
            />

            <Input
              label="Notes"
              value={editData.notes}
              onChange={(e) =>
                setEditData({
                  ...editData,
                  notes: e.target.value,
                })
              }
              placeholder="Optional"
            />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <ComputedBox
              label="TCP Base"
              value={formatMoney(editCommission.commission_base)}
            />
            <ComputedBox
              label="Current Gross"
              value={formatMoney(editCommission.gross_commission)}
            />
            <ComputedBox
              label="Released"
              value={formatMoney(editCommission.released_amount)}
            />
          </div>

          <p className="mt-3 text-sm text-slate-500">
            Seller and rate cannot be changed after a release has been paid.
          </p>
        </Modal>
      ) : null}

      {viewCommissionId ? (
        <Modal
          title="Commission Details"
          onClose={() => setViewCommissionId(null)}
          size="xl"
          footer={
            <div className="flex justify-end">
              <Button onClick={() => setViewCommissionId(null)}>Close</Button>
            </div>
          }
        >
          {isDetailsLoading ? <LoadingState label="Loading commission details..." /> : null}

          {detailsError ? (
            <Alert variant="error" title="Failed to load commission details" />
          ) : null}

          {commissionDetails ? (
            <div className="space-y-6">
              <DetailsSection title="Commission Info">
                <Detail label="Client" value={commissionDetails.client_name} />
                <Detail label="Unit" value={commissionDetails.unit_id} />
                <Detail label="Project" value={commissionDetails.project_name} />
                <Detail
                  label="Mode of Payment"
                  value={formatText(commissionDetails.mode_of_payment || "-")}
                />
                <Detail label="Seller" value={commissionDetails.seller_name} />
                <Detail
                  label="Type"
                  value={formatText(commissionDetails.source_type)}
                />
                <Detail
                  label="Distributed / Direct"
                  value={formatText(commissionDetails.sale_type)}
                />
                <Detail
                  label="TCP"
                  value={formatMoney(commissionDetails.commission_base)}
                />
                <Detail
                  label="Rate"
                  value={`${formatNumber(commissionDetails.rate)}%`}
                />
                <Detail
                  label="Gross Commission"
                  value={formatMoney(commissionDetails.gross_commission)}
                />
                <Detail
                  label="Cash Advance"
                  value={formatMoney(commissionDetails.cash_advance_amount || 0)}
                />
                <Detail
                  label="Cash Advance Remaining"
                  value={formatMoney(
                    commissionDetails.cash_advance_remaining || 0
                  )}
                />
                <Detail
                  label="Cash Advance Deducted"
                  value={formatMoney(
                    commissionDetails.cash_advance_deducted || 0
                  )}
                />
                <Detail
                  label="Eligible"
                  value={formatMoney(commissionDetails.eligible_amount)}
                />
                <Detail
                  label="Released"
                  value={formatMoney(commissionDetails.released_amount)}
                />
                <Detail
                  label="Remaining"
                  value={formatMoney(commissionDetails.remaining_amount)}
                />
                <Detail
                  label="Payment Percentage"
                  value={`${formatNumber(
                    commissionDetails.payment_percentage || 0
                  )}%`}
                />
                <Detail
                  label="Status"
                  value={formatText(commissionDetails.status)}
                />
              </DetailsSection>

              <DetailsSection title="Optional Cash Kaliwaan">
                <Detail
                  label="Amount"
                  value={formatMoney(commissionDetails.cash_kaliwaan_amount)}
                />
                <Detail
                  label="Date"
                  value={formatDate(commissionDetails.cash_kaliwaan_date)}
                />
                <Detail
                  label="Notes"
                  value={commissionDetails.cash_kaliwaan_notes || "-"}
                />
              </DetailsSection>

              <div className="flex items-center justify-between gap-3">
                <h3 className="text-base font-bold text-slate-900">
                  Release Milestones
                </h3>

                {(commissionDetails.releases || []).length === 0 ? (
                  <Button
                    disabled={generateMutation.isPending}
                    onClick={() => generateMutation.mutate(commissionDetails.id)}
                    variant="primary"
                  >
                    Generate Milestones
                  </Button>
                ) : null}
              </div>

              <TableContainer>
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr className="border-b border-slate-200">
                      <th className="px-4 py-3 text-left">Stage</th>
                      <th className="px-4 py-3 text-left">Trigger</th>
                      <th className="px-4 py-3 text-left">Release %</th>
                      <th className="px-4 py-3 text-left">Gross Amount</th>
                      <th className="px-4 py-3 text-left">
                        Cash Advance Deduction
                      </th>
                      <th className="px-4 py-3 text-left">Net Amount</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(commissionDetails.releases || []).map((release) => (
                      <tr key={release.id} className="border-b border-slate-100">
                        <td className="px-4 py-3 font-semibold">
                          {getReleaseStageLabel(release.release_stage)}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {release.release_stage === "retention"
                            ? "Final condition"
                            : `${formatNumber(
                                release.trigger_payment_percent || 0
                              )}% paid`}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {formatNumber(release.release_percent)}%
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {formatMoney(release.gross_release_amount)}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {formatMoney(release.cash_advance_deduction)}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {formatMoney(release.net_release_amount)}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={release.status} />
                        </td>
                        <td className="px-4 py-3">
                          {release.status === "eligible" ? (
                            <div className="flex flex-wrap gap-2">
                              <Button
                                disabled={markReleaseMutation.isPending}
                                onClick={() => markReleaseMutation.mutate(release.id)}
                                variant="primary"
                              >
                                Mark Released
                              </Button>
                              <Button onClick={() => setDeductReleaseId(release.id)}>
                                Deduct Advance
                              </Button>
                              <Button
                                icon={<FiPause />}
                                disabled={holdReleaseMutation.isPending}
                                onClick={() => holdReleaseMutation.mutate(release.id)}
                              >
                                Hold
                              </Button>
                              <Button
                                disabled={cancelReleaseMutation.isPending}
                                onClick={() => cancelReleaseMutation.mutate(release.id)}
                                variant="danger"
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : null}

                          {release.status === "pending" ? (
                            <div className="flex flex-wrap gap-2">
                              <Button onClick={() => setDeductReleaseId(release.id)}>
                                Deduct Advance
                              </Button>
                              <Button
                                icon={<FiPause />}
                                disabled={holdReleaseMutation.isPending}
                                onClick={() => holdReleaseMutation.mutate(release.id)}
                              >
                                Hold
                              </Button>
                              <Button
                                disabled={cancelReleaseMutation.isPending}
                                onClick={() => cancelReleaseMutation.mutate(release.id)}
                                variant="danger"
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : null}

                          {release.status === "on_hold" ? (
                            <Button
                              icon={<FiPlay />}
                              disabled={unholdReleaseMutation.isPending}
                              onClick={() => unholdReleaseMutation.mutate(release.id)}
                            >
                              Restore
                            </Button>
                          ) : null}

                          {release.status === "released" ? (
                            <span className="text-slate-600">
                              Released {formatDate(release.released_at)} by{" "}
                              {release.released_by_name || "-"}
                            </span>
                          ) : null}

                          {release.status === "cancelled" ? (
                            <span className="text-slate-500">Cancelled</span>
                          ) : null}
                        </td>
                      </tr>
                    ))}

                    {(commissionDetails.releases || []).length === 0 ? (
                      <tr>
                        <td colSpan={8}>
                          <EmptyState title="No milestones generated" />
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </TableContainer>

              <section>
                <h3 className="mb-3 text-base font-bold text-slate-900">
                  Cash Advance Deductions
                </h3>

                <TableContainer>
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr className="border-b border-slate-200">
                        <th className="px-4 py-3 text-left">Release Stage</th>
                        <th className="px-4 py-3 text-left">Cash Advance</th>
                        <th className="px-4 py-3 text-left">Amount</th>
                        <th className="px-4 py-3 text-left">
                          Remaining Balance
                        </th>
                        <th className="px-4 py-3 text-left">Created By</th>
                        <th className="px-4 py-3 text-left">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(commissionDetails.cashAdvanceDeductions || []).map(
                        (deduction) => (
                          <tr
                            key={deduction.id}
                            className="border-b border-slate-100"
                          >
                            <td className="px-4 py-3 text-slate-600">
                              {getReleaseStageLabel(deduction.release_stage)}
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              #{deduction.cash_advance_id}
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              {formatMoney(deduction.amount)}
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              {formatMoney(deduction.remaining_balance)}
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              {deduction.created_by_name || "-"}
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              {formatDate(deduction.created_at)}
                            </td>
                          </tr>
                        )
                      )}

                      {(commissionDetails.cashAdvanceDeductions || []).length ===
                      0 ? (
                        <tr>
                          <td colSpan={6}>
                            <EmptyState title="No cash advance deductions yet" />
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </TableContainer>
              </section>
            </div>
          ) : null}
        </Modal>
      ) : null}

      {deductReleaseId ? (
        <Modal
          title="Deduct Cash Advance"
          onClose={() => {
            setDeductReleaseId(null)
            setDeductData(defaultDeductAdvanceData)
          }}
          footer={
            <div className="flex justify-end gap-2">
              <Button
                onClick={() => {
                  setDeductReleaseId(null)
                  setDeductData(defaultDeductAdvanceData)
                }}
              >
                Cancel
              </Button>
              <Button
                disabled={deductMutation.isPending}
                onClick={handleDeduct}
                variant="primary"
              >
                {deductMutation.isPending ? "Saving..." : "Deduct"}
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <Select
              label="Approved Cash Advance"
              value={deductData.cash_advance_id}
              onChange={(e) =>
                setDeductData({
                  ...deductData,
                  cash_advance_id: e.target.value ? Number(e.target.value) : "",
                })
              }
            >
              <option value="">Manual deduction only / no linked advance</option>
              {approvedCashAdvances.map((advance) => (
                <option key={advance.id} value={advance.id}>
                  #{advance.id} - Remaining{" "}
                  {formatMoney(advance.remaining_balance)} -{" "}
                  {advance.notes || "No notes"}
                </option>
              ))}
            </Select>

            <Input
              label="Deduction Amount"
              type="number"
              min={0}
              step="0.01"
              value={deductData.amount}
              onChange={(e) =>
                setDeductData({
                  ...deductData,
                  amount: e.target.value,
                })
              }
              placeholder="0.00"
            />

            <Input
              label="Notes"
              value={deductData.notes}
              onChange={(e) =>
                setDeductData({
                  ...deductData,
                  notes: e.target.value,
                })
              }
              placeholder="Optional"
            />

            <p className="text-sm text-slate-500">
              Linked cash advance deductions reduce the cash advance balance.
              Manual deductions only reduce the release net amount.
            </p>
          </div>
        </Modal>
      ) : null}
    </div>
  )
}

const DetailsSection = ({
  children,
  title,
}: {
  children: ReactNode
  title: string
}) => {
  return (
    <section>
      <h3 className="mb-3 text-base font-bold text-slate-900">{title}</h3>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {children}
      </div>
    </section>
  )
}

const Detail = ({
  label,
  value,
}: {
  label: string
  value: string | number | null | undefined
}) => {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-900">
        {value === null || value === undefined || value === "" ? "-" : value}
      </p>
    </div>
  )
}

const ComputedBox = ({ label, value }: { label: string; value: string }) => {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase text-slate-400">{label}</p>
      <p className="mt-1 font-semibold text-slate-900">{value}</p>
    </div>
  )
}

export default Commissions