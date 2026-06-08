import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  FiEdit2,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiTrendingUp,
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
import { formatMoney, formatText } from "../utils/formatters"
import { paginateRows } from "../utils/pagination"

type CommissionStatus = "pending" | "payable" | "released" | "cancelled" | string

type CommissionRole =
  | "agent"
  | "unit_manager"
  | "broker"
  | "broker_network_manager"
  | string

type Commission = {
  id: number
  client_unit_id: number
  seller_id: number
  commission_role: CommissionRole
  seller_name: string
  seller_role: string
  reports_under: string | null
  client_name: string
  unit_id: string
  project_name: string
  net_selling_price: number | string
  legal_misc_fee: number | string
  total_contract_price: number | string
  commission_base: number | string
  rate: number | string
  amount: number | string
  released_amount: number | string
  remaining_amount: number | string
  status: CommissionStatus
  created_at: string
  updated_at: string
}

type Seller = {
  id: number
  full_name: string
  seller_role: string
  status: string
}

type ClientUnit = {
  id: number
  client_id: number
  client_name: string
  listing_id: number
  unit_id: string
  project_name: string
  seller_id: number | null
  seller_name: string | null
  seller_role: string | null
  net_selling_price: number | string
  legal_misc_fee: number | string
  total_contract_price: number | string
  status: string
}

type CommissionSummary = {
  total_commissions: number | string
  total_amount: number | string
  total_released: number | string
  total_remaining: number | string
  pending_count: number | string
  payable_count: number | string
  released_count: number | string
  cancelled_count: number | string
}

type CommissionFormData = {
  client_unit_id: number | ""
  seller_id: number | ""
  commission_role: CommissionRole
  rate: number
  released_amount: number
  status: CommissionStatus
}

type CommissionsResponse = {
  commissions: Commission[]
}

type CommissionSummaryResponse = {
  summary: CommissionSummary
}

type SellersResponse = {
  accreditedSellers?: Seller[]
  sellers?: Seller[]
}

type ClientUnitsResponse = {
  clientUnits: ClientUnit[]
}

const commissionRoles = [
  "agent",
  "unit_manager",
  "broker",
  "broker_network_manager",
]

const commissionStatuses = [
  "pending",
  "payable",
  "released",
  "cancelled",
]

const emptyFormData: CommissionFormData = {
  client_unit_id: "",
  seller_id: "",
  commission_role: "agent",
  rate: 7,
  released_amount: 0,
  status: "pending",
}

const fetchCommissions = async (): Promise<Commission[]> => {
  const res = await fetch(`${API_URL}/commissions`, {
    credentials: "include",
  })

  if (!res.ok) {
    throw new Error(await getErrorMessage(res))
  }

  const data = (await res.json()) as CommissionsResponse
  return data.commissions
}

const fetchCommissionSummary = async (): Promise<CommissionSummary> => {
  const res = await fetch(`${API_URL}/commissions-summary`, {
    credentials: "include",
  })

  if (!res.ok) {
    throw new Error(await getErrorMessage(res))
  }

  const data = (await res.json()) as CommissionSummaryResponse
  return data.summary
}

const fetchSellers = async (): Promise<Seller[]> => {
  const res = await fetch(`${API_URL}/accredited-sellers?status=active`, {
    credentials: "include",
  })

  if (!res.ok) {
    throw new Error(await getErrorMessage(res))
  }

  const data = (await res.json()) as SellersResponse
  return data.accreditedSellers || data.sellers || []
}

const fetchClientUnits = async (): Promise<ClientUnit[]> => {
  const res = await fetch(`${API_URL}/client-units`, {
    credentials: "include",
  })

  if (!res.ok) {
    throw new Error(await getErrorMessage(res))
  }

  const data = (await res.json()) as ClientUnitsResponse
  return data.clientUnits
}

const createCommission = async (commissionData: CommissionFormData) => {
  const res = await fetch(`${API_URL}/commissions`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(commissionData),
  })

  if (!res.ok) {
    throw new Error(await getErrorMessage(res))
  }

  return res.json()
}

const updateCommission = async ({
  id,
  commissionData,
}: {
  id: number
  commissionData: CommissionFormData
}) => {
  const res = await fetch(`${API_URL}/commissions/${id}`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(commissionData),
  })

  if (!res.ok) {
    throw new Error(await getErrorMessage(res))
  }

  return res.json()
}

const generateHierarchyCommissions = async (clientUnitId: number) => {
  const res = await fetch(
    `${API_URL}/client-units/${clientUnitId}/commissions/generate-hierarchy`,
    {
      method: "POST",
      credentials: "include",
    }
  )

  if (!res.ok) {
    throw new Error(await getErrorMessage(res))
  }

  return res.json()
}

const getCommissionBase = (clientUnit: ClientUnit | null | undefined) => {
  if (!clientUnit) return 0

  const totalContractPrice = Number(clientUnit.total_contract_price || 0)

  if (totalContractPrice > 0) {
    return totalContractPrice
  }

  return (
    Number(clientUnit.net_selling_price || 0) +
    Number(clientUnit.legal_misc_fee || 0)
  )
}

const computeCommissionAmount = (commissionBase: number, rate: number) => {
  return commissionBase * (Number(rate || 0) / 100)
}

const commissionToFormData = (commission: Commission): CommissionFormData => ({
  client_unit_id: commission.client_unit_id,
  seller_id: commission.seller_id,
  commission_role: commission.commission_role || "agent",
  rate: Number(commission.rate || 0),
  released_amount: Number(commission.released_amount || 0),
  status: commission.status,
})

const Commissions = () => {
  const queryClient = useQueryClient()

  const [searchInput, setSearchInput] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sellerRoleFilter, setSellerRoleFilter] = useState("all")
  const [commissionRoleFilter, setCommissionRoleFilter] = useState("all")

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editCommission, setEditCommission] = useState<Commission | null>(null)

  const [formData, setFormData] = useState<CommissionFormData>(emptyFormData)
  const [editFormData, setEditFormData] =
    useState<CommissionFormData>(emptyFormData)

  const [generateClientUnitId, setGenerateClientUnitId] = useState<number | "">("")

  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [successMessage, setSuccessMessage] = useState("")

  const {
    data: commissions = [],
    isLoading,
    error,
  } = useQuery<Commission[]>({
    queryKey: ["commissions"],
    queryFn: fetchCommissions,
  })

  const { data: summary } = useQuery<CommissionSummary>({
    queryKey: ["commissions-summary"],
    queryFn: fetchCommissionSummary,
  })

  const { data: sellers = [] } = useQuery<Seller[]>({
    queryKey: ["accredited-sellers"],
    queryFn: fetchSellers,
  })

  const { data: clientUnits = [] } = useQuery<ClientUnit[]>({
    queryKey: ["client-units"],
    queryFn: fetchClientUnits,
  })

  const createCommissionMutation = useMutation({
    mutationFn: createCommission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commissions"] })
      queryClient.invalidateQueries({ queryKey: ["commissions-summary"] })
      setIsAddOpen(false)
      setFormData(emptyFormData)
      setSuccessMessage("Commission added successfully")
    },
  })

  const updateCommissionMutation = useMutation({
    mutationFn: updateCommission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commissions"] })
      queryClient.invalidateQueries({ queryKey: ["commissions-summary"] })
      setEditCommission(null)
      setEditFormData(emptyFormData)
      setSuccessMessage("Commission updated successfully")
    },
  })

  const generateHierarchyMutation = useMutation({
    mutationFn: generateHierarchyCommissions,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commissions"] })
      queryClient.invalidateQueries({ queryKey: ["commissions-summary"] })
      setGenerateClientUnitId("")
      setSuccessMessage("Hierarchy commissions generated successfully")
    },
  })

  const filteredCommissions = commissions.filter((commission) => {
    const search = searchInput.trim().toLowerCase()

    const matchesSearch =
      !search ||
      [
        commission.seller_name,
        commission.seller_role,
        commission.commission_role,
        commission.reports_under,
        commission.client_name,
        commission.unit_id,
        commission.project_name,
        commission.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(search)

    const matchesStatus =
      statusFilter === "all" || commission.status === statusFilter

    const matchesSellerRole =
      sellerRoleFilter === "all" ||
      commission.seller_role === sellerRoleFilter

    const matchesCommissionRole =
      commissionRoleFilter === "all" ||
      commission.commission_role === commissionRoleFilter

    return (
      matchesSearch &&
      matchesStatus &&
      matchesSellerRole &&
      matchesCommissionRole
    )
  })

  const paginatedCommissions = paginateRows(
    filteredCommissions,
    page,
    rowsPerPage
  )

  const sellerRoles = useMemo(() => {
    const roles = sellers
      .map((seller) => seller.seller_role)
      .filter(Boolean)

    return Array.from(new Set(roles))
  }, [sellers])

  const selectedAddClientUnit =
    clientUnits.find((unit) => unit.id === formData.client_unit_id) || null

  const selectedEditClientUnit =
    clientUnits.find((unit) => unit.id === editFormData.client_unit_id) || null

  const selectedGenerateClientUnit =
    clientUnits.find((unit) => unit.id === generateClientUnitId) || null

  const addCommissionBase = getCommissionBase(selectedAddClientUnit)
  const editCommissionBase = getCommissionBase(selectedEditClientUnit)

  const addComputedAmount = computeCommissionAmount(
    addCommissionBase,
    formData.rate
  )

  const editComputedAmount = computeCommissionAmount(
    editCommissionBase,
    editFormData.rate
  )

  const openAddModal = () => {
    setFormData(emptyFormData)
    setSuccessMessage("")
    setIsAddOpen(true)
  }

  const openEditModal = (commission: Commission) => {
    setEditCommission(commission)
    setEditFormData(commissionToFormData(commission))
    setSuccessMessage("")
  }

  const resetFilters = () => {
    setSearchInput("")
    setStatusFilter("all")
    setSellerRoleFilter("all")
    setCommissionRoleFilter("all")
    setPage(1)
  }

  const handleAddCommission = (e: { preventDefault: () => void }) => {
    e.preventDefault()
    createCommissionMutation.mutate(formData)
  }

  const handleUpdateCommission = (e: { preventDefault: () => void }) => {
    e.preventDefault()

    if (!editCommission) return

    updateCommissionMutation.mutate({
      id: editCommission.id,
      commissionData: editFormData,
    })
  }

  const handleGenerateHierarchy = () => {
    if (!generateClientUnitId) return
    generateHierarchyMutation.mutate(generateClientUnitId)
  }

  const mutationError =
    createCommissionMutation.error?.message ||
    updateCommissionMutation.error?.message ||
    generateHierarchyMutation.error?.message

  if (isLoading) {
    return <LoadingState label="Loading commissions..." />
  }

  if (error) {
    return <Alert variant="error" title="Failed to load commissions" />
  }

  return (
    <div>
      <PageHeader
        icon={<FiTrendingUp />}
        title="Commissions"
        subtitle="Track commission base, seller role, commission role, released amount, and remaining balance."
        actions={
          <Button icon={<FiPlus />} onClick={openAddModal} variant="primary">
            Add Commission
          </Button>
        }
      />

      {successMessage ? <Alert variant="success" title={successMessage} /> : null}
      {mutationError ? <Alert variant="error" title={mutationError} /> : null}

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard
          label="Total Commission"
          value={formatMoney(summary?.total_amount || 0)}
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
          label="Payable"
          value={summary?.payable_count || 0}
        />
      </div>

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-bold text-slate-900">
          Generate From Client Unit Seller
        </h2>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
          <Select
            value={generateClientUnitId}
            onChange={(e) =>
              setGenerateClientUnitId(
                e.target.value ? Number(e.target.value) : ""
              )
            }
          >
            <option value="">Select client unit</option>
            {clientUnits.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.client_name} - {unit.unit_id} - {unit.project_name}
                {unit.seller_name ? ` - ${unit.seller_name}` : ""}
              </option>
            ))}
          </Select>

          <Button
            icon={<FiRefreshCw />}
            disabled={!generateClientUnitId || generateHierarchyMutation.isPending}
            onClick={handleGenerateHierarchy}
            variant="primary"
          >
            {generateHierarchyMutation.isPending
              ? "Generating..."
              : "Generate"}
          </Button>
        </div>

        {selectedGenerateClientUnit ? (
          <p className="mt-2 text-sm text-slate-500">
            Commission base:{" "}
            <span className="font-semibold text-slate-900">
              {formatMoney(getCommissionBase(selectedGenerateClientUnit))}
            </span>
            {selectedGenerateClientUnit.seller_name
              ? ` | Seller: ${selectedGenerateClientUnit.seller_name}`
              : " | No seller assigned"}
          </p>
        ) : null}
      </div>

      <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_150px_180px_210px_auto]">
          <Input
            icon={<FiSearch />}
            placeholder="Search seller, role, client, unit, project..."
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
            <option value="all">All Status</option>
            {commissionStatuses.map((status) => (
              <option key={status} value={status}>
                {formatText(status)}
              </option>
            ))}
          </Select>

          <Select
            value={sellerRoleFilter}
            onChange={(e) => {
              setSellerRoleFilter(e.target.value)
              setPage(1)
            }}
          >
            <option value="all">All Seller Roles</option>
            {sellerRoles.map((role) => (
              <option key={role} value={role}>
                {formatText(role)}
              </option>
            ))}
          </Select>

          <Select
            value={commissionRoleFilter}
            onChange={(e) => {
              setCommissionRoleFilter(e.target.value)
              setPage(1)
            }}
          >
            <option value="all">All Commission Roles</option>
            {commissionRoles.map((role) => (
              <option key={role} value={role}>
                {formatText(role)}
              </option>
            ))}
          </Select>

          <Button onClick={resetFilters}>Reset</Button>
        </div>
      </div>

      <TableContainer>
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr className="border-b border-slate-200">
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Client / Unit</th>
              <th className="px-4 py-3 text-left">Seller</th>
              <th className="px-4 py-3 text-left">Reports Under</th>
              <th className="px-4 py-3 text-left">Commission Role</th>
              <th className="px-4 py-3 text-left">TCP</th>
              <th className="px-4 py-3 text-left">Base</th>
              <th className="px-4 py-3 text-left">Rate</th>
              <th className="px-4 py-3 text-left">Amount</th>
              <th className="px-4 py-3 text-left">Released</th>
              <th className="px-4 py-3 text-left">Remaining</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {paginatedCommissions.map((commission) => (
              <tr key={commission.id} className="border-b border-slate-100">
                <td className="px-4 py-3">
                  <StatusBadge status={commission.status} />
                </td>

                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-900">
                    {commission.client_name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {commission.unit_id} - {commission.project_name}
                  </p>
                </td>

                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-900">
                    {commission.seller_name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatText(commission.seller_role)}
                  </p>
                </td>

                <td className="px-4 py-3 text-slate-600">
                  {commission.reports_under || "-"}
                </td>

                <td className="px-4 py-3 text-slate-600">
                  {formatText(commission.commission_role)}
                </td>

                <td className="px-4 py-3 text-slate-600">
                  {formatMoney(commission.total_contract_price)}
                </td>

                <td className="px-4 py-3 text-slate-600">
                  {formatMoney(commission.commission_base)}
                </td>

                <td className="px-4 py-3 text-slate-600">
                  {commission.rate}%
                </td>

                <td className="px-4 py-3 font-semibold text-slate-900">
                  {formatMoney(commission.amount)}
                </td>

                <td className="px-4 py-3 text-slate-600">
                  {formatMoney(commission.released_amount)}
                </td>

                <td className="px-4 py-3 font-semibold text-slate-900">
                  {formatMoney(commission.remaining_amount)}
                </td>

                <td className="px-4 py-3">
                  <Button
                    icon={<FiEdit2 />}
                    onClick={() => openEditModal(commission)}
                  >
                    Edit
                  </Button>
                </td>
              </tr>
            ))}

            {paginatedCommissions.length === 0 ? (
              <tr>
                <td colSpan={12}>
                  <EmptyState
                    title="No commissions found"
                    description="Add a commission or generate one from a client unit seller."
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
        totalRows={filteredCommissions.length}
        onPageChange={setPage}
        onRowsPerPageChange={setRowsPerPage}
      />

      {isAddOpen ? (
        <Modal title="Add Commission" onClose={() => setIsAddOpen(false)} size="lg">
          <CommissionForm
            formData={formData}
            setFormData={setFormData}
            clientUnits={clientUnits}
            sellers={sellers}
            commissionBase={addCommissionBase}
            computedAmount={addComputedAmount}
            onSubmit={handleAddCommission}
            onCancel={() => setIsAddOpen(false)}
            isPending={createCommissionMutation.isPending}
            submitLabel="Add Commission"
            error={createCommissionMutation.error?.message}
          />
        </Modal>
      ) : null}

      {editCommission ? (
        <Modal
          title="Edit Commission"
          onClose={() => setEditCommission(null)}
          size="lg"
        >
          <CommissionForm
            formData={editFormData}
            setFormData={setEditFormData}
            clientUnits={clientUnits}
            sellers={sellers}
            commissionBase={editCommissionBase}
            computedAmount={editComputedAmount}
            onSubmit={handleUpdateCommission}
            onCancel={() => setEditCommission(null)}
            isPending={updateCommissionMutation.isPending}
            submitLabel="Save Changes"
            error={updateCommissionMutation.error?.message}
          />
        </Modal>
      ) : null}
    </div>
  )
}

type CommissionFormProps = {
  formData: CommissionFormData
  setFormData: (formData: CommissionFormData) => void
  clientUnits: ClientUnit[]
  sellers: Seller[]
  commissionBase: number
  computedAmount: number
  onSubmit: (e: { preventDefault: () => void }) => void
  onCancel: () => void
  isPending: boolean
  submitLabel: string
  error?: string
}

const CommissionForm = ({
  formData,
  setFormData,
  clientUnits,
  sellers,
  commissionBase,
  computedAmount,
  onSubmit,
  onCancel,
  isPending,
  submitLabel,
  error,
}: CommissionFormProps) => {
  const selectedClientUnit =
    clientUnits.find((unit) => unit.id === formData.client_unit_id) || null

  const setClientUnit = (clientUnitId: number | "") => {
    const unit = clientUnits.find((clientUnit) => clientUnit.id === clientUnitId)

    setFormData({
      ...formData,
      client_unit_id: clientUnitId,
      seller_id: unit?.seller_id || formData.seller_id || "",
    })
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Select
          label="Client Unit"
          value={formData.client_unit_id}
          onChange={(e) =>
            setClientUnit(e.target.value ? Number(e.target.value) : "")
          }
          required
        >
          <option value="">Select client unit</option>
          {clientUnits.map((unit) => (
            <option key={unit.id} value={unit.id}>
              {unit.client_name} - {unit.unit_id} - {unit.project_name}
            </option>
          ))}
        </Select>

        <Select
          label="Seller"
          value={formData.seller_id}
          onChange={(e) =>
            setFormData({
              ...formData,
              seller_id: e.target.value ? Number(e.target.value) : "",
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

        <Select
          label="Commission Role"
          value={formData.commission_role}
          onChange={(e) =>
            setFormData({
              ...formData,
              commission_role: e.target.value,
            })
          }
        >
          {commissionRoles.map((role) => (
            <option key={role} value={role}>
              {formatText(role)}
            </option>
          ))}
        </Select>

        <Input
          label="Rate %"
          type="number"
          min={0}
          step="0.01"
          value={formData.rate}
          onChange={(e) =>
            setFormData({
              ...formData,
              rate: Number(e.target.value),
            })
          }
          required
        />

        <Input
          label="Released Amount"
          type="number"
          min={0}
          step="0.01"
          value={formData.released_amount}
          onChange={(e) =>
            setFormData({
              ...formData,
              released_amount: Number(e.target.value),
            })
          }
        />

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
          {commissionStatuses.map((status) => (
            <option key={status} value={status}>
              {formatText(status)}
            </option>
          ))}
        </Select>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <h3 className="mb-3 font-semibold text-slate-900">
          Commission Computation
        </h3>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <ComputedBox label="Commission Base" value={formatMoney(commissionBase)} />
          <ComputedBox label="Rate" value={`${formData.rate || 0}%`} />
          <ComputedBox label="Amount" value={formatMoney(computedAmount)} />
        </div>

        {selectedClientUnit ? (
          <p className="mt-3 text-sm text-slate-500">
            Base uses Total Contract Price. If TCP is missing, it falls back to
            Net Selling Price + Legal/Misc Fee.
          </p>
        ) : null}
      </div>

      {error ? <Alert title={error} variant="error" /> : null}

      <div className="flex justify-end gap-2">
        <Button onClick={onCancel}>Cancel</Button>
        <Button disabled={isPending} type="submit" variant="primary">
          {isPending ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  )
}

const ComputedBox = ({
  label,
  value,
}: {
  label: string
  value: string
}) => {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <p className="text-xs font-semibold uppercase text-slate-400">{label}</p>
      <p className="mt-1 font-semibold text-slate-900">{value}</p>
    </div>
  )
}

export default Commissions