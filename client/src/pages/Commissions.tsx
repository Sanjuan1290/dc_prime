import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1"

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
  payableCount: number
  releasedCount: number
  cancelledCount: number
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
  lot_type: string | null
  lot_area_sqm: number | string
  net_selling_price: number | string
  paid_amount: number | string
  balance: number | string
  due_day: number | null
  status: string
  assigned_user_id: number | null
  assigned_user_name: string | null
  document_status: string
  created_at: string
  updated_at: string
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

const Commissions = () => {
  const queryClient = useQueryClient()

  const [searchInput, setSearchInput] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sellerRoleFilter, setSellerRoleFilter] = useState("all")

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editCommission, setEditCommission] = useState<Commission | null>(null)
  const [formData, setFormData] = useState<CommissionFormData>(emptyFormData)

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
    },
  })

  const updateCommissionMutation = useMutation({
    mutationFn: updateCommission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commissions"] })
      queryClient.invalidateQueries({ queryKey: ["commissions-summary"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] })
      setEditCommission(null)
    },
  })

  const formatMoney = (amount: number | string) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(Number(amount || 0))
  }

  const formatText = (value: string | null | undefined) => {
    if (!value) return "-"

    return value
      .replaceAll("_", " ")
      .split(" ")
      .map((word) => word[0]?.toUpperCase() + word.slice(1))
      .join(" ")
  }

  const getFormClientUnitId = () => {
    return formData.client_unit_id || clientUnits[0]?.id || 0
  }

  const getFormSellerId = () => {
    return formData.seller_id || sellers[0]?.id || 0
  }

  const resetForm = () => {
    setFormData({
      ...emptyFormData,
      client_unit_id: clientUnits[0]?.id || 0,
      seller_id: sellers[0]?.id || 0,
    })
  }

  const openAddModal = () => {
    setFormData({
      ...emptyFormData,
      client_unit_id: clientUnits[0]?.id || 0,
      seller_id: sellers[0]?.id || 0,
    })
    setIsAddOpen(true)
  }

  const openEditModal = (commission: Commission) => {
    setEditCommission(commission)
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
      sellerRoleFilter === "all" ||
      commission.seller_role === sellerRoleFilter

    return matchesSearch && matchesStatus && matchesSellerRole
  })

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
      .reduce(
        (sum, commission) => sum + Number(commission.remaining_amount || 0),
        0
      )

  if (isLoading) {
    return <p className="p-4">Loading commissions...</p>
  }

  if (error) {
    return <p className="p-4">Failed to load commissions</p>
  }

  return (
    <div className="p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Commissions</h1>
        <p className="text-sm text-gray-600">
          Track seller commission payable, released, and remaining balances
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="border border-black px-4 py-3">
          <p className="text-sm">Commission Payable</p>
          <h3 className="text-2xl font-bold">
            {formatMoney(commissionPayable)}
          </h3>
          <p className="text-sm text-gray-600">Total commission amount</p>
        </div>

        <div className="border border-black px-4 py-3">
          <p className="text-sm">Commission Released</p>
          <h3 className="text-2xl font-bold">
            {formatMoney(commissionReleased)}
          </h3>
          <p className="text-sm text-gray-600">Total released commission</p>
        </div>

        <div className="border border-black px-4 py-3">
          <p className="text-sm">Commission Remaining</p>
          <h3 className="text-2xl font-bold">
            {formatMoney(commissionRemaining)}
          </h3>
          <p className="text-sm text-gray-600">
            Unreleased commission balance
          </p>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <button
          onClick={openAddModal}
          className="w-fit border border-black px-4 py-2 hover:bg-gray-200"
        >
          Add Commission
        </button>

        <div className="flex flex-col gap-2 md:flex-row">
          <input
            type="text"
            placeholder="Search seller, client, unit, project, status..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="border border-black px-3 py-2 md:w-96"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-black px-3 py-2"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="payable">Payable</option>
            <option value="released">Released</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={sellerRoleFilter}
            onChange={(e) => setSellerRoleFilter(e.target.value)}
            className="border border-black px-3 py-2"
          >
            <option value="all">All Roles</option>
            {sellerRoles.map((role) => (
              <option key={role} value={role}>
                {formatText(role)}
              </option>
            ))}
          </select>

          <button
            onClick={() => {
              setSearchInput("")
              setStatusFilter("all")
              setSellerRoleFilter("all")
            }}
            className="border border-black px-4 py-2 hover:bg-gray-200"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border border-black text-sm">
          <thead>
            <tr className="border-b border-black">
              <th className="border-r border-black px-4 py-2 text-left">
                Seller ↕
              </th>
              <th className="border-r border-black px-4 py-2 text-left">
                Role ↕
              </th>
              <th className="border-r border-black px-4 py-2 text-left">
                Client ↕
              </th>
              <th className="border-r border-black px-4 py-2 text-left">
                Unit ↕
              </th>
              <th className="border-r border-black px-4 py-2 text-left">
                Project ↕
              </th>
              <th className="border-r border-black px-4 py-2 text-left">
                TCP ↕
              </th>
              <th className="border-r border-black px-4 py-2 text-left">
                Rate ↕
              </th>
              <th className="border-r border-black px-4 py-2 text-left">
                Commission ↕
              </th>
              <th className="border-r border-black px-4 py-2 text-left">
                Released ↕
              </th>
              <th className="border-r border-black px-4 py-2 text-left">
                Remaining ↕
              </th>
              <th className="border-r border-black px-4 py-2 text-left">
                Status ↕
              </th>
              <th className="px-4 py-2 text-left">Actions ↕</th>
            </tr>
          </thead>

          <tbody>
            {filteredCommissions.map((commission) => (
              <tr key={commission.id} className="border-b border-black">
                <td className="border-r border-black px-4 py-2">
                  {commission.seller_name}
                </td>

                <td className="border-r border-black px-4 py-2">
                  {formatText(commission.seller_role)}
                </td>

                <td className="border-r border-black px-4 py-2">
                  {commission.client_name}
                </td>

                <td className="border-r border-black px-4 py-2">
                  {commission.unit_id}
                </td>

                <td className="border-r border-black px-4 py-2">
                  {commission.project_name}
                </td>

                <td className="border-r border-black px-4 py-2">
                  {formatMoney(commission.net_selling_price)}
                </td>

                <td className="border-r border-black px-4 py-2">
                  {Number(commission.rate || 0)}%
                </td>

                <td className="border-r border-black px-4 py-2">
                  {formatMoney(commission.amount)}
                </td>

                <td className="border-r border-black px-4 py-2">
                  {formatMoney(commission.released_amount)}
                </td>

                <td className="border-r border-black px-4 py-2">
                  {formatMoney(commission.remaining_amount)}
                </td>

                <td className="border-r border-black px-4 py-2 capitalize">
                  {formatText(commission.status)}
                </td>

                <td className="px-4 py-2">
                  <button
                    onClick={() => openEditModal(commission)}
                    className="border border-black px-3 py-1 hover:bg-gray-200"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}

            {filteredCommissions.length === 0 && (
              <tr>
                <td colSpan={12} className="px-4 py-6 text-center text-gray-600">
                  No commissions found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isAddOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg border border-black bg-white p-4">
            <h2 className="mb-4 text-2xl font-bold">Add Commission</h2>

            <form onSubmit={handleAddCommission} className="flex flex-col gap-3">
              <select
                value={getFormClientUnitId()}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    client_unit_id: Number(e.target.value),
                  })
                }
                className="border border-black px-3 py-2"
                required
              >
                {clientUnits.length === 0 && (
                  <option value={0}>No client units available</option>
                )}

                {clientUnits.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.client_name} - {unit.unit_id}
                  </option>
                ))}
              </select>

              <select
                value={getFormSellerId()}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    seller_id: Number(e.target.value),
                  })
                }
                className="border border-black px-3 py-2"
                required
              >
                {sellers.length === 0 && (
                  <option value={0}>No active sellers available</option>
                )}

                {sellers.map((seller) => (
                  <option key={seller.id} value={seller.id}>
                    {seller.full_name} - {formatText(seller.seller_role)}
                  </option>
                ))}
              </select>

              <input
                type="number"
                min={0}
                step="0.01"
                placeholder="Rate %"
                value={formData.rate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    rate: Number(e.target.value),
                  })
                }
                className="border border-black px-3 py-2"
                required
              />

              <input
                type="number"
                min={0}
                step="0.01"
                placeholder="Released amount"
                value={formData.released_amount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    released_amount: Number(e.target.value),
                  })
                }
                className="border border-black px-3 py-2"
              />

              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as CommissionStatus,
                  })
                }
                className="border border-black px-3 py-2"
              >
                <option value="pending">Pending</option>
                <option value="payable">Payable</option>
                <option value="released">Released</option>
                <option value="cancelled">Cancelled</option>
              </select>

              {createCommissionMutation.isError && (
                <p className="border border-black px-4 py-2 text-red-600">
                  {createCommissionMutation.error.message}
                </p>
              )}

              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    resetForm()
                    setIsAddOpen(false)
                  }}
                  className="border border-black px-4 py-2 hover:bg-gray-200"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    createCommissionMutation.isPending ||
                    clientUnits.length === 0 ||
                    sellers.length === 0
                  }
                  className="border border-black px-4 py-2 hover:bg-gray-200 disabled:opacity-50"
                >
                  {createCommissionMutation.isPending
                    ? "Saving..."
                    : "Save Commission"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editCommission && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg border border-black bg-white p-4">
            <h2 className="mb-4 text-2xl font-bold">Edit Commission</h2>

            <form
              onSubmit={handleUpdateCommission}
              className="flex flex-col gap-3"
            >
              <select
                value={editCommission.client_unit_id}
                onChange={(e) =>
                  setEditCommission({
                    ...editCommission,
                    client_unit_id: Number(e.target.value),
                  })
                }
                className="border border-black px-3 py-2"
                required
              >
                {clientUnits.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.client_name} - {unit.unit_id}
                  </option>
                ))}
              </select>

              <select
                value={editCommission.seller_id}
                onChange={(e) =>
                  setEditCommission({
                    ...editCommission,
                    seller_id: Number(e.target.value),
                  })
                }
                className="border border-black px-3 py-2"
                required
              >
                {sellers.map((seller) => (
                  <option key={seller.id} value={seller.id}>
                    {seller.full_name} - {formatText(seller.seller_role)}
                  </option>
                ))}
              </select>

              <input
                type="number"
                min={0}
                step="0.01"
                value={Number(editCommission.rate || 0)}
                onChange={(e) =>
                  setEditCommission({
                    ...editCommission,
                    rate: Number(e.target.value),
                  })
                }
                className="border border-black px-3 py-2"
                required
              />

              <input
                type="number"
                min={0}
                step="0.01"
                value={Number(editCommission.released_amount || 0)}
                onChange={(e) =>
                  setEditCommission({
                    ...editCommission,
                    released_amount: Number(e.target.value),
                  })
                }
                className="border border-black px-3 py-2"
              />

              <select
                value={editCommission.status}
                onChange={(e) =>
                  setEditCommission({
                    ...editCommission,
                    status: e.target.value as CommissionStatus,
                  })
                }
                className="border border-black px-3 py-2"
              >
                <option value="pending">Pending</option>
                <option value="payable">Payable</option>
                <option value="released">Released</option>
                <option value="cancelled">Cancelled</option>
              </select>

              {updateCommissionMutation.isError && (
                <p className="border border-black px-4 py-2 text-red-600">
                  {updateCommissionMutation.error.message}
                </p>
              )}

              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditCommission(null)}
                  className="border border-black px-4 py-2 hover:bg-gray-200"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={updateCommissionMutation.isPending}
                  className="border border-black px-4 py-2 hover:bg-gray-200 disabled:opacity-50"
                >
                  {updateCommissionMutation.isPending
                    ? "Saving..."
                    : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Commissions