import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { FiDollarSign, FiEdit2, FiPlus, FiSearch } from "react-icons/fi"
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

type Commission = {
  id: number
  client_unit_id: number
  seller_id: number
  seller_name: string
  seller_role: string
  client_name: string
  unit_id: string
  project_name: string
  net_selling_price: number | string
  rate: number | string
  amount: number | string
  released_amount: number | string
  remaining_amount: number | string
  status: CommissionStatus
  created_at: string
  updated_at: string
}

type CommissionSummary = {
  commissionPayable: number | string
  commissionReleased: number | string
  commissionRemaining: number | string
  pendingCount: number
}

type Seller = {
  id: number
  full_name: string
  seller_role: string
}

type ClientUnit = {
  id: number
  client_name: string
  unit_id: string
}

type CommissionFormData = {
  client_unit_id: number
  seller_id: number
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
  sellers: Seller[]
}

type ClientUnitsResponse = {
  clientUnits: ClientUnit[]
}

const emptyFormData: CommissionFormData = {
  client_unit_id: 0,
  seller_id: 0,
  rate: 5,
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

  const data: CommissionsResponse = await res.json()
  return data.commissions
}

const fetchCommissionSummary = async (): Promise<CommissionSummary> => {
  const res = await fetch(`${API_URL}/commissions-summary`, {
    credentials: "include",
  })

  if (!res.ok) {
    throw new Error(await getErrorMessage(res))
  }

  const data: CommissionSummaryResponse = await res.json()
  return data.summary
}

const fetchSellers = async (): Promise<Seller[]> => {
  const res = await fetch(`${API_URL}/accredited-sellers?status=active`, {
    credentials: "include",
  })

  if (!res.ok) {
    throw new Error(await getErrorMessage(res))
  }

  const data: SellersResponse = await res.json()
  return data.sellers
}

const fetchClientUnits = async (): Promise<ClientUnit[]> => {
  const res = await fetch(`${API_URL}/client-units`, {
    credentials: "include",
  })

  if (!res.ok) {
    throw new Error(await getErrorMessage(res))
  }

  const data: ClientUnitsResponse = await res.json()
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
}

const Commissions = () => {
  const queryClient = useQueryClient()
  const [searchInput, setSearchInput] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sellerRoleFilter, setSellerRoleFilter] = useState("all")
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editCommission, setEditCommission] = useState<Commission | null>(null)
  const [formData, setFormData] = useState<CommissionFormData>(emptyFormData)
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
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] })
      setIsAddOpen(false)
      setFormData(emptyFormData)
      setSuccessMessage("Commission created successfully")
    },
  })

  const updateCommissionMutation = useMutation({
    mutationFn: updateCommission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commissions"] })
      queryClient.invalidateQueries({ queryKey: ["commissions-summary"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] })
      setEditCommission(null)
      setSuccessMessage("Commission updated successfully")
    },
  })

  const getFormClientUnitId = () => formData.client_unit_id || clientUnits[0]?.id || 0
  const getFormSellerId = () => formData.seller_id || sellers[0]?.id || 0

  const resetForm = () => {
    setFormData({
      ...emptyFormData,
      client_unit_id: clientUnits[0]?.id || 0,
      seller_id: sellers[0]?.id || 0,
    })
  }

  const openAddModal = () => {
    resetForm()
    setIsAddOpen(true)
  }

  const handleAddCommission = (e: { preventDefault: () => void }) => {
    e.preventDefault()
    createCommissionMutation.mutate({
      ...formData,
      client_unit_id: getFormClientUnitId(),
      seller_id: getFormSellerId(),
    })
  }

  const handleUpdateCommission = (e: { preventDefault: () => void }) => {
    e.preventDefault()

    if (!editCommission) return

    updateCommissionMutation.mutate({
      id: editCommission.id,
      commissionData: {
        client_unit_id: editCommission.client_unit_id,
        seller_id: editCommission.seller_id,
        rate: Number(editCommission.rate || 0),
        released_amount: Number(editCommission.released_amount || 0),
        status: editCommission.status,
      },
    })
  }

  const filteredCommissions = commissions.filter((commission) => {
    const search = searchInput.toLowerCase().trim()
    const matchesSearch =
      search === "" ||
      commission.seller_name.toLowerCase().includes(search) ||
      commission.client_name.toLowerCase().includes(search) ||
      commission.unit_id.toLowerCase().includes(search) ||
      commission.project_name.toLowerCase().includes(search) ||
      commission.status.toLowerCase().includes(search) ||
      commission.seller_role.toLowerCase().includes(search)
    const matchesStatus =
      statusFilter === "all" || commission.status === statusFilter
    const matchesSellerRole =
      sellerRoleFilter === "all" || commission.seller_role === sellerRoleFilter

    return matchesSearch && matchesStatus && matchesSellerRole
  })

  const paginatedCommissions = paginateRows(filteredCommissions, page, rowsPerPage)
  const sellerRoles = [
    ...new Set(commissions.map((commission) => commission.seller_role).filter(Boolean)),
  ]
  const commissionPayable =
    summary?.commissionPayable ??
    commissions
      .filter((commission) => commission.status !== "cancelled")
      .reduce((sum, commission) => sum + Number(commission.amount || 0), 0)
  const commissionReleased =
    summary?.commissionReleased ??
    commissions
      .filter((commission) => commission.status !== "cancelled")
      .reduce((sum, commission) => sum + Number(commission.released_amount || 0), 0)
  const commissionRemaining =
    summary?.commissionRemaining ??
    commissions
      .filter((commission) => commission.status !== "cancelled")
      .reduce((sum, commission) => sum + Number(commission.remaining_amount || 0), 0)

  const chartData = [
    { name: "Payable", amount: Number(commissionPayable || 0) },
    { name: "Released", amount: Number(commissionReleased || 0) },
    { name: "Remaining", amount: Number(commissionRemaining || 0) },
  ]

  const formFields = (
    data: CommissionFormData,
    setData: (data: CommissionFormData) => void
  ) => (
    <div className="space-y-3">
      <Select
        label="Client unit"
        onChange={(e) => setData({ ...data, client_unit_id: Number(e.target.value) })}
        required
        value={data.client_unit_id || clientUnits[0]?.id || 0}
      >
        {clientUnits.length === 0 ? <option value={0}>No client units available</option> : null}
        {clientUnits.map((unit) => (
          <option key={unit.id} value={unit.id}>
            {unit.client_name} - {unit.unit_id}
          </option>
        ))}
      </Select>
      <Select
        label="Seller"
        onChange={(e) => setData({ ...data, seller_id: Number(e.target.value) })}
        required
        value={data.seller_id || sellers[0]?.id || 0}
      >
        {sellers.length === 0 ? <option value={0}>No active sellers available</option> : null}
        {sellers.map((seller) => (
          <option key={seller.id} value={seller.id}>
            {seller.full_name} - {formatText(seller.seller_role)}
          </option>
        ))}
      </Select>
      <Input
        label="Rate %"
        min={0}
        onChange={(e) => setData({ ...data, rate: Number(e.target.value) })}
        required
        step="0.01"
        type="number"
        value={data.rate}
      />
      <Input
        label="Released amount"
        min={0}
        onChange={(e) =>
          setData({ ...data, released_amount: Number(e.target.value) })
        }
        step="0.01"
        type="number"
        value={data.released_amount}
      />
      <Select
        label="Status"
        onChange={(e) => setData({ ...data, status: e.target.value })}
        value={data.status}
      >
        <option value="pending">Pending</option>
        <option value="payable">Payable</option>
        <option value="released">Released</option>
        <option value="cancelled">Cancelled</option>
      </Select>
    </div>
  )

  return (
    <div>
      <PageHeader
        actions={
          <Button icon={<FiPlus />} onClick={openAddModal} variant="primary">
            Add Commission
          </Button>
        }
        icon={<FiDollarSign className="h-5 w-5" />}
        subtitle="Track seller commission payable, released, and remaining balances"
        title="Commissions"
      />

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard title="Commission Payable" value={formatMoney(commissionPayable)} />
        <StatCard title="Released" value={formatMoney(commissionReleased)} />
        <StatCard title="Remaining" value={formatMoney(commissionRemaining)} />
        <StatCard title="Pending" value={summary?.pendingCount ?? 0} />
      </div>

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-bold text-slate-900">
          Payable vs released vs remaining
        </h2>
        <div className="mt-4 h-72">
          <ResponsiveContainer height="100%" width="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(value) => `${Number(value) / 1000}k`} />
              <Tooltip formatter={(value) => formatMoney(value as number)} />
              <Bar dataKey="amount" fill="#2563eb" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {successMessage ? (
        <div className="mb-4">
          <Alert type="success">{successMessage}</Alert>
        </div>
      ) : null}

      <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_180px_220px_auto]">
          <Input
            onChange={(e) => {
              setSearchInput(e.target.value)
              setPage(1)
            }}
            placeholder="Search seller, client, unit, project, status..."
            value={searchInput}
          />
          <Select onChange={(e) => setStatusFilter(e.target.value)} value={statusFilter}>
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="payable">Payable</option>
            <option value="released">Released</option>
            <option value="cancelled">Cancelled</option>
          </Select>
          <Select onChange={(e) => setSellerRoleFilter(e.target.value)} value={sellerRoleFilter}>
            <option value="all">All Roles</option>
            {sellerRoles.map((role) => (
              <option key={role} value={role}>
                {formatText(role)}
              </option>
            ))}
          </Select>
          <Button
            icon={<FiSearch />}
            onClick={() => {
              setSearchInput("")
              setStatusFilter("all")
              setSellerRoleFilter("all")
              setPage(1)
            }}
          >
            Reset
          </Button>
        </div>
      </div>

      {isLoading ? <LoadingState message="Loading commissions..." /> : null}
      {error && !isLoading ? (
        <Alert type="error">Failed to load commissions</Alert>
      ) : null}

      {!isLoading && !error ? (
        filteredCommissions.length === 0 ? (
          <EmptyState title="No commissions found" />
        ) : (
          <>
            <TableContainer>
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    {["Seller", "Role", "Client", "Unit", "TCP", "Rate", "Commission", "Released", "Remaining", "Status", "Actions"].map((heading) => (
                      <th className="px-4 py-3 text-left font-semibold text-slate-600" key={heading}>
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {paginatedCommissions.map((commission) => (
                    <tr className="transition hover:bg-slate-50" key={commission.id}>
                      <td className="px-4 py-3 font-semibold text-slate-900">{commission.seller_name}</td>
                      <td className="px-4 py-3 text-slate-600">{formatText(commission.seller_role)}</td>
                      <td className="px-4 py-3 text-slate-600">{commission.client_name}</td>
                      <td className="px-4 py-3 text-slate-600">{commission.unit_id}</td>
                      <td className="px-4 py-3 text-slate-600">{formatMoney(commission.net_selling_price)}</td>
                      <td className="px-4 py-3 text-slate-600">{Number(commission.rate || 0)}%</td>
                      <td className="px-4 py-3 text-slate-600">{formatMoney(commission.amount)}</td>
                      <td className="px-4 py-3 text-slate-600">{formatMoney(commission.released_amount)}</td>
                      <td className="px-4 py-3 text-slate-600">{formatMoney(commission.remaining_amount)}</td>
                      <td className="px-4 py-3"><StatusBadge status={commission.status} /></td>
                      <td className="px-4 py-3">
                        <Button icon={<FiEdit2 />} onClick={() => setEditCommission(commission)}>
                          Edit
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableContainer>
            <Pagination
              onPageChange={setPage}
              onRowsPerPageChange={setRowsPerPage}
              page={page}
              rowsPerPage={rowsPerPage}
              totalRows={filteredCommissions.length}
            />
          </>
        )
      ) : null}

      {isAddOpen ? (
        <Modal onClose={() => setIsAddOpen(false)} title="Add Commission">
          <form className="space-y-4" onSubmit={handleAddCommission}>
            {formFields(formData, setFormData)}
            {createCommissionMutation.isError ? (
              <Alert type="error">{createCommissionMutation.error.message}</Alert>
            ) : null}
            <div className="flex justify-end gap-2">
              <Button onClick={() => setIsAddOpen(false)}>Cancel</Button>
              <Button
                disabled={createCommissionMutation.isPending || clientUnits.length === 0 || sellers.length === 0}
                type="submit"
                variant="primary"
              >
                {createCommissionMutation.isPending ? "Saving..." : "Save Commission"}
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}

      {editCommission ? (
        <Modal onClose={() => setEditCommission(null)} title="Edit Commission">
          <form className="space-y-4" onSubmit={handleUpdateCommission}>
            {formFields(
              {
                client_unit_id: editCommission.client_unit_id,
                seller_id: editCommission.seller_id,
                rate: Number(editCommission.rate || 0),
                released_amount: Number(editCommission.released_amount || 0),
                status: editCommission.status,
              },
              (nextData) =>
                setEditCommission({
                  ...editCommission,
                  ...nextData,
                })
            )}
            {updateCommissionMutation.isError ? (
              <Alert type="error">{updateCommissionMutation.error.message}</Alert>
            ) : null}
            <div className="flex justify-end gap-2">
              <Button onClick={() => setEditCommission(null)}>Cancel</Button>
              <Button disabled={updateCommissionMutation.isPending} type="submit" variant="primary">
                {updateCommissionMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}
    </div>
  )
}

export default Commissions
