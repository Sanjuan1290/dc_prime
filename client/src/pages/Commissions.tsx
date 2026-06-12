// client/src/pages/Commissions.tsx

import { useState, type ReactNode } from "react"
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
import ConfirmBox from "../components/ui/ConfirmBox"
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
  override_seller_id: number | ""
  override_rate: string
  override_notes_for_child: string
  status: CommissionStatus
  notes: string
}

type MissingOverrideData = {
  seller_id: number | ""
  rate: string
  override_notes: string
  cash_kaliwaan_amount: string
  cash_kaliwaan_date: string
  cash_kaliwaan_notes: string
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
  override_seller_id: "",
  override_rate: "",
  override_notes_for_child: "",
  status: "active",
  notes: "",
}

const defaultMissingOverrideData: MissingOverrideData = {
  seller_id: "",
  rate: "",
  override_notes: "",
  cash_kaliwaan_amount: "",
  cash_kaliwaan_date: "",
  cash_kaliwaan_notes: "",
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
      override_seller_id:
        commissionData.source_type === "main" &&
        commissionData.sale_type === "distributed" &&
        commissionData.override_seller_id
          ? commissionData.override_seller_id
          : null,
      override_rate:
        commissionData.source_type === "main" &&
        commissionData.sale_type === "distributed" &&
        commissionData.override_rate !== ""
          ? Number(commissionData.override_rate)
          : null,
      override_notes_for_child:
        commissionData.source_type === "main" &&
        commissionData.sale_type === "distributed"
          ? commissionData.override_notes_for_child || null
          : null,
      status: commissionData.status,
      notes: commissionData.notes || null,
    }),
  })

  if (!res.ok) throw new Error(await getErrorMessage(res))

  return res.json()
}

const addMissingOverrideCommission = async ({
  mainCommissionId,
  data,
}: {
  mainCommissionId: number
  data: MissingOverrideData
}) => {
  const res = await fetch(`${API_URL}/commissions/${mainCommissionId}/missing-override`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      override_seller_id: data.seller_id || null,
      override_rate: data.rate === "" ? null : Number(data.rate),
      override_notes: data.override_notes || null,
      cash_kaliwaan_amount:
        data.cash_kaliwaan_amount === ""
          ? 0
          : Number(data.cash_kaliwaan_amount),
      cash_kaliwaan_date: data.cash_kaliwaan_date || null,
      cash_kaliwaan_notes: data.cash_kaliwaan_notes || null,
      notes: data.notes || null,
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

const markReleaseStage = async (releaseId: number) => {
  const res = await fetch(`${API_URL}/commission-releases/${releaseId}/mark-released`, {
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

const cancelRelease = async (releaseId: number) => {
  const res = await fetch(`${API_URL}/commission-releases/${releaseId}/cancel`, {
    method: "PATCH",
    credentials: "include",
  })

  if (!res.ok) throw new Error(await getErrorMessage(res))

  return res.json()
}

const restoreCancelledRelease = async (releaseId: number) => {
  const res = await fetch(`${API_URL}/commission-releases/${releaseId}/restore-cancelled`, {
    method: "PATCH",
    credentials: "include",
  })

  if (!res.ok) throw new Error(await getErrorMessage(res))

  return res.json()
}

const deductCashAdvance = async ({
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
      amount: deductData.amount === "" ? null : Number(deductData.amount),
      notes: deductData.notes || null,
    }),
  })

  if (!res.ok) throw new Error(await getErrorMessage(res))

  return res.json()
}

const getReleaseStageLabel = (stage: string | null | undefined) => {
  switch (stage) {
    case "1st_release":
    case "first_20":
      return "1st Release"
    case "2nd_release":
    case "second_40":
      return "2nd Release"
    case "3rd_release":
    case "third_60":
      return "3rd Release"
    case "4th_release":
    case "fourth_75":
      return "4th Release"
    case "retention":
    case "retention_25":
      return "Retention"
    case "manual":
      return "Manual"
    default:
      return formatText(stage || "-")
  }
}

const getCommissionGroupKey = (commission: Commission) => {
  if (commission.source_type === "override" && commission.parent_commission_id) {
    return `main-${commission.parent_commission_id}`
  }

  return `main-${commission.id}`
}

const commissionToEditData = (
  commission: Commission,
  overrideCommission?: Commission
): CommissionEditData => {
  return {
    seller_id: commission.seller_id || "",
    rate: commission.rate === null || commission.rate === undefined ? "" : String(commission.rate),
    commission_role: commission.commission_role || "agent",
    source_type: commission.source_type === "override" ? "override" : "main",
    sale_type: commission.sale_type === "direct" ? "direct" : "distributed",
    cash_kaliwaan_amount:
      commission.cash_kaliwaan_amount === null ||
      commission.cash_kaliwaan_amount === undefined
        ? ""
        : String(commission.cash_kaliwaan_amount),
    cash_kaliwaan_date: commission.cash_kaliwaan_date
      ? commission.cash_kaliwaan_date.slice(0, 10)
      : "",
    cash_kaliwaan_notes: commission.cash_kaliwaan_notes || "",
    override_notes: commission.override_notes || "",
    override_seller_id: overrideCommission?.seller_id || "",
    override_rate:
      overrideCommission?.rate === null ||
      overrideCommission?.rate === undefined
        ? ""
        : overrideCommission
          ? String(overrideCommission.rate)
          : "",
    override_notes_for_child: overrideCommission?.override_notes || "",
    status: commission.status || "active",
    notes: commission.notes || "",
  }
}

const hasReleasedMilestone = (commission: Commission) => {
  return Number(commission.released_amount || 0) > 0
}

const hasOverrideForMain = (main: Commission, commissions: Commission[]) => {
  return commissions.some(
    (commission) =>
      commission.source_type === "override" &&
      Number(commission.parent_commission_id || 0) === Number(main.id) &&
      commission.status !== "cancelled"
  )
}

const Commissions = () => {
  const queryClient = useQueryClient()

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sourceFilter, setSourceFilter] = useState("all")
  const [saleTypeFilter, setSaleTypeFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const [selectedCommissionId, setSelectedCommissionId] = useState<number | null>(null)
  const [editCommission, setEditCommission] = useState<Commission | null>(null)
  const [editData, setEditData] = useState<CommissionEditData>(
    defaultCommissionEditData
  )

  const [missingOverrideMain, setMissingOverrideMain] =
    useState<Commission | null>(null)

  const [missingOverrideData, setMissingOverrideData] =
    useState<MissingOverrideData>(defaultMissingOverrideData)

  const [deductReleaseId, setDeductReleaseId] = useState<number | null>(null)
  const [deductData, setDeductData] =
    useState<DeductAdvanceData>(defaultDeductAdvanceData)

  const [cancelReleaseId, setCancelReleaseId] = useState<number | null>(null)
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
    queryKey: ["commission-details", selectedCommissionId],
    queryFn: () => fetchCommissionDetails(selectedCommissionId || 0),
    enabled: Boolean(selectedCommissionId),
  })

  const releaseForDeduction =
    commissionDetails?.releases?.find(
      (release) => Number(release.id) === Number(deductReleaseId)
    ) || null

  const releaseForCancellation =
    commissionDetails?.releases?.find(
      (release) => Number(release.id) === Number(cancelReleaseId)
    ) || null

  const selectedDeductionSellerId =
    commissionDetails?.seller_id || editCommission?.seller_id || null

  const { data: approvedCashAdvances = [] } = useQuery({
    queryKey: ["approved-cash-advances", selectedDeductionSellerId],
    queryFn: () => fetchApprovedCashAdvances(selectedDeductionSellerId),
    enabled: Boolean(selectedDeductionSellerId && deductReleaseId),
  })

  const invalidateCommissionQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["commissions"] })
    queryClient.invalidateQueries({ queryKey: ["commission-summary"] })
    queryClient.invalidateQueries({ queryKey: ["commission-details"] })
    queryClient.invalidateQueries({ queryKey: ["cash-advances"] })
    queryClient.invalidateQueries({ queryKey: ["cash-advances-summary"] })
  }

  const updateMutation = useMutation({
    mutationFn: updateCommission,
    onSuccess: () => {
      invalidateCommissionQueries()
      setEditCommission(null)
      setEditData(defaultCommissionEditData)
      setSuccessMessage("Commission updated successfully")
    },
  })

  const addMissingOverrideMutation = useMutation({
    mutationFn: addMissingOverrideCommission,
    onSuccess: () => {
      invalidateCommissionQueries()
      setMissingOverrideMain(null)
      setMissingOverrideData(defaultMissingOverrideData)
      setSuccessMessage("Missing override commission added successfully")
    },
  })

  const generateMutation = useMutation({
    mutationFn: generateMilestones,
    onSuccess: () => {
      invalidateCommissionQueries()
      setSuccessMessage("Release milestones generated successfully")
    },
  })

  const markReleaseMutation = useMutation({
    mutationFn: markReleaseStage,
    onSuccess: () => {
      invalidateCommissionQueries()
      setSuccessMessage("Release marked as released")
    },
  })

  const holdReleaseMutation = useMutation({
    mutationFn: holdRelease,
    onSuccess: () => {
      invalidateCommissionQueries()
      setSuccessMessage("Release placed on hold")
    },
  })

  const unholdReleaseMutation = useMutation({
    mutationFn: unholdRelease,
    onSuccess: () => {
      invalidateCommissionQueries()
      setSuccessMessage("Release removed from hold")
    },
  })

  const cancelReleaseMutation = useMutation({
    mutationFn: cancelRelease,
    onSuccess: () => {
      invalidateCommissionQueries()
      setCancelReleaseId(null)
      setSuccessMessage("Release cancelled")
    },
  })

  const restoreCancelledReleaseMutation = useMutation({
    mutationFn: restoreCancelledRelease,
    onSuccess: () => {
      invalidateCommissionQueries()
      setSuccessMessage("Cancelled release restored")
    },
  })

  const deductMutation = useMutation({
    mutationFn: deductCashAdvance,
    onSuccess: () => {
      invalidateCommissionQueries()
      setDeductReleaseId(null)
      setDeductData(defaultDeductAdvanceData)
      setSuccessMessage("Cash advance deducted successfully")
    },
  })

  const commissionGroups = commissions.reduce<
    Record<string, { main: Commission | null; override: Commission | null }>
  >((groups, commission) => {
    const key = getCommissionGroupKey(commission)

    if (!groups[key]) {
      groups[key] = {
        main: null,
        override: null,
      }
    }

    if (commission.source_type === "override") {
      groups[key].override = commission
    } else {
      groups[key].main = commission
    }

    return groups
  }, {})

  const groupedCommissions = Object.values(commissionGroups)
    .map((group) => {
      if (!group.main && group.override) {
        return {
          main: group.override,
          override: null,
          isOrphanOverride: true,
        }
      }

      return {
        main: group.main,
        override: group.override,
        isOrphanOverride: false,
      }
    })
    .filter((group): group is {
      main: Commission
      override: Commission | null
      isOrphanOverride: boolean
    } => Boolean(group.main))

  const filteredGroups = groupedCommissions.filter(({ main, override }) => {
    const searchText = [
      main.seller_name,
      main.client_name,
      main.unit_id,
      main.project_name,
      main.seller_role,
      override?.seller_name,
      override?.seller_role,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()

    const matchesSearch = searchText.includes(search.toLowerCase().trim())
    const matchesStatus =
      statusFilter === "all" ||
      main.status === statusFilter ||
      override?.status === statusFilter

    const matchesSource =
      sourceFilter === "all" ||
      main.source_type === sourceFilter ||
      override?.source_type === sourceFilter

    const matchesSaleType =
      saleTypeFilter === "all" ||
      main.sale_type === saleTypeFilter ||
      override?.sale_type === saleTypeFilter

    return matchesSearch && matchesStatus && matchesSource && matchesSaleType
  })

  const paginatedGroups = paginateRows(filteredGroups, page, rowsPerPage)

  const openEditModal = (commission: Commission, providedOverride?: Commission) => {
    const overrideCommission =
      providedOverride ||
      (commission.source_type === "main"
        ? commissions.find(
            (item) =>
              item.source_type === "override" &&
              Number(item.parent_commission_id || 0) === Number(commission.id) &&
              item.status !== "cancelled"
          )
        : undefined)

    setEditCommission(commission)
    setEditData(commissionToEditData(commission, overrideCommission))
    setSuccessMessage("")
  }

  const openMissingOverrideModal = (commission: Commission) => {
    setMissingOverrideMain(commission)
    setMissingOverrideData(defaultMissingOverrideData)
    setSuccessMessage("")
  }

  const handleUpdateCommission = () => {
    if (!editCommission) return

    updateMutation.mutate({
      id: editCommission.id,
      commissionData: editData,
    })
  }

  const handleAddMissingOverride = () => {
    if (!missingOverrideMain) return

    addMissingOverrideMutation.mutate({
      mainCommissionId: missingOverrideMain.id,
      data: missingOverrideData,
    })
  }

  const handleDeduct = () => {
    if (!deductReleaseId) return

    deductMutation.mutate({
      releaseId: deductReleaseId,
      deductData,
    })
  }

  const openDetailsModal = (commission: Commission) => {
    setSelectedCommissionId(commission.id)
    setSuccessMessage("")
  }

  const selectedEditSeller = sellers.find(
    (seller) => Number(seller.id) === Number(editData.seller_id)
  )

  const selectedOverrideSeller = sellers.find(
    (seller) => Number(seller.id) === Number(editData.override_seller_id)
  )

  const selectedMissingOverrideSeller = sellers.find(
    (seller) => Number(seller.id) === Number(missingOverrideData.seller_id)
  )

  if (isLoading) {
    return <LoadingState label="Loading commissions..." />
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="error" title="Failed to load commissions" />
      </div>
    )
  }

  return (
    <div className="p-6">
      <PageHeader
        icon={<FiDollarSign />}
        title="Commissions"
        subtitle="Track main commissions, optional override commissions, release milestones, and cash advance deductions"
      />

      {successMessage ? <Alert variant="success" title={successMessage} /> : null}

      {updateMutation.error ? (
        <Alert variant="error" title={updateMutation.error.message} />
      ) : null}

      {addMissingOverrideMutation.error ? (
        <Alert variant="error" title={addMissingOverrideMutation.error.message} />
      ) : null}

      {generateMutation.error ? (
        <Alert variant="error" title={generateMutation.error.message} />
      ) : null}

      {markReleaseMutation.error ? (
        <Alert variant="error" title={markReleaseMutation.error.message} />
      ) : null}

      {holdReleaseMutation.error ? (
        <Alert variant="error" title={holdReleaseMutation.error.message} />
      ) : null}

      {unholdReleaseMutation.error ? (
        <Alert variant="error" title={unholdReleaseMutation.error.message} />
      ) : null}

      {restoreCancelledReleaseMutation.error ? (
        <Alert variant="error" title={restoreCancelledReleaseMutation.error.message} />
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<FiDollarSign />}
          title="Total Commission"
          value={formatMoney(summary?.total_amount || 0)}
        />
        <StatCard
          icon={<FiPlay />}
          title="Eligible"
          value={formatMoney(summary?.total_eligible || 0)}
        />
        <StatCard
          icon={<FiDollarSign />}
          title="Released"
          value={formatMoney(summary?.total_released || 0)}
        />
        <StatCard
          icon={<FiPause />}
          title="Net Remaining"
          value={formatMoney(summary?.total_remaining || 0)}
        />
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-4 md:grid-cols-4">
          <Input
            icon={<FiSearch />}
            label="Search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="Search seller, client, unit, project"
          />

          <Select
            label="Status"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(1)
            }}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="partially_released">Partially Released</option>
            <option value="released">Released</option>
            <option value="on_hold">On Hold</option>
            <option value="cancelled">Cancelled</option>
          </Select>

          <Select
            label="Source"
            value={sourceFilter}
            onChange={(e) => {
              setSourceFilter(e.target.value)
              setPage(1)
            }}
          >
            <option value="all">All Sources</option>
            <option value="main">Main</option>
            <option value="override">Override</option>
          </Select>

          <Select
            label="Sale Type"
            value={saleTypeFilter}
            onChange={(e) => {
              setSaleTypeFilter(e.target.value)
              setPage(1)
            }}
          >
            <option value="all">All Sale Types</option>
            <option value="distributed">Distributed</option>
            <option value="direct">Direct</option>
          </Select>
        </div>
      </div>

      <div className="mt-6">
        {filteredGroups.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <EmptyState title="No commissions found" />
          </div>
        ) : (
          <>
            <TableContainer>
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr className="border-b border-slate-200">
                    <th className="px-4 py-3 text-left">Client / Unit</th>
                    <th className="px-4 py-3 text-left">Main Commission</th>
                    <th className="px-4 py-3 text-left">
                      Agent / Optional Override Commission
                    </th>
                    <th className="px-4 py-3 text-left">TCP / Paid</th>
                    <th className="px-4 py-3 text-left">Release Progress</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedGroups.map(({ main, override, isOrphanOverride }) => {
                    const canAddMissingOverride =
                      main.source_type === "main" &&
                      main.sale_type === "distributed" &&
                      !hasOverrideForMain(main, commissions)

                    return (
                      <tr key={main.id} className="border-b border-slate-100 align-top">
                        <td className="px-4 py-3">
                          <p className="font-bold text-slate-900">
                            {main.client_name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {main.unit_id} · {main.project_name}
                          </p>
                          {isOrphanOverride ? (
                            <p className="mt-1 rounded bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">
                              Orphan override row
                            </p>
                          ) : null}
                        </td>

                        <td className="px-4 py-3">
                          <p className="font-bold text-slate-900">
                            {main.seller_name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {formatText(main.seller_role)} ·{" "}
                            {formatNumber(main.rate)}%
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Gross: {formatMoney(main.gross_commission)}
                          </p>
                          <p className="text-xs text-slate-500">
                            Source: {formatText(main.source_type)}
                          </p>
                        </td>

                        <td className="px-4 py-3">
                          {override ? (
                            <div>
                              <p className="font-bold text-slate-900">
                                {override.seller_name}
                              </p>
                              <p className="text-xs text-slate-500">
                                {formatText(override.seller_role)} ·{" "}
                                {formatNumber(override.rate)}%
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                Gross: {formatMoney(override.gross_commission)}
                              </p>
                              <StatusBadge status={override.status} />
                            </div>
                          ) : (
                            <div>
                              <p className="text-sm text-slate-500">
                                No override commission
                              </p>
                              {canAddMissingOverride ? (
                                <Button
                                  className="mt-2"
                                  onClick={() => openMissingOverrideModal(main)}
                                  variant="secondary"
                                >
                                  Add Missing Override
                                </Button>
                              ) : null}
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-900">
                            {formatMoney(main.total_contract_price)}
                          </p>
                          <p className="text-xs text-slate-500">
                            Paid: {formatMoney(main.total_paid)}
                          </p>
                          <p className="text-xs text-slate-500">
                            {formatNumber(main.payment_percentage)}%
                          </p>
                        </td>

                        <td className="px-4 py-3">
                          <p className="text-xs text-slate-500">
                            Released: {formatMoney(main.released_amount)}
                          </p>
                          <p className="text-xs text-slate-500">
                            Net Remaining: {formatMoney(main.remaining_amount)}
                          </p>
                          <p className="text-xs text-slate-500">
                            Cash Advance:{" "}
                            {formatMoney(main.cash_advance_deduction)}
                          </p>
                        </td>

                        <td className="px-4 py-3">
                          <StatusBadge status={main.status} />
                          <p className="mt-2 text-xs text-slate-500">
                            {formatText(main.sale_type)}
                          </p>
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-2">
                            <Button
                              icon={<FiEye />}
                              onClick={() => openDetailsModal(main)}
                            >
                              Details
                            </Button>

                            <Button
                              icon={<FiEdit2 />}
                              onClick={() => openEditModal(main, override || undefined)}
                            >
                              Edit Main
                            </Button>


                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </TableContainer>

            <Pagination
              page={page}
              rowsPerPage={rowsPerPage}
              totalRows={filteredGroups.length}
              onPageChange={setPage}
              onRowsPerPageChange={setRowsPerPage}
            />
          </>
        )}
      </div>

      {editCommission ? (
        <Modal
          title={`Edit Commission - ${editCommission.seller_name}`}
          onClose={() => {
            setEditCommission(null)
            setEditData(defaultCommissionEditData)
          }}
          size="xl"
          footer={
            <div className="flex justify-end gap-2">
              <Button
                onClick={() => {
                  setEditCommission(null)
                  setEditData(defaultCommissionEditData)
                }}
              >
                Cancel
              </Button>
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
          <div className="space-y-5">
            {hasReleasedMilestone(editCommission) ? (
              <Alert
                variant="warning"
                title="Seller and rate cannot be changed after a release has been paid. You can still add a missing override from the main table if the override was forgotten."
              />
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <Select
                label="Seller"
                value={editData.seller_id}
                disabled={hasReleasedMilestone(editCommission)}
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
                step="0.01"
                value={editData.rate}
                disabled={hasReleasedMilestone(editCommission)}
                onChange={(e) =>
                  setEditData({
                    ...editData,
                    rate: e.target.value,
                  })
                }
              />

              <Select
                label="Commission Role"
                value={editData.commission_role}
                onChange={(e) =>
                  setEditData({
                    ...editData,
                    commission_role: e.target.value,
                  })
                }
              >
                <option value="agent">Agent</option>
                <option value="manager">Manager</option>
                <option value="broker">Broker</option>
              </Select>

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
                <option value="override">Override</option>
              </Select>

              <Select
                label="Distributed / Direct"
                value={editData.sale_type}
                onChange={(e) => {
                  const saleType = e.target.value as "distributed" | "direct"

                  setEditData({
                    ...editData,
                    sale_type: saleType,
                    override_seller_id:
                      saleType === "direct" ? "" : editData.override_seller_id,
                    override_rate:
                      saleType === "direct" ? "" : editData.override_rate,
                    override_notes_for_child:
                      saleType === "direct"
                        ? ""
                        : editData.override_notes_for_child,
                  })
                }}
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
                <option value="on_hold">On Hold</option>
                <option value="cancelled">Cancelled</option>
              </Select>
            </div>

            {selectedEditSeller ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-bold text-slate-900">
                  Selected Seller
                </h3>
                <div className="mt-3 grid gap-4 md:grid-cols-3">
                  <ComputedBox label="Seller" value={selectedEditSeller.full_name} />
                  <ComputedBox
                    label="Role"
                    value={formatText(selectedEditSeller.seller_role)}
                  />
                  <ComputedBox
                    label="Default Rate"
                    value={
                      selectedEditSeller.commission_rate
                        ? `${formatNumber(selectedEditSeller.commission_rate)}%`
                        : "-"
                    }
                  />
                </div>
              </div>
            ) : null}

            {editData.source_type === "main" &&
            editData.sale_type === "distributed" ? (
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                <h3 className="text-sm font-bold text-slate-900">
                  Agent / Optional Override Commission
                </h3>

                <p className="mt-1 text-xs text-slate-600">
                  Use this if the main commission should have a linked optional
                  override commission. If the main commission already has paid
                  releases and the override was forgotten, use Add Missing
                  Override from the table instead.
                </p>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <Select
                    label="Override Seller"
                    value={editData.override_seller_id}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        override_seller_id: e.target.value
                          ? Number(e.target.value)
                          : "",
                      })
                    }
                  >
                    <option value="">No override seller</option>
                    {sellers
                      .filter((seller) => Number(seller.id) !== Number(editData.seller_id))
                      .map((seller) => (
                        <option key={seller.id} value={seller.id}>
                          {seller.full_name} - {formatText(seller.seller_role)}
                        </option>
                      ))}
                  </Select>

                  <Input
                    label="Override Rate (%)"
                    type="number"
                    min={0}
                    step="0.01"
                    value={editData.override_rate}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        override_rate: e.target.value,
                      })
                    }
                  />

                  <label className="block md:col-span-2">
                    <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Override Notes
                    </span>
                    <textarea
                      className="min-h-24 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      value={editData.override_notes_for_child}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          override_notes_for_child: e.target.value,
                        })
                      }
                    />
                  </label>
                </div>

                {selectedOverrideSeller ? (
                  <div className="mt-4 rounded-lg border border-blue-100 bg-white p-3">
                    <p className="text-xs font-semibold uppercase text-slate-400">
                      Selected Override Seller
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-900">
                      {selectedOverrideSeller.full_name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatText(selectedOverrideSeller.seller_role)}
                    </p>
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
              <h3 className="text-sm font-bold text-slate-900">
                Cash Kaliwaan / Notes
              </h3>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
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

                <label className="block md:col-span-2">
                  <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Cash Kaliwaan Notes
                  </span>
                  <textarea
                    className="min-h-20 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    value={editData.cash_kaliwaan_notes}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        cash_kaliwaan_notes: e.target.value,
                      })
                    }
                  />
                </label>

                <label className="block md:col-span-2">
                  <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Notes
                  </span>
                  <textarea
                    className="min-h-20 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    value={editData.notes}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        notes: e.target.value,
                      })
                    }
                  />
                </label>
              </div>
            </div>
          </div>
        </Modal>
      ) : null}

      {missingOverrideMain ? (
        <Modal
          title={`Add Missing Override - ${missingOverrideMain.client_name}`}
          onClose={() => {
            setMissingOverrideMain(null)
            setMissingOverrideData(defaultMissingOverrideData)
          }}
          size="lg"
          footer={
            <div className="flex justify-end gap-2">
              <Button
                onClick={() => {
                  setMissingOverrideMain(null)
                  setMissingOverrideData(defaultMissingOverrideData)
                }}
              >
                Cancel
              </Button>
              <Button
                disabled={
                  addMissingOverrideMutation.isPending ||
                  !missingOverrideData.seller_id ||
                  missingOverrideData.rate === ""
                }
                onClick={handleAddMissingOverride}
                variant="primary"
              >
                {addMissingOverrideMutation.isPending
                  ? "Saving..."
                  : "Add Missing Override"}
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <Alert
              variant="info"
              title="This creates a new child override commission. It does not edit the paid main commission or delete existing releases."
            />

            <div className="grid gap-4 md:grid-cols-2">
              <ComputedBox
                label="Main Seller"
                value={missingOverrideMain.seller_name}
              />
              <ComputedBox
                label="Main Gross Commission"
                value={formatMoney(missingOverrideMain.gross_commission)}
              />
              <ComputedBox
                label="Commission Base"
                value={formatMoney(missingOverrideMain.commission_base)}
              />
              <ComputedBox
                label="Client / Unit"
                value={`${missingOverrideMain.client_name} - ${missingOverrideMain.unit_id}`}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Select
                label="Override Seller"
                value={missingOverrideData.seller_id}
                onChange={(e) =>
                  setMissingOverrideData({
                    ...missingOverrideData,
                    seller_id: e.target.value ? Number(e.target.value) : "",
                  })
                }
              >
                <option value="">Select override seller</option>
                {sellers
                  .filter((seller) => Number(seller.id) !== Number(missingOverrideMain.seller_id))
                  .map((seller) => (
                    <option key={seller.id} value={seller.id}>
                      {seller.full_name} - {formatText(seller.seller_role)}
                    </option>
                  ))}
              </Select>

              <Input
                label="Override Rate (%)"
                type="number"
                min={0}
                step="0.01"
                value={missingOverrideData.rate}
                onChange={(e) =>
                  setMissingOverrideData({
                    ...missingOverrideData,
                    rate: e.target.value,
                  })
                }
              />

              <Input
                label="Cash Kaliwaan Amount"
                type="number"
                min={0}
                step="0.01"
                value={missingOverrideData.cash_kaliwaan_amount}
                onChange={(e) =>
                  setMissingOverrideData({
                    ...missingOverrideData,
                    cash_kaliwaan_amount: e.target.value,
                  })
                }
              />

              <Input
                label="Cash Kaliwaan Date"
                type="date"
                value={missingOverrideData.cash_kaliwaan_date}
                onChange={(e) =>
                  setMissingOverrideData({
                    ...missingOverrideData,
                    cash_kaliwaan_date: e.target.value,
                  })
                }
              />

              <label className="block md:col-span-2">
                <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Override Notes
                </span>
                <textarea
                  className="min-h-24 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  value={missingOverrideData.override_notes}
                  onChange={(e) =>
                    setMissingOverrideData({
                      ...missingOverrideData,
                      override_notes: e.target.value,
                    })
                  }
                  placeholder="Reason this override was added later"
                />
              </label>

              <label className="block md:col-span-2">
                <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Cash Kaliwaan Notes
                </span>
                <textarea
                  className="min-h-20 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  value={missingOverrideData.cash_kaliwaan_notes}
                  onChange={(e) =>
                    setMissingOverrideData({
                      ...missingOverrideData,
                      cash_kaliwaan_notes: e.target.value,
                    })
                  }
                />
              </label>

              <label className="block md:col-span-2">
                <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Notes
                </span>
                <textarea
                  className="min-h-20 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  value={missingOverrideData.notes}
                  onChange={(e) =>
                    setMissingOverrideData({
                      ...missingOverrideData,
                      notes: e.target.value,
                    })
                  }
                />
              </label>
            </div>

            {selectedMissingOverrideSeller ? (
              <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
                <p className="text-xs font-semibold uppercase text-slate-400">
                  Selected Override Seller
                </p>
                <p className="mt-1 text-sm font-bold text-slate-900">
                  {selectedMissingOverrideSeller.full_name}
                </p>
                <p className="text-xs text-slate-500">
                  {formatText(selectedMissingOverrideSeller.seller_role)}
                </p>
              </div>
            ) : null}
          </div>
        </Modal>
      ) : null}

      {selectedCommissionId ? (
        <Modal
          title="Commission Details"
          onClose={() => setSelectedCommissionId(null)}
          size="xl"
          footer={
            <div className="flex justify-end">
              <Button onClick={() => setSelectedCommissionId(null)}>
                Close
              </Button>
            </div>
          }
        >
          {isDetailsLoading ? <LoadingState label="Loading details..." /> : null}

          {detailsError ? (
            <Alert variant="error" title="Failed to load commission details" />
          ) : null}

          {commissionDetails ? (
            <div className="space-y-6">
              <DetailsSection title="Commission Information">
                <Detail label="Seller" value={commissionDetails.seller_name} />
                <Detail
                  label="Role"
                  value={formatText(commissionDetails.seller_role)}
                />
                <Detail
                  label="Source"
                  value={formatText(commissionDetails.source_type)}
                />
                <Detail
                  label="Sale Type"
                  value={formatText(commissionDetails.sale_type)}
                />
                <Detail
                  label="Commission Base"
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
                  label="Released"
                  value={formatMoney(commissionDetails.released_amount)}
                />
                <Detail
                  label="Net Remaining"
                  value={formatMoney(commissionDetails.remaining_amount)}
                />
                <Detail
                  label="Cash Advance Deduction"
                  value={formatMoney(commissionDetails.cash_advance_deduction)}
                />
              </DetailsSection>

              <DetailsSection title="Property / Payment">
                <Detail label="Client" value={commissionDetails.client_name} />
                <Detail label="Unit" value={commissionDetails.unit_id} />
                <Detail label="Project" value={commissionDetails.project_name} />
                <Detail
                  label="TCP"
                  value={formatMoney(commissionDetails.total_contract_price)}
                />
                <Detail
                  label="Paid"
                  value={formatMoney(commissionDetails.total_paid)}
                />
                <Detail
                  label="Payment %"
                  value={`${formatNumber(commissionDetails.payment_percentage)}%`}
                />
              </DetailsSection>

              <section>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-base font-bold text-slate-900">
                    Release Milestones
                  </h3>
                </div>

                <TableContainer>
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr className="border-b border-slate-200">
                        <th className="px-4 py-3 text-left">Stage</th>
                        <th className="px-4 py-3 text-left">Trigger</th>
                        <th className="px-4 py-3 text-left">Release %</th>
                        <th className="px-4 py-3 text-left">Gross</th>
                        <th className="px-4 py-3 text-left">Deduction</th>
                        <th className="px-4 py-3 text-left">Net</th>
                        <th className="px-4 py-3 text-left">Status</th>
                        <th className="px-4 py-3 text-left">Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {(commissionDetails.releases || []).map((release) => (
                        <tr key={release.id} className="border-b border-slate-100">
                          <td className="px-4 py-3 font-semibold text-slate-900">
                            {getReleaseStageLabel(release.release_stage)}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {release.trigger_payment_percent === null
                              ? "-"
                              : `${formatNumber(release.trigger_payment_percent)}%`}
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
                          <td className="px-4 py-3 font-semibold text-slate-900">
                            {formatMoney(release.net_release_amount)}
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={release.status} />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-2">
                              {release.status === "eligible" ? (
                                <Button
                                  disabled={markReleaseMutation.isPending}
                                  onClick={() => markReleaseMutation.mutate(release.id)}
                                  variant="primary"
                                >
                                  Release
                                </Button>
                              ) : null}

                              {["pending", "eligible"].includes(release.status) ? (
                                <>
                                  <Button
                                    disabled={holdReleaseMutation.isPending}
                                    onClick={() => holdReleaseMutation.mutate(release.id)}
                                  >
                                    Hold
                                  </Button>
                                  <Button
                                    disabled={deductMutation.isPending}
                                    onClick={() => {
                                      setDeductReleaseId(release.id)
                                      setDeductData(defaultDeductAdvanceData)
                                    }}
                                  >
                                    Deduct
                                  </Button>
                                  <Button
                                    disabled={cancelReleaseMutation.isPending}
                                    onClick={() => setCancelReleaseId(release.id)}
                                    variant="danger"
                                  >
                                    Cancel
                                  </Button>
                                </>
                              ) : null}

                              {release.status === "on_hold" ? (
                                <Button
                                  disabled={unholdReleaseMutation.isPending}
                                  onClick={() => unholdReleaseMutation.mutate(release.id)}
                                >
                                  Unhold
                                </Button>
                              ) : null}

                              {release.status === "cancelled" ? (
                                <Button
                                  disabled={restoreCancelledReleaseMutation.isPending}
                                  onClick={() => restoreCancelledReleaseMutation.mutate(release.id)}
                                >
                                  Restore
                                </Button>
                              ) : null}
                            </div>
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
              </section>

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

      {cancelReleaseId ? (
        <Modal
          title="Cancel Release"
          onClose={() => setCancelReleaseId(null)}
        >
          {cancelReleaseMutation.error ? (
            <Alert variant="error" title={cancelReleaseMutation.error.message} />
          ) : null}
          <ConfirmBox
            title="Cancel commission release"
            message={
              <span>
                Are you sure you want to cancel this release
                {releaseForCancellation
                  ? ` (${getReleaseStageLabel(releaseForCancellation.release_stage)} - ${formatMoney(releaseForCancellation.net_release_amount)})`
                  : ""}
                ? You can restore a cancelled release later if this was a mistake.
              </span>
            }
            onCancel={() => setCancelReleaseId(null)}
            onConfirm={() => cancelReleaseMutation.mutate(cancelReleaseId)}
            confirmLabel={cancelReleaseMutation.isPending ? "Cancelling..." : "Cancel release"}
          />
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
                disabled={deductMutation.isPending || !deductData.cash_advance_id}
                onClick={handleDeduct}
                variant="primary"
              >
                {deductMutation.isPending ? "Saving..." : "Deduct"}
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            {deductMutation.error ? (
              <Alert variant="error" title={deductMutation.error.message} />
            ) : null}

            {approvedCashAdvances.length === 0 ? (
              <Alert
                variant="warning"
                title="No approved cash advance found for this seller. Approve a cash advance first before deducting."
              />
            ) : null}

            {releaseForDeduction ? (
              <Alert
                variant="info"
                title={`Release net amount available: ${formatMoney(releaseForDeduction.net_release_amount)}`}
              />
            ) : null}

            <Select
              label="Approved Cash Advance"
              value={deductData.cash_advance_id}
              onChange={(e) => {
                const selectedId = e.target.value ? Number(e.target.value) : ""
                const selectedAdvance = approvedCashAdvances.find(
                  (advance) => Number(advance.id) === Number(selectedId)
                )
                const releaseNetAmount = Number(
                  releaseForDeduction?.net_release_amount || 0
                )
                const remainingBalance = Number(
                  selectedAdvance?.remaining_balance || 0
                )
                const suggestedAmount = selectedAdvance
                  ? Math.min(remainingBalance, releaseNetAmount)
                  : 0

                setDeductData({
                  ...deductData,
                  cash_advance_id: selectedId,
                  amount: suggestedAmount > 0 ? String(suggestedAmount) : "",
                })
              }}
            >
              <option value="">Select approved cash advance</option>
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
              Select an approved cash advance. The amount is auto-filled using the lower value between the advance remaining balance and the release net amount, but you can lower it.
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