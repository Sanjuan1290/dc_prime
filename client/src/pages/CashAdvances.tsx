import { useMemo, useState, type ReactNode } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  FiCheckCircle,
  FiDollarSign,
  FiEye,
  FiPlus,
  FiSearch,
  FiXCircle,
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
import { formatDate, formatMoney, formatNumber, formatText } from "../utils/formatters"
import { paginateRows } from "../utils/pagination"
import useCurrentUser from "../utils/useCurrentUser"

type CashAdvanceStatus =
  | "pending"
  | "approved"
  | "partially_deducted"
  | "deducted"
  | "rejected"
  | "cancelled"
  | string

type Seller = {
  id: number
  full_name: string
  seller_role: string
  reports_under_display?: string | null
}

type ClientUnit = {
  id: number
  client_name: string
  unit_id: string
  project_name: string
  status?: string | null
  mode_of_payment?: string | null
}

type CommissionRelease = {
  id: number
  commission_id: number
  seller_id: number
  client_unit_id: number
  commission_role: string | null
  source_type: string | null
  sale_type: string | null
  release_stage: string
  trigger_payment_percent: number | string | null
  release_percent: number | string
  gross_release_amount: number | string
  cash_advance_deduction: number | string
  net_release_amount: number | string
  status: string
  client_name: string
  unit_id: string
  project_name: string
}

type CashAdvance = {
  id: number
  seller_id: number
  seller_name: string
  seller_role: string
  reports_under: string | null
  client_unit_id: number | null
  client_name: string | null
  unit_id: string | null
  project_name: string | null
  commission_id: number | null
  commission_source_type: string | null
  commission_role: string | null
  sale_type?: string | null
  gross_commission: number | string | null
  amount: number | string
  remaining_balance: number | string
  deducted_amount: number | string
  status: CashAdvanceStatus
  requested_at: string | null
  approved_at: string | null
  deducted_at?: string | null
  rejected_at?: string | null
  cancelled_at?: string | null
  approved_by: number | null
  approved_by_name: string | null
  notes: string | null
  created_at: string
  updated_at: string
  deductions?: CashAdvanceDeduction[]
}

type CashAdvanceDeduction = {
  id: number
  cash_advance_id: number
  commission_release_id: number
  amount: number | string
  notes: string | null
  created_at: string
  release_stage: string
  release_status: string
  commission_id: number
  client_unit_id: number
  seller_name: string
  client_name: string
  unit_id: string
  project_name: string
  created_by_name: string | null
}

type CashAdvanceSummary = {
  total_cash_advances: number | string
  total_amount: number | string
  total_remaining: number | string
  total_deducted: number | string
  pending_count: number | string
  approved_count: number | string
  partially_deducted_count: number | string
  deducted_count: number | string
  rejected_count: number | string
  cancelled_count: number | string
}

type SellerCommissionSummary = {
  clientUnits: ClientUnit[]
  eligibleReleases: CommissionRelease[]
  allReleases: CommissionRelease[]
  releases: CommissionRelease[]
  totals: {
    total_gross: number | string
    total_eligible: number | string
    total_deducted: number | string
    total_available: number | string
  }
}

type CashAdvanceFormData = {
  seller_id: number | ""
  client_unit_id: number | ""
  commission_id: number | ""
  selected_release_id: number | ""
  amount: string
  notes: string
}

type CashAdvancesResponse = { cashAdvances?: CashAdvance[]; data?: CashAdvance[] }
type CashAdvanceResponse = { cashAdvance?: CashAdvance; data?: CashAdvance }
type CashAdvanceSummaryResponse = { summary?: CashAdvanceSummary; data?: CashAdvanceSummary }
type SellersResponse = { accreditedSellers?: Seller[]; sellers?: Seller[]; data?: Seller[] }
type SellerCommissionSummaryResponse = SellerCommissionSummary & { data?: SellerCommissionSummary }

const defaultCashAdvanceFormData: CashAdvanceFormData = {
  seller_id: "",
  client_unit_id: "",
  commission_id: "",
  selected_release_id: "",
  amount: "",
  notes: "",
}

const cashAdvanceStatuses = [
  "pending",
  "approved",
  "partially_deducted",
  "deducted",
  "rejected",
  "cancelled",
]

const fetchCashAdvances = async (): Promise<CashAdvance[]> => {
  const res = await fetch(`${API_URL}/cash-advances`, { credentials: "include" })
  if (!res.ok) throw new Error(await getErrorMessage(res))
  const data = (await res.json()) as CashAdvancesResponse
  return data.cashAdvances || data.data || []
}

const fetchCashAdvanceSummary = async (): Promise<CashAdvanceSummary> => {
  const res = await fetch(`${API_URL}/cash-advances-summary`, { credentials: "include" })
  if (!res.ok) throw new Error(await getErrorMessage(res))
  const data = (await res.json()) as CashAdvanceSummaryResponse

  return data.summary || data.data || {
    total_cash_advances: 0,
    total_amount: 0,
    total_remaining: 0,
    total_deducted: 0,
    pending_count: 0,
    approved_count: 0,
    partially_deducted_count: 0,
    deducted_count: 0,
    rejected_count: 0,
    cancelled_count: 0,
  }
}

const fetchCashAdvanceDetails = async (id: number) => {
  const res = await fetch(`${API_URL}/cash-advances/${id}`, { credentials: "include" })
  if (!res.ok) throw new Error(await getErrorMessage(res))
  const data = (await res.json()) as CashAdvanceResponse
  return data.cashAdvance || data.data
}

const fetchSellers = async (): Promise<Seller[]> => {
  const res = await fetch(`${API_URL}/accredited-sellers?status=active`, { credentials: "include" })
  if (!res.ok) throw new Error(await getErrorMessage(res))
  const data = (await res.json()) as SellersResponse
  return data.accreditedSellers || data.sellers || data.data || []
}

const fetchSellerCommissionSummary = async (
  sellerId: number,
  clientUnitId?: number | "",
  commissionId?: number | ""
): Promise<SellerCommissionSummary> => {
  const params = new URLSearchParams()
  if (clientUnitId) params.set("client_unit_id", String(clientUnitId))
  if (commissionId) params.set("commission_id", String(commissionId))

  const queryString = params.toString()
  const res = await fetch(
    `${API_URL}/accredited-sellers/${sellerId}/commission-summary${queryString ? `?${queryString}` : ""}`,
    { credentials: "include" }
  )

  if (!res.ok) throw new Error(await getErrorMessage(res))

  const data = (await res.json()) as SellerCommissionSummaryResponse
  const normalized = data.data || data

  return {
    clientUnits: normalized.clientUnits || [],
    eligibleReleases: normalized.eligibleReleases || [],
    allReleases: normalized.allReleases || normalized.releases || [],
    releases: normalized.releases || normalized.allReleases || [],
    totals: normalized.totals || {
      total_gross: 0,
      total_eligible: 0,
      total_deducted: 0,
      total_available: 0,
    },
  }
}

const formatCashAdvancePayload = (formData: CashAdvanceFormData) => ({
  seller_id: formData.seller_id || null,
  client_unit_id: formData.client_unit_id || null,
  commission_id: formData.commission_id || null,
  amount: formData.amount === "" ? 0 : Number(formData.amount),
  notes: formData.notes || null,
})

const createCashAdvance = async (formData: CashAdvanceFormData) => {
  const res = await fetch(`${API_URL}/cash-advances`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formatCashAdvancePayload(formData)),
  })
  if (!res.ok) throw new Error(await getErrorMessage(res))
  return res.json()
}

const updateCashAdvance = async ({ id, formData }: { id: number; formData: CashAdvanceFormData }) => {
  const res = await fetch(`${API_URL}/cash-advances/${id}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formatCashAdvancePayload(formData)),
  })
  if (!res.ok) throw new Error(await getErrorMessage(res))
  return res.json()
}

const approveCashAdvance = async (id: number) => {
  const res = await fetch(`${API_URL}/cash-advances/${id}/approve`, {
    method: "PATCH",
    credentials: "include",
  })
  if (!res.ok) throw new Error(await getErrorMessage(res))
  return res.json()
}

const deductCashAdvance = async (id: number) => {
  const res = await fetch(`${API_URL}/cash-advances/${id}/deduct`, {
    method: "PATCH",
    credentials: "include",
  })
  if (!res.ok) throw new Error(await getErrorMessage(res))
  return res.json()
}

const rejectCashAdvance = async (id: number) => {
  const res = await fetch(`${API_URL}/cash-advances/${id}/reject`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  })
  if (!res.ok) throw new Error(await getErrorMessage(res))
  return res.json()
}

const cancelCashAdvance = async (id: number) => {
  const res = await fetch(`${API_URL}/cash-advances/${id}/cancel`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  })
  if (!res.ok) throw new Error(await getErrorMessage(res))
  return res.json()
}

const cashAdvanceToFormData = (cashAdvance: CashAdvance): CashAdvanceFormData => ({
  seller_id: cashAdvance.seller_id,
  client_unit_id: cashAdvance.client_unit_id || "",
  commission_id: cashAdvance.commission_id || "",
  selected_release_id: "",
  amount: String(cashAdvance.amount || ""),
  notes: cashAdvance.notes || "",
})

const getReleaseStageLabel = (stage: string) => {
  switch (stage) {
    case "1st_release":
    case "first_20":
      return "20% Release"
    case "2nd_release":
    case "second_40":
      return "40% Release"
    case "3rd_release":
    case "third_60":
      return "60% Release"
    case "4th_release":
    case "fourth_75":
      return "75% Release"
    case "retention":
    case "retention_25":
      return "Retention"
    default:
      return formatText(stage)
  }
}

const CashAdvances = () => {
  const queryClient = useQueryClient()
  const { data: currentUserData } = useCurrentUser()
  const currentUser = currentUserData?.user
  const isSuperAdmin = currentUser?.role === "super_admin"

  const [searchInput, setSearchInput] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sellerFilter, setSellerFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editCashAdvance, setEditCashAdvance] = useState<CashAdvance | null>(null)
  const [viewCashAdvanceId, setViewCashAdvanceId] = useState<number | null>(null)
  const [formData, setFormData] = useState<CashAdvanceFormData>(defaultCashAdvanceFormData)
  const [editFormData, setEditFormData] = useState<CashAdvanceFormData>(defaultCashAdvanceFormData)
  const [successMessage, setSuccessMessage] = useState("")
  const [confirmCashAdvanceAction, setConfirmCashAdvanceAction] = useState<{
    action: "approve" | "reject"
    cashAdvance: CashAdvance
  } | null>(null)

  const { data: cashAdvances = [], isLoading, error } = useQuery({
    queryKey: ["cash-advances"],
    queryFn: fetchCashAdvances,
  })

  const { data: summary } = useQuery({
    queryKey: ["cash-advances-summary"],
    queryFn: fetchCashAdvanceSummary,
  })

  const { data: sellers = [] } = useQuery({
    queryKey: ["accredited-sellers", "active"],
    queryFn: fetchSellers,
  })

  const { data: cashAdvanceDetails, isLoading: isDetailsLoading, error: detailsError } = useQuery({
    queryKey: ["cash-advance-details", viewCashAdvanceId],
    queryFn: () => fetchCashAdvanceDetails(viewCashAdvanceId || 0),
    enabled: Boolean(viewCashAdvanceId),
  })

  const invalidateCashAdvanceQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["cash-advances"] })
    queryClient.invalidateQueries({ queryKey: ["cash-advances-summary"] })
    queryClient.invalidateQueries({ queryKey: ["commissions"] })
    queryClient.invalidateQueries({ queryKey: ["seller-commission-summary"] })
    if (viewCashAdvanceId) {
      queryClient.invalidateQueries({ queryKey: ["cash-advance-details", viewCashAdvanceId] })
    }
  }

  const createMutation = useMutation({
    mutationFn: createCashAdvance,
    onSuccess: () => {
      invalidateCashAdvanceQueries()
      setIsAddOpen(false)
      setFormData(defaultCashAdvanceFormData)
      setSuccessMessage("Cash advance request created successfully")
    },
  })

  const updateMutation = useMutation({
    mutationFn: updateCashAdvance,
    onSuccess: () => {
      invalidateCashAdvanceQueries()
      setEditCashAdvance(null)
      setEditFormData(defaultCashAdvanceFormData)
      setSuccessMessage("Cash advance updated successfully")
    },
  })

  const approveMutation = useMutation({
    mutationFn: approveCashAdvance,
    onSuccess: () => {
      invalidateCashAdvanceQueries()
      setConfirmCashAdvanceAction(null)
      setSuccessMessage("Cash advance approved successfully")
    },
  })

  const deductMutation = useMutation({
    mutationFn: deductCashAdvance,
    onSuccess: () => {
      invalidateCashAdvanceQueries()
      setSuccessMessage("Cash advance deducted from eligible commission releases")
    },
  })

  const rejectMutation = useMutation({
    mutationFn: rejectCashAdvance,
    onSuccess: () => {
      invalidateCashAdvanceQueries()
      setConfirmCashAdvanceAction(null)
      setSuccessMessage("Cash advance rejected successfully")
    },
  })

  const cancelMutation = useMutation({
    mutationFn: cancelCashAdvance,
    onSuccess: () => {
      invalidateCashAdvanceQueries()
      setSuccessMessage("Cash advance cancelled successfully")
    },
  })

  const filteredCashAdvances = cashAdvances.filter((cashAdvance) => {
    const search = searchInput.toLowerCase().trim()
    const matchesSearch =
      search === "" ||
      cashAdvance.seller_name.toLowerCase().includes(search) ||
      cashAdvance.seller_role.toLowerCase().includes(search) ||
      (cashAdvance.client_name || "").toLowerCase().includes(search) ||
      (cashAdvance.unit_id || "").toLowerCase().includes(search) ||
      (cashAdvance.project_name || "").toLowerCase().includes(search) ||
      (cashAdvance.notes || "").toLowerCase().includes(search)

    const matchesStatus = statusFilter === "all" || cashAdvance.status === statusFilter
    const matchesSeller = sellerFilter === "all" || String(cashAdvance.seller_id) === sellerFilter

    return matchesSearch && matchesStatus && matchesSeller
  })

  const paginatedCashAdvances = paginateRows(filteredCashAdvances, page, rowsPerPage)

  const openAddModal = () => {
    setFormData(defaultCashAdvanceFormData)
    setSuccessMessage("")
    setIsAddOpen(true)
  }

  const openEditModal = (cashAdvance: CashAdvance) => {
    setEditCashAdvance(cashAdvance)
    setEditFormData(cashAdvanceToFormData(cashAdvance))
    setSuccessMessage("")
  }

  const mutationError =
    createMutation.error?.message ||
    updateMutation.error?.message ||
    approveMutation.error?.message ||
    deductMutation.error?.message ||
    rejectMutation.error?.message ||
    cancelMutation.error?.message

  if (isLoading) return <LoadingState label="Loading cash advances..." />
  if (error) return <Alert variant="error" title="Failed to load cash advances" />

  return (
    <div>
      <PageHeader
        icon={<FiDollarSign />}
        title="Cash Advances"
        subtitle="Create cash advance requests and let super admin approve or auto-deduct them from eligible commission releases."
        actions={<Button icon={<FiPlus />} onClick={openAddModal} variant="primary">Add Cash Advance</Button>}
      />

      {successMessage ? <Alert variant="success" title={successMessage} /> : null}
      {mutationError ? <Alert variant="error" title={mutationError} /> : null}

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4 xl:grid-cols-6">
        <StatCard label="Total Records" value={formatNumber(summary?.total_cash_advances || 0)} />
        <StatCard label="Total Amount" value={formatMoney(summary?.total_amount || 0)} />
        <StatCard label="Remaining" value={formatMoney(summary?.total_remaining || 0)} />
        <StatCard label="Deducted" value={formatMoney(summary?.total_deducted || 0)} />
        <StatCard label="Pending" value={formatNumber(summary?.pending_count || 0)} />
        <StatCard label="Approved" value={formatNumber(summary?.approved_count || 0)} />
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
        <Input
          icon={<FiSearch />}
          placeholder="Search seller, client, unit, notes..."
          value={searchInput}
          onChange={(e) => {
            setSearchInput(e.target.value)
            setPage(1)
          }}
        />

        <Select value={sellerFilter} onChange={(e) => { setSellerFilter(e.target.value); setPage(1) }}>
          <option value="all">All Sellers</option>
          {sellers.map((seller) => <option key={seller.id} value={seller.id}>{seller.full_name}</option>)}
        </Select>

        <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}>
          <option value="all">All Statuses</option>
          {cashAdvanceStatuses.map((status) => <option key={status} value={status}>{formatText(status)}</option>)}
        </Select>

        <Button onClick={() => { setSearchInput(""); setSellerFilter("all"); setStatusFilter("all"); setPage(1) }}>
          Reset
        </Button>
      </div>

      <TableContainer>
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr className="border-b border-slate-200">
              <th className="px-4 py-3 text-left">Seller</th>
              <th className="px-4 py-3 text-left">Client / Unit</th>
              <th className="px-4 py-3 text-left">Linked Commission</th>
              <th className="px-4 py-3 text-left">Amount</th>
              <th className="px-4 py-3 text-left">Deducted</th>
              <th className="px-4 py-3 text-left">Remaining</th>
              <th className="px-4 py-3 text-left">Requested</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {paginatedCashAdvances.map((cashAdvance) => {
              const canEdit = cashAdvance.status === "pending"
              const canCancel = cashAdvance.status === "pending" || (isSuperAdmin && cashAdvance.status === "approved")
              const canApproveReject = isSuperAdmin && cashAdvance.status === "pending"
              const canDeduct = isSuperAdmin && ["approved", "partially_deducted"].includes(cashAdvance.status)

              return (
                <tr key={cashAdvance.id} className="border-b border-slate-100">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900">{cashAdvance.seller_name}</p>
                    <p className="text-xs text-slate-500">{formatText(cashAdvance.seller_role)}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    <p>{cashAdvance.client_name || "-"}</p>
                    <p className="text-xs text-slate-500">{cashAdvance.unit_id || "-"} / {cashAdvance.project_name || "-"}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {cashAdvance.commission_id ? (
                      <>
                        <p>#{cashAdvance.commission_id}</p>
                        <p className="text-xs text-slate-500">{formatText(cashAdvance.commission_role || cashAdvance.commission_source_type || "commission")}</p>
                      </>
                    ) : "Unit eligible releases"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{formatMoney(cashAdvance.amount)}</td>
                  <td className="px-4 py-3 text-slate-600">{formatMoney(cashAdvance.deducted_amount)}</td>
                  <td className="px-4 py-3 text-slate-600">{formatMoney(cashAdvance.remaining_balance)}</td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(cashAdvance.created_at || cashAdvance.requested_at)}</td>
                  <td className="px-4 py-3"><StatusBadge status={cashAdvance.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button icon={<FiEye />} onClick={() => setViewCashAdvanceId(cashAdvance.id)}>View More</Button>
                      {canEdit ? <Button onClick={() => openEditModal(cashAdvance)}>Edit</Button> : null}
                      {canApproveReject ? (
                        <>
                          <Button
                            icon={<FiCheckCircle />}
                            disabled={approveMutation.isPending}
                            onClick={() =>
                              setConfirmCashAdvanceAction({
                                action: "approve",
                                cashAdvance,
                              })
                            }
                            variant="primary"
                          >
                            Approve
                          </Button>
                          <Button
                            icon={<FiXCircle />}
                            disabled={rejectMutation.isPending}
                            onClick={() =>
                              setConfirmCashAdvanceAction({
                                action: "reject",
                                cashAdvance,
                              })
                            }
                            variant="danger"
                          >
                            Reject
                          </Button>
                        </>
                      ) : null}
                      {canDeduct ? (
                        <Button disabled={deductMutation.isPending} onClick={() => deductMutation.mutate(cashAdvance.id)} variant="primary">
                          Deduct Automatically
                        </Button>
                      ) : null}
                      {canCancel ? <Button disabled={cancelMutation.isPending} onClick={() => cancelMutation.mutate(cashAdvance.id)}>Cancel</Button> : null}
                    </div>
                  </td>
                </tr>
              )
            })}

            {paginatedCashAdvances.length === 0 ? (
              <tr><td colSpan={9}><EmptyState title="No cash advances found" description="Create a pending cash advance from a seller's eligible release milestones." /></td></tr>
            ) : null}
          </tbody>
        </table>
      </TableContainer>

      <Pagination page={page} rowsPerPage={rowsPerPage} totalRows={filteredCashAdvances.length} onPageChange={setPage} onRowsPerPageChange={setRowsPerPage} />

      {isAddOpen ? (
        <CashAdvanceFormModal
          title="Add Cash Advance"
          formData={formData}
          setFormData={setFormData}
          sellers={sellers}
          onClose={() => setIsAddOpen(false)}
          onSave={() => createMutation.mutate(formData)}
          isPending={createMutation.isPending}
          submitLabel="Create Pending Request"
        />
      ) : null}

      {editCashAdvance ? (
        <CashAdvanceFormModal
          title="Edit Pending Cash Advance"
          formData={editFormData}
          setFormData={setEditFormData}
          sellers={sellers}
          onClose={() => setEditCashAdvance(null)}
          onSave={() => updateMutation.mutate({ id: editCashAdvance.id, formData: editFormData })}
          isPending={updateMutation.isPending}
          submitLabel="Save Changes"
        />
      ) : null}

      {viewCashAdvanceId ? (
        <Modal title="Cash Advance Details" onClose={() => setViewCashAdvanceId(null)} size="xl" footer={<div className="flex justify-end"><Button onClick={() => setViewCashAdvanceId(null)}>Close</Button></div>}>
          {isDetailsLoading ? <LoadingState label="Loading cash advance details..." /> : null}
          {detailsError ? <Alert variant="error" title="Failed to load cash advance details" /> : null}

          {cashAdvanceDetails ? (
            <div className="space-y-6">
              <DetailsSection title="Cash Advance Info">
                <Detail label="Seller" value={cashAdvanceDetails.seller_name} />
                <Detail label="Seller Role" value={formatText(cashAdvanceDetails.seller_role)} />
                <Detail label="Client" value={cashAdvanceDetails.client_name || "-"} />
                <Detail label="Unit" value={cashAdvanceDetails.unit_id || "-"} />
                <Detail label="Project" value={cashAdvanceDetails.project_name || "-"} />
                <Detail label="Amount" value={formatMoney(cashAdvanceDetails.amount)} />
                <Detail label="Deducted" value={formatMoney(cashAdvanceDetails.deducted_amount)} />
                <Detail label="Remaining Balance" value={formatMoney(cashAdvanceDetails.remaining_balance)} />
                <Detail label="Status" value={formatText(cashAdvanceDetails.status)} />
                <Detail label="Requested At" value={formatDate(cashAdvanceDetails.created_at || cashAdvanceDetails.requested_at)} />
                <Detail label="Approved At" value={formatDate(cashAdvanceDetails.approved_at)} />
                <Detail label="Deducted At" value={formatDate(cashAdvanceDetails.deducted_at)} />
                <Detail label="Rejected At" value={formatDate(cashAdvanceDetails.rejected_at)} />
                <Detail label="Cancelled At" value={formatDate(cashAdvanceDetails.cancelled_at)} />
                <Detail label="Approved By" value={cashAdvanceDetails.approved_by_name || "-"} />
                <Detail label="Notes" value={cashAdvanceDetails.notes || "-"} />
              </DetailsSection>

              <section>
                <h3 className="mb-3 text-base font-bold text-slate-900">Deduction History</h3>
                <TableContainer>
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr className="border-b border-slate-200">
                        <th className="px-4 py-3 text-left">Release Stage</th>
                        <th className="px-4 py-3 text-left">Client</th>
                        <th className="px-4 py-3 text-left">Unit</th>
                        <th className="px-4 py-3 text-left">Amount</th>
                        <th className="px-4 py-3 text-left">Created By</th>
                        <th className="px-4 py-3 text-left">Date</th>
                        <th className="px-4 py-3 text-left">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(cashAdvanceDetails.deductions || []).map((deduction) => (
                        <tr key={deduction.id} className="border-b border-slate-100">
                          <td className="px-4 py-3 text-slate-600">{getReleaseStageLabel(deduction.release_stage)}</td>
                          <td className="px-4 py-3 text-slate-600">{deduction.client_name}</td>
                          <td className="px-4 py-3 text-slate-600">{deduction.unit_id}</td>
                          <td className="px-4 py-3 text-slate-600">{formatMoney(deduction.amount)}</td>
                          <td className="px-4 py-3 text-slate-600">{deduction.created_by_name || "-"}</td>
                          <td className="px-4 py-3 text-slate-600">{formatDate(deduction.created_at)}</td>
                          <td className="px-4 py-3 text-slate-600">{deduction.notes || "-"}</td>
                        </tr>
                      ))}
                      {(cashAdvanceDetails.deductions || []).length === 0 ? <tr><td colSpan={7}><EmptyState title="No deductions yet" /></td></tr> : null}
                    </tbody>
                  </table>
                </TableContainer>
              </section>
            </div>
          ) : null}
        </Modal>
      ) : null}

      {confirmCashAdvanceAction ? (
        <Modal
          onClose={() => setConfirmCashAdvanceAction(null)}
          title={
            confirmCashAdvanceAction.action === "approve"
              ? "Approve Cash Advance"
              : "Reject Cash Advance"
          }
        >
          <ConfirmBox
            title={
              confirmCashAdvanceAction.action === "approve"
                ? "Confirm cash advance approval"
                : "Confirm cash advance rejection"
            }
            message={`Are you sure you want to ${confirmCashAdvanceAction.action} this cash advance request for ${confirmCashAdvanceAction.cashAdvance.seller_name} worth ${formatMoney(confirmCashAdvanceAction.cashAdvance.amount)}?`}
            cancelLabel="Review"
            confirmLabel={
              confirmCashAdvanceAction.action === "approve"
                ? approveMutation.isPending
                  ? "Approving..."
                  : "Yes, approve"
                : rejectMutation.isPending
                  ? "Rejecting..."
                  : "Yes, reject"
            }
            onCancel={() => setConfirmCashAdvanceAction(null)}
            onConfirm={() => {
              if (confirmCashAdvanceAction.action === "approve") {
                approveMutation.mutate(confirmCashAdvanceAction.cashAdvance.id)
                return
              }

              rejectMutation.mutate(confirmCashAdvanceAction.cashAdvance.id)
            }}
          />
        </Modal>
      ) : null}
    </div>
  )
}

type CashAdvanceFormModalProps = {
  title: string
  formData: CashAdvanceFormData
  setFormData: (data: CashAdvanceFormData) => void
  sellers: Seller[]
  onClose: () => void
  onSave: () => void
  isPending: boolean
  submitLabel: string
}

const CashAdvanceFormModal = ({ title, formData, setFormData, sellers, onClose, onSave, isPending, submitLabel }: CashAdvanceFormModalProps) => {
  const [sellerSearch, setSellerSearch] = useState("")
  const [unitSearch, setUnitSearch] = useState("")

  const selectedSellerId = Number(formData.seller_id || 0)

  const { data: sellerSummary, isLoading: isSummaryLoading } = useQuery({
    queryKey: ["seller-commission-summary", selectedSellerId],
    queryFn: () => fetchSellerCommissionSummary(selectedSellerId),
    enabled: Boolean(selectedSellerId),
  })

  const filteredSellers = sellers.filter((seller) => {
    const search = sellerSearch.toLowerCase().trim()
    return search === "" ||
      seller.full_name.toLowerCase().includes(search) ||
      seller.seller_role.toLowerCase().includes(search) ||
      (seller.reports_under_display || "").toLowerCase().includes(search)
  })

  const clientUnits = sellerSummary?.clientUnits || []
  const filteredClientUnits = clientUnits.filter((unit) => {
    const search = unitSearch.toLowerCase().trim()
    return search === "" ||
      unit.client_name.toLowerCase().includes(search) ||
      unit.unit_id.toLowerCase().includes(search) ||
      unit.project_name.toLowerCase().includes(search)
  })

  const releasesForSelectedUnit = useMemo(() => {
    const releases = sellerSummary?.allReleases || []
    if (!formData.client_unit_id) return []
    return releases.filter((release) => Number(release.client_unit_id) === Number(formData.client_unit_id))
  }, [sellerSummary, formData.client_unit_id])

  const scopedReleases = useMemo(() => {
    if (!formData.commission_id) return releasesForSelectedUnit
    return releasesForSelectedUnit.filter((release) => Number(release.commission_id) === Number(formData.commission_id))
  }, [releasesForSelectedUnit, formData.commission_id])

  const eligibleAmount = scopedReleases
    .filter((release) => release.status === "eligible")
    .reduce((sum, release) => sum + Number(release.net_release_amount || 0), 0)

  const requestedAmount = Number(formData.amount || 0)
  const amountExceedsEligible = requestedAmount > 0 && requestedAmount > eligibleAmount
  const canSubmit = Boolean(formData.seller_id && formData.client_unit_id && requestedAmount > 0 && !amountExceedsEligible && eligibleAmount > 0)

  const selectRelease = (release: CommissionRelease) => {
    if (release.status !== "eligible") return
    setFormData({
      ...formData,
      client_unit_id: release.client_unit_id,
      commission_id: release.commission_id,
      selected_release_id: release.id,
    })
  }

  return (
    <Modal
      title={title}
      onClose={onClose}
      size="xl"
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Cancel</Button>
          <Button disabled={isPending || !canSubmit} onClick={onSave} variant="primary">
            {isPending ? "Saving..." : submitLabel}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <section className="rounded-xl border border-slate-200 p-4">
            <h3 className="mb-3 font-bold text-slate-900">1. Select Seller</h3>
            <Input icon={<FiSearch />} placeholder="Search seller name, role, reports under..." value={sellerSearch} onChange={(e) => setSellerSearch(e.target.value)} />
            <div className="mt-3 max-h-60 space-y-2 overflow-y-auto pr-1">
              {filteredSellers.map((seller) => {
                const isSelected = Number(formData.seller_id) === Number(seller.id)
                return (
                  <button
                    key={seller.id}
                    type="button"
                    onClick={() => setFormData({ ...defaultCashAdvanceFormData, seller_id: seller.id })}
                    className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${isSelected ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-blue-300"}`}
                  >
                    <p className="font-semibold text-slate-900">{seller.full_name}</p>
                    <p className="text-xs text-slate-500">{formatText(seller.seller_role)}{seller.reports_under_display ? ` • Under ${seller.reports_under_display}` : ""}</p>
                  </button>
                )
              })}
              {filteredSellers.length === 0 ? <EmptyState title="No seller found" /> : null}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 p-4">
            <h3 className="mb-3 font-bold text-slate-900">2. Linked Client Unit</h3>
            {!selectedSellerId ? <Alert variant="info" title="Select a seller first." /> : null}
            {selectedSellerId && isSummaryLoading ? <LoadingState label="Loading seller commissions..." /> : null}
            {selectedSellerId && !isSummaryLoading ? (
              <>
                <Input icon={<FiSearch />} placeholder="Search buyer, unit, project..." value={unitSearch} onChange={(e) => setUnitSearch(e.target.value)} />
                <div className="mt-3 max-h-60 space-y-2 overflow-y-auto pr-1">
                  {filteredClientUnits.map((unit) => {
                    const isSelected = Number(formData.client_unit_id) === Number(unit.id)
                    return (
                      <button
                        key={unit.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, client_unit_id: unit.id, commission_id: "", selected_release_id: "" })}
                        className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${isSelected ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-blue-300"}`}
                      >
                        <p className="font-semibold text-slate-900">{unit.client_name}</p>
                        <p className="text-xs text-slate-500">{unit.unit_id} • {unit.project_name}</p>
                      </button>
                    )
                  })}
                  {filteredClientUnits.length === 0 ? <EmptyState title="No linked unit found" description="This seller has no generated commissions yet." /> : null}
                </div>
              </>
            ) : null}
          </section>
        </div>

        <section className="rounded-xl border border-slate-200 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-slate-900">3. Linked Commission Release Milestones</h3>
              <p className="text-sm text-slate-500">Only eligible releases are clickable. Deduction later runs automatically from 20% to retention.</p>
            </div>
            {formData.commission_id ? (
              <Button onClick={() => setFormData({ ...formData, commission_id: "", selected_release_id: "" })}>Use All Eligible Releases For Unit</Button>
            ) : null}
          </div>

          {!formData.client_unit_id ? <Alert variant="info" title="Select a linked client unit to see release milestones." /> : null}

          {formData.client_unit_id ? (
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr className="border-b border-slate-200">
                    <th className="px-4 py-3 text-left">Stage</th>
                    <th className="px-4 py-3 text-left">Commission</th>
                    <th className="px-4 py-3 text-left">Gross</th>
                    <th className="px-4 py-3 text-left">Deducted</th>
                    <th className="px-4 py-3 text-left">Available</th>
                    <th className="px-4 py-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {releasesForSelectedUnit.map((release) => {
                    const eligible = release.status === "eligible" && Number(release.net_release_amount || 0) > 0
                    const selected = Number(formData.selected_release_id) === Number(release.id)
                    return (
                      <tr
                        key={release.id}
                        onClick={() => selectRelease(release)}
                        className={`border-b border-slate-100 ${eligible ? "cursor-pointer hover:bg-blue-50" : "opacity-70"} ${selected ? "bg-blue-50" : ""}`}
                      >
                        <td className="px-4 py-3 font-semibold text-slate-900">{getReleaseStageLabel(release.release_stage)}</td>
                        <td className="px-4 py-3 text-slate-600">#{release.commission_id} • {formatText(release.commission_role || release.source_type || "commission")}</td>
                        <td className="px-4 py-3 text-slate-600">{formatMoney(release.gross_release_amount)}</td>
                        <td className="px-4 py-3 text-slate-600">{formatMoney(release.cash_advance_deduction)}</td>
                        <td className="px-4 py-3 font-semibold text-slate-900">{formatMoney(release.net_release_amount)}</td>
                        <td className="px-4 py-3"><StatusBadge status={release.status} /></td>
                      </tr>
                    )
                  })}
                  {releasesForSelectedUnit.length === 0 ? <tr><td colSpan={6}><EmptyState title="No release milestones found" /></td></tr> : null}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>

        <section className="rounded-xl border border-slate-200 p-4">
          <h3 className="mb-3 font-bold text-slate-900">4. Cash Advance Amount</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Input label="Amount" type="number" min={0} step="0.01" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required />
            <ComputedBox label="Eligible Available" value={formatMoney(eligibleAmount)} />
            <ComputedBox label="Remaining After Request" value={formatMoney(Math.max(eligibleAmount - requestedAmount, 0))} />
          </div>

          {amountExceedsEligible ? (
            <Alert className="mt-4" variant="warning" title="Amount exceeds this unit's eligible commission releases." />
          ) : null}

          {formData.client_unit_id && eligibleAmount <= 0 ? (
            <Alert className="mt-4" variant="warning" title="This selected scope has no eligible release available for cash advance." />
          ) : null}

          <div className="mt-4">
            <Input label="Notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Optional" />
          </div>
        </section>
      </div>
    </Modal>
  )
}

const DetailsSection = ({ children, title }: { children: ReactNode; title: string }) => (
  <section>
    <h3 className="mb-3 text-base font-bold text-slate-900">{title}</h3>
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">{children}</div>
  </section>
)

const Detail = ({ label, value }: { label: string; value: string | number | null | undefined }) => (
  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
    <p className="mt-1 break-words text-sm font-semibold text-slate-900">{value === null || value === undefined || value === "" ? "-" : value}</p>
  </div>
)

const ComputedBox = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
    <p className="text-xs font-semibold uppercase text-slate-400">{label}</p>
    <p className="mt-1 font-semibold text-slate-900">{value}</p>
  </div>
)

export default CashAdvances
