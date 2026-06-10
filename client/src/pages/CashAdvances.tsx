import { useMemo, useState, type ReactNode } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  FiCheckCircle,
  FiDollarSign,
  FiEdit2,
  FiEye,
  FiPlus,
  FiSearch,
  FiXCircle,
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
  commission_rate?: number | string | null
  reports_under_display?: string | null
}

type ClientUnit = {
  id: number
  client_name: string
  unit_id: string
  project_name: string
  seller_id?: number | null
  seller_name?: string | null
  total_contract_price?: number | string
}

type Commission = {
  id: number
  client_unit_id: number
  seller_id: number
  seller_name: string
  source_type: string
  commission_role: string | null
  client_name: string
  unit_id: string
  project_name: string
  gross_commission: number | string
  remaining_amount: number | string
  status: string
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
  gross_commission: number | string | null
  amount: number | string
  remaining_balance: number | string
  deducted_amount: number | string
  status: CashAdvanceStatus
  requested_at: string | null
  approved_at: string | null
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

type CashAdvanceFormData = {
  seller_id: number | ""
  client_unit_id: number | ""
  commission_id: number | ""
  amount: string
  status: CashAdvanceStatus
  requested_at: string
  approved_at: string
  notes: string
}

type CashAdvancesResponse = {
  cashAdvances?: CashAdvance[]
  data?: CashAdvance[]
}

type CashAdvanceResponse = {
  cashAdvance?: CashAdvance
  data?: CashAdvance
}

type CashAdvanceSummaryResponse = {
  summary?: CashAdvanceSummary
  data?: CashAdvanceSummary
}

type SellersResponse = {
  accreditedSellers?: Seller[]
  sellers?: Seller[]
  data?: Seller[]
}

type ClientUnitsResponse = {
  clientUnits?: ClientUnit[]
  data?: ClientUnit[]
}

type CommissionsResponse = {
  commissions?: Commission[]
  data?: Commission[]
}

const defaultCashAdvanceFormData: CashAdvanceFormData = {
  seller_id: "",
  client_unit_id: "",
  commission_id: "",
  amount: "",
  status: "pending",
  requested_at: "",
  approved_at: "",
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
  const res = await fetch(`${API_URL}/cash-advances`, {
    credentials: "include",
  })

  if (!res.ok) throw new Error(await getErrorMessage(res))

  const data = (await res.json()) as CashAdvancesResponse
  return data.cashAdvances || data.data || []
}

const fetchCashAdvanceSummary = async (): Promise<CashAdvanceSummary> => {
  const res = await fetch(`${API_URL}/cash-advances-summary`, {
    credentials: "include",
  })

  if (!res.ok) throw new Error(await getErrorMessage(res))

  const data = (await res.json()) as CashAdvanceSummaryResponse

  return (
    data.summary ||
    data.data || {
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
  )
}

const fetchCashAdvanceDetails = async (id: number) => {
  const res = await fetch(`${API_URL}/cash-advances/${id}`, {
    credentials: "include",
  })

  if (!res.ok) throw new Error(await getErrorMessage(res))

  const data = (await res.json()) as CashAdvanceResponse
  return data.cashAdvance || data.data
}

const fetchSellers = async (): Promise<Seller[]> => {
  const res = await fetch(`${API_URL}/accredited-sellers?status=active`, {
    credentials: "include",
  })

  if (!res.ok) throw new Error(await getErrorMessage(res))

  const data = (await res.json()) as SellersResponse
  return data.accreditedSellers || data.sellers || data.data || []
}

const fetchClientUnits = async (): Promise<ClientUnit[]> => {
  const res = await fetch(`${API_URL}/client-units`, {
    credentials: "include",
  })

  if (!res.ok) throw new Error(await getErrorMessage(res))

  const data = (await res.json()) as ClientUnitsResponse
  return data.clientUnits || data.data || []
}

const fetchCommissions = async (): Promise<Commission[]> => {
  const res = await fetch(`${API_URL}/commissions`, {
    credentials: "include",
  })

  if (!res.ok) throw new Error(await getErrorMessage(res))

  const data = (await res.json()) as CommissionsResponse
  return data.commissions || data.data || []
}

const createCashAdvance = async (formData: CashAdvanceFormData) => {
  const res = await fetch(`${API_URL}/cash-advances`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(formatCashAdvancePayload(formData)),
  })

  if (!res.ok) throw new Error(await getErrorMessage(res))

  return res.json()
}

const updateCashAdvance = async ({
  id,
  formData,
}: {
  id: number
  formData: CashAdvanceFormData
}) => {
  const res = await fetch(`${API_URL}/cash-advances/${id}`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
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

const rejectCashAdvance = async (id: number) => {
  const res = await fetch(`${API_URL}/cash-advances/${id}/reject`, {
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

const cancelCashAdvance = async (id: number) => {
  const res = await fetch(`${API_URL}/cash-advances/${id}/cancel`, {
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

const formatCashAdvancePayload = (formData: CashAdvanceFormData) => {
  return {
    seller_id: formData.seller_id || null,
    client_unit_id: formData.client_unit_id || null,
    commission_id: formData.commission_id || null,
    amount: formData.amount === "" ? 0 : Number(formData.amount),
    status: formData.status,
    requested_at: formData.requested_at || null,
    approved_at: formData.approved_at || null,
    notes: formData.notes || null,
  }
}

const cashAdvanceToFormData = (cashAdvance: CashAdvance): CashAdvanceFormData => {
  return {
    seller_id: cashAdvance.seller_id,
    client_unit_id: cashAdvance.client_unit_id || "",
    commission_id: cashAdvance.commission_id || "",
    amount: String(cashAdvance.amount || ""),
    status: cashAdvance.status,
    requested_at: cashAdvance.requested_at
      ? cashAdvance.requested_at.slice(0, 10)
      : "",
    approved_at: cashAdvance.approved_at
      ? cashAdvance.approved_at.slice(0, 10)
      : "",
    notes: cashAdvance.notes || "",
  }
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

const CashAdvances = () => {
  const queryClient = useQueryClient()

  const [searchInput, setSearchInput] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sellerFilter, setSellerFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editCashAdvance, setEditCashAdvance] = useState<CashAdvance | null>(
    null
  )
  const [viewCashAdvanceId, setViewCashAdvanceId] = useState<number | null>(
    null
  )
  const [formData, setFormData] = useState<CashAdvanceFormData>(
    defaultCashAdvanceFormData
  )
  const [editFormData, setEditFormData] = useState<CashAdvanceFormData>(
    defaultCashAdvanceFormData
  )
  const [successMessage, setSuccessMessage] = useState("")

  const {
    data: cashAdvances = [],
    isLoading,
    error,
  } = useQuery({
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

  const { data: clientUnits = [] } = useQuery({
    queryKey: ["client-units"],
    queryFn: fetchClientUnits,
  })

  const { data: commissions = [] } = useQuery({
    queryKey: ["commissions"],
    queryFn: fetchCommissions,
  })

  const {
    data: cashAdvanceDetails,
    isLoading: isDetailsLoading,
    error: detailsError,
  } = useQuery({
    queryKey: ["cash-advance-details", viewCashAdvanceId],
    queryFn: () => fetchCashAdvanceDetails(viewCashAdvanceId || 0),
    enabled: Boolean(viewCashAdvanceId),
  })

  const invalidateCashAdvanceQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["cash-advances"] })
    queryClient.invalidateQueries({ queryKey: ["cash-advances-summary"] })
    queryClient.invalidateQueries({ queryKey: ["commissions"] })
    queryClient.invalidateQueries({ queryKey: ["commission-summary"] })

    if (viewCashAdvanceId) {
      queryClient.invalidateQueries({
        queryKey: ["cash-advance-details", viewCashAdvanceId],
      })
    }
  }

  const createMutation = useMutation({
    mutationFn: createCashAdvance,
    onSuccess: () => {
      invalidateCashAdvanceQueries()
      setIsAddOpen(false)
      setFormData(defaultCashAdvanceFormData)
      setSuccessMessage("Cash advance created successfully")
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
      setSuccessMessage("Cash advance approved successfully")
    },
  })

  const rejectMutation = useMutation({
    mutationFn: rejectCashAdvance,
    onSuccess: () => {
      invalidateCashAdvanceQueries()
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

    const matchesStatus =
      statusFilter === "all" || cashAdvance.status === statusFilter

    const matchesSeller =
      sellerFilter === "all" || String(cashAdvance.seller_id) === sellerFilter

    return matchesSearch && matchesStatus && matchesSeller
  })

  const paginatedCashAdvances = paginateRows(
    filteredCashAdvances,
    page,
    rowsPerPage
  )

  const selectedSellerCommissions = useMemo(() => {
    const sellerId = Number(formData.seller_id || editFormData.seller_id || 0)

    if (!sellerId) return commissions

    return commissions.filter(
      (commission) => Number(commission.seller_id) === sellerId
    )
  }, [commissions, formData.seller_id, editFormData.seller_id])

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

  const handleCreateCashAdvance = () => {
    createMutation.mutate(formData)
  }

  const handleUpdateCashAdvance = () => {
    if (!editCashAdvance) return

    updateMutation.mutate({
      id: editCashAdvance.id,
      formData: editFormData,
    })
  }

  const mutationError =
    createMutation.error?.message ||
    updateMutation.error?.message ||
    approveMutation.error?.message ||
    rejectMutation.error?.message ||
    cancelMutation.error?.message

  if (isLoading) {
    return <LoadingState label="Loading cash advances..." />
  }

  if (error) {
    return <Alert variant="error" title="Failed to load cash advances" />
  }

  return (
    <div>
      <PageHeader
        icon={<FiDollarSign />}
        title="Cash Advances"
        subtitle="Track seller cash advances, approvals, remaining balances, and deductions from commission releases."
        actions={
          <Button icon={<FiPlus />} onClick={openAddModal} variant="primary">
            Add Cash Advance
          </Button>
        }
      />

      {successMessage ? <Alert variant="success" title={successMessage} /> : null}
      {mutationError ? <Alert variant="error" title={mutationError} /> : null}

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4 xl:grid-cols-6">
        <StatCard
          label="Total Records"
          value={formatNumber(summary?.total_cash_advances || 0)}
        />
        <StatCard
          label="Total Amount"
          value={formatMoney(summary?.total_amount || 0)}
        />
        <StatCard
          label="Remaining"
          value={formatMoney(summary?.total_remaining || 0)}
        />
        <StatCard
          label="Deducted"
          value={formatMoney(summary?.total_deducted || 0)}
        />
        <StatCard
          label="Pending"
          value={formatNumber(summary?.pending_count || 0)}
        />
        <StatCard
          label="Approved"
          value={formatNumber(summary?.approved_count || 0)}
        />
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

        <Select
          value={sellerFilter}
          onChange={(e) => {
            setSellerFilter(e.target.value)
            setPage(1)
          }}
        >
          <option value="all">All Sellers</option>
          {sellers.map((seller) => (
            <option key={seller.id} value={seller.id}>
              {seller.full_name}
            </option>
          ))}
        </Select>

        <Select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value)
            setPage(1)
          }}
        >
          <option value="all">All Statuses</option>
          {cashAdvanceStatuses.map((status) => (
            <option key={status} value={status}>
              {formatText(status)}
            </option>
          ))}
        </Select>

        <Button
          onClick={() => {
            setSearchInput("")
            setSellerFilter("all")
            setStatusFilter("all")
            setPage(1)
          }}
        >
          Reset
        </Button>
      </div>

      <TableContainer>
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr className="border-b border-slate-200">
              <th className="px-4 py-3 text-left">Seller</th>
              <th className="px-4 py-3 text-left">Client / Unit</th>
              <th className="px-4 py-3 text-left">Commission</th>
              <th className="px-4 py-3 text-left">Amount</th>
              <th className="px-4 py-3 text-left">Deducted</th>
              <th className="px-4 py-3 text-left">Remaining</th>
              <th className="px-4 py-3 text-left">Requested</th>
              <th className="px-4 py-3 text-left">Approved</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {paginatedCashAdvances.map((cashAdvance) => (
              <tr key={cashAdvance.id} className="border-b border-slate-100">
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-900">
                    {cashAdvance.seller_name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatText(cashAdvance.seller_role)}
                  </p>
                </td>

                <td className="px-4 py-3 text-slate-600">
                  <p>{cashAdvance.client_name || "-"}</p>
                  <p className="text-xs text-slate-500">
                    {cashAdvance.unit_id || "-"} /{" "}
                    {cashAdvance.project_name || "-"}
                  </p>
                </td>

                <td className="px-4 py-3 text-slate-600">
                  {cashAdvance.commission_id ? (
                    <>
                      <p>#{cashAdvance.commission_id}</p>
                      <p className="text-xs text-slate-500">
                        {formatText(cashAdvance.commission_source_type)}
                      </p>
                    </>
                  ) : (
                    "-"
                  )}
                </td>

                <td className="px-4 py-3 text-slate-600">
                  {formatMoney(cashAdvance.amount)}
                </td>

                <td className="px-4 py-3 text-slate-600">
                  {formatMoney(cashAdvance.deducted_amount)}
                </td>

                <td className="px-4 py-3 text-slate-600">
                  {formatMoney(cashAdvance.remaining_balance)}
                </td>

                <td className="px-4 py-3 text-slate-600">
                  {formatDate(cashAdvance.requested_at)}
                </td>

                <td className="px-4 py-3 text-slate-600">
                  <p>{formatDate(cashAdvance.approved_at)}</p>
                  <p className="text-xs text-slate-500">
                    {cashAdvance.approved_by_name || "-"}
                  </p>
                </td>

                <td className="px-4 py-3">
                  <StatusBadge status={cashAdvance.status} />
                </td>

                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      icon={<FiEye />}
                      onClick={() => setViewCashAdvanceId(cashAdvance.id)}
                    >
                      Details
                    </Button>

                    <Button
                      icon={<FiEdit2 />}
                      onClick={() => openEditModal(cashAdvance)}
                    >
                      Edit
                    </Button>

                    {cashAdvance.status === "pending" ? (
                      <>
                        <Button
                          icon={<FiCheckCircle />}
                          disabled={approveMutation.isPending}
                          onClick={() => approveMutation.mutate(cashAdvance.id)}
                          variant="primary"
                        >
                          Approve
                        </Button>

                        <Button
                          icon={<FiXCircle />}
                          disabled={rejectMutation.isPending}
                          onClick={() => rejectMutation.mutate(cashAdvance.id)}
                          variant="danger"
                        >
                          Reject
                        </Button>
                      </>
                    ) : null}

                    {["pending", "approved"].includes(cashAdvance.status) ? (
                      <Button
                        disabled={cancelMutation.isPending}
                        onClick={() => cancelMutation.mutate(cashAdvance.id)}
                      >
                        Cancel
                      </Button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}

            {paginatedCashAdvances.length === 0 ? (
              <tr>
                <td colSpan={10}>
                  <EmptyState
                    title="No cash advances found"
                    description="Create a cash advance for a seller, then deduct it from eligible commission releases later."
                  />
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </TableContainer>

      <Pagination
        page={page}
        rowsPerPage={rowsPerPage}
        totalRows={filteredCashAdvances.length}
        onPageChange={setPage}
        onRowsPerPageChange={setRowsPerPage}
      />

      {isAddOpen ? (
        <CashAdvanceFormModal
          title="Add Cash Advance"
          formData={formData}
          setFormData={setFormData}
          sellers={sellers}
          clientUnits={clientUnits}
          commissions={selectedSellerCommissions}
          onClose={() => setIsAddOpen(false)}
          onSave={handleCreateCashAdvance}
          isPending={createMutation.isPending}
          submitLabel="Add Cash Advance"
        />
      ) : null}

      {editCashAdvance ? (
        <CashAdvanceFormModal
          title="Edit Cash Advance"
          formData={editFormData}
          setFormData={setEditFormData}
          sellers={sellers}
          clientUnits={clientUnits}
          commissions={selectedSellerCommissions}
          onClose={() => setEditCashAdvance(null)}
          onSave={handleUpdateCashAdvance}
          isPending={updateMutation.isPending}
          submitLabel="Save Changes"
        />
      ) : null}

      {viewCashAdvanceId ? (
        <Modal
          title="Cash Advance Details"
          onClose={() => setViewCashAdvanceId(null)}
          size="xl"
          footer={
            <div className="flex justify-end">
              <Button onClick={() => setViewCashAdvanceId(null)}>Close</Button>
            </div>
          }
        >
          {isDetailsLoading ? (
            <LoadingState label="Loading cash advance details..." />
          ) : null}

          {detailsError ? (
            <Alert variant="error" title="Failed to load cash advance details" />
          ) : null}

          {cashAdvanceDetails ? (
            <div className="space-y-6">
              <DetailsSection title="Cash Advance Info">
                <Detail label="Seller" value={cashAdvanceDetails.seller_name} />
                <Detail
                  label="Seller Role"
                  value={formatText(cashAdvanceDetails.seller_role)}
                />
                <Detail
                  label="Client"
                  value={cashAdvanceDetails.client_name || "-"}
                />
                <Detail
                  label="Unit"
                  value={cashAdvanceDetails.unit_id || "-"}
                />
                <Detail
                  label="Project"
                  value={cashAdvanceDetails.project_name || "-"}
                />
                <Detail
                  label="Amount"
                  value={formatMoney(cashAdvanceDetails.amount)}
                />
                <Detail
                  label="Deducted"
                  value={formatMoney(cashAdvanceDetails.deducted_amount)}
                />
                <Detail
                  label="Remaining Balance"
                  value={formatMoney(cashAdvanceDetails.remaining_balance)}
                />
                <Detail
                  label="Status"
                  value={formatText(cashAdvanceDetails.status)}
                />
                <Detail
                  label="Requested At"
                  value={formatDate(cashAdvanceDetails.requested_at)}
                />
                <Detail
                  label="Approved At"
                  value={formatDate(cashAdvanceDetails.approved_at)}
                />
                <Detail
                  label="Approved By"
                  value={cashAdvanceDetails.approved_by_name || "-"}
                />
                <Detail label="Notes" value={cashAdvanceDetails.notes || "-"} />
              </DetailsSection>

              <section>
                <h3 className="mb-3 text-base font-bold text-slate-900">
                  Deduction History
                </h3>

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
                        <tr
                          key={deduction.id}
                          className="border-b border-slate-100"
                        >
                          <td className="px-4 py-3 text-slate-600">
                            {getReleaseStageLabel(deduction.release_stage)}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {deduction.client_name}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {deduction.unit_id}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {formatMoney(deduction.amount)}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {deduction.created_by_name || "-"}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {formatDate(deduction.created_at)}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {deduction.notes || "-"}
                          </td>
                        </tr>
                      ))}

                      {(cashAdvanceDetails.deductions || []).length === 0 ? (
                        <tr>
                          <td colSpan={7}>
                            <EmptyState title="No deductions yet" />
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
    </div>
  )
}

type CashAdvanceFormModalProps = {
  title: string
  formData: CashAdvanceFormData
  setFormData: (data: CashAdvanceFormData) => void
  sellers: Seller[]
  clientUnits: ClientUnit[]
  commissions: Commission[]
  onClose: () => void
  onSave: () => void
  isPending: boolean
  submitLabel: string
}

const CashAdvanceFormModal = ({
  title,
  formData,
  setFormData,
  sellers,
  clientUnits,
  commissions,
  onClose,
  onSave,
  isPending,
  submitLabel,
}: CashAdvanceFormModalProps) => {
  const selectedCommission = commissions.find(
    (commission) => Number(commission.id) === Number(formData.commission_id)
  )

  return (
    <Modal
      title={title}
      onClose={onClose}
      size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Cancel</Button>
          <Button disabled={isPending} onClick={onSave} variant="primary">
            {isPending ? "Saving..." : submitLabel}
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Select
          label="Seller"
          value={formData.seller_id}
          onChange={(e) =>
            setFormData({
              ...formData,
              seller_id: e.target.value ? Number(e.target.value) : "",
              commission_id: "",
            })
          }
          required
        >
          <option value="">Select seller</option>
          {sellers.map((seller) => (
            <option key={seller.id} value={seller.id}>
              {seller.full_name} - {formatText(seller.seller_role)}
            </option>
          ))}
        </Select>

        <Input
          label="Amount"
          type="number"
          min={0}
          step="0.01"
          value={formData.amount}
          onChange={(e) =>
            setFormData({
              ...formData,
              amount: e.target.value,
            })
          }
          required
        />

        <Select
          label="Linked Client Unit"
          value={formData.client_unit_id}
          onChange={(e) =>
            setFormData({
              ...formData,
              client_unit_id: e.target.value ? Number(e.target.value) : "",
            })
          }
        >
          <option value="">No linked client unit</option>
          {clientUnits.map((unit) => (
            <option key={unit.id} value={unit.id}>
              {unit.client_name} - {unit.unit_id} - {unit.project_name}
            </option>
          ))}
        </Select>

        <Select
          label="Linked Commission"
          value={formData.commission_id}
          onChange={(e) =>
            setFormData({
              ...formData,
              commission_id: e.target.value ? Number(e.target.value) : "",
            })
          }
        >
          <option value="">No linked commission</option>
          {commissions.map((commission) => (
            <option key={commission.id} value={commission.id}>
              #{commission.id} - {commission.client_name} -{" "}
              {commission.unit_id} - {formatText(commission.source_type)}
            </option>
          ))}
        </Select>

        <Select
          label="Status"
          value={formData.status}
          onChange={(e) =>
            setFormData({
              ...formData,
              status: e.target.value,
            })
          }
        >
          {cashAdvanceStatuses.map((status) => (
            <option key={status} value={status}>
              {formatText(status)}
            </option>
          ))}
        </Select>

        <Input
          label="Requested Date"
          type="date"
          value={formData.requested_at}
          onChange={(e) =>
            setFormData({
              ...formData,
              requested_at: e.target.value,
            })
          }
        />

        <Input
          label="Approved Date"
          type="date"
          value={formData.approved_at}
          onChange={(e) =>
            setFormData({
              ...formData,
              approved_at: e.target.value,
            })
          }
        />

        <Input
          label="Notes"
          value={formData.notes}
          onChange={(e) =>
            setFormData({
              ...formData,
              notes: e.target.value,
            })
          }
          placeholder="Optional"
        />
      </div>

      {selectedCommission ? (
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <ComputedBox
            label="Commission Gross"
            value={formatMoney(selectedCommission.gross_commission)}
          />
          <ComputedBox
            label="Commission Remaining"
            value={formatMoney(selectedCommission.remaining_amount)}
          />
          <ComputedBox
            label="Commission Status"
            value={formatText(selectedCommission.status)}
          />
        </div>
      ) : null}

      <p className="mt-3 text-sm text-slate-500">
        Cash advances are separate from Cash Kaliwaan. Cash advances can later be
        deducted from eligible commission releases.
      </p>
    </Modal>
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

export default CashAdvances
