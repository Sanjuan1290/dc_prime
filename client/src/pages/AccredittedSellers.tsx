import { useState, type FormEvent } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1"

type SellerStatus = "active" | "inactive" | string

type SellerRole =
  | "broker_network_manager"
  | "broker"
  | "manager"
  | "agent"
  | string

type AccreditedSeller = {
  id: number
  user_id: number | null
  linked_user_name: string | null
  full_name: string
  email: string | null
  contact_no: string | null
  seller_role: SellerRole
  parent_seller_id: number | null
  parent_seller_name: string | null
  parent_seller_role: SellerRole | null
  status: SellerStatus
  created_at: string
  updated_at: string
}

type SellerFormData = {
  user_id: number | null
  full_name: string
  email: string
  contact_no: string
  seller_role: SellerRole
  parent_seller_id: number | null
  status: SellerStatus
}

type SellersResponse = {
  sellers: AccreditedSeller[]
}

type PossibleParentSeller = {
  id: number
  full_name: string
  seller_role: SellerRole
  parent_seller_id: number | null
  status: SellerStatus
}

type PossibleParentsResponse = {
  sellers: PossibleParentSeller[]
}

const emptyFormData: SellerFormData = {
  user_id: null,
  full_name: "",
  email: "",
  contact_no: "",
  seller_role: "agent",
  parent_seller_id: null,
  status: "active",
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

const fetchSellers = async (): Promise<AccreditedSeller[]> => {
  const res = await fetch(`${API_URL}/accredited-sellers`, {
    credentials: "include",
  })

  if (!res.ok) {
    throw new Error(await getErrorMessage(res))
  }

  const data: SellersResponse = await res.json()
  return data.sellers
}

const fetchPossibleParents = async ({
  sellerRole,
  currentSellerId,
}: {
  sellerRole: SellerRole
  currentSellerId?: number
}): Promise<PossibleParentSeller[]> => {
  const params = new URLSearchParams({
    seller_role: sellerRole,
  })

  if (currentSellerId) {
    params.set("current_seller_id", String(currentSellerId))
  }

  const res = await fetch(
    `${API_URL}/accredited-sellers/possible-parents?${params.toString()}`,
    {
      credentials: "include",
    }
  )

  if (!res.ok) {
    throw new Error(await getErrorMessage(res))
  }

  const data: PossibleParentsResponse = await res.json()
  return data.sellers
}

const createSeller = async (sellerData: SellerFormData) => {
  const res = await fetch(`${API_URL}/accredited-sellers`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(sellerData),
  })

  if (!res.ok) {
    throw new Error(await getErrorMessage(res))
  }

  return res.json()
}

const updateSeller = async ({
  id,
  sellerData,
}: {
  id: number
  sellerData: SellerFormData
}) => {
  const res = await fetch(`${API_URL}/accredited-sellers/${id}`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(sellerData),
  })

  if (!res.ok) {
    throw new Error(await getErrorMessage(res))
  }

  return res.json()
}

const AccredittedSellers = () => {
  const queryClient = useQueryClient()

  const [searchInput, setSearchInput] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [roleFilter, setRoleFilter] = useState("all")

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editSeller, setEditSeller] = useState<AccreditedSeller | null>(null)
  const [formData, setFormData] = useState<SellerFormData>(emptyFormData)

  const {
    data: sellers = [],
    isLoading,
    error,
  } = useQuery<AccreditedSeller[]>({
    queryKey: ["accredited-sellers"],
    queryFn: fetchSellers,
  })

  const { data: addPossibleParents = [] } = useQuery<PossibleParentSeller[]>({
    queryKey: ["possible-parent-sellers", formData.seller_role],
    queryFn: () =>
      fetchPossibleParents({
        sellerRole: formData.seller_role,
      }),
    enabled: isAddOpen && formData.seller_role !== "broker_network_manager",
  })

  const { data: editPossibleParents = [] } = useQuery<PossibleParentSeller[]>({
    queryKey: [
      "possible-parent-sellers",
      editSeller?.seller_role,
      editSeller?.id,
    ],
    queryFn: () =>
      fetchPossibleParents({
        sellerRole: editSeller!.seller_role,
        currentSellerId: editSeller!.id,
      }),
    enabled: !!editSeller && editSeller.seller_role !== "broker_network_manager",
  })

  const createSellerMutation = useMutation({
    mutationFn: createSeller,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accredited-sellers"] })
      queryClient.invalidateQueries({ queryKey: ["commissions"] })
      setIsAddOpen(false)
      setFormData(emptyFormData)
    },
  })

  const updateSellerMutation = useMutation({
    mutationFn: updateSeller,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accredited-sellers"] })
      queryClient.invalidateQueries({ queryKey: ["commissions"] })
      setEditSeller(null)
    },
  })

  const formatRole = (role: SellerRole | null) => {
    if (!role) return "-"

    return role
      .replaceAll("_", " ")
      .split(" ")
      .map((word) => word[0]?.toUpperCase() + word.slice(1))
      .join(" ")
  }

  const formatDate = (date: string) => {
    if (!date) return "-"

    return date.slice(0, 10)
  }

  const resetFilters = () => {
    setSearchInput("")
    setStatusFilter("all")
    setRoleFilter("all")
  }

  const resetForm = () => {
    setFormData(emptyFormData)
  }

  const openAddModal = () => {
    resetForm()
    setIsAddOpen(true)
  }

  const openEditModal = (seller: AccreditedSeller) => {
    setEditSeller(seller)
  }

  const handleAddSeller = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    createSellerMutation.mutate({
      ...formData,
      parent_seller_id:
        formData.seller_role === "broker_network_manager"
          ? null
          : formData.parent_seller_id,
    })
  }

  const handleUpdateSeller = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!editSeller) return

    updateSellerMutation.mutate({
      id: editSeller.id,
      sellerData: {
        user_id: editSeller.user_id,
        full_name: editSeller.full_name,
        email: editSeller.email || "",
        contact_no: editSeller.contact_no || "",
        seller_role: editSeller.seller_role,
        parent_seller_id:
          editSeller.seller_role === "broker_network_manager"
            ? null
            : editSeller.parent_seller_id,
        status: editSeller.status,
      },
    })
  }

  const filteredSellers = sellers.filter((seller) => {
    const search = searchInput.toLowerCase().trim()

    const matchesSearch =
      search === "" ||
      seller.full_name.toLowerCase().includes(search) ||
      (seller.email || "").toLowerCase().includes(search) ||
      (seller.contact_no || "").toLowerCase().includes(search) ||
      seller.seller_role.toLowerCase().includes(search) ||
      seller.status.toLowerCase().includes(search) ||
      (seller.parent_seller_name || "").toLowerCase().includes(search)

    const matchesStatus =
      statusFilter === "all" || seller.status === statusFilter

    const matchesRole =
      roleFilter === "all" || seller.seller_role === roleFilter

    return matchesSearch && matchesStatus && matchesRole
  })

  if (isLoading) {
    return <p className="p-4">Loading accredited sellers...</p>
  }

  if (error) {
    return <p className="p-4">Failed to load accredited sellers</p>
  }

  return (
    <div className="p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Accredited Sellers</h1>
        <p className="text-sm text-gray-600">
          Seller hierarchy records from MySQL
        </p>
      </div>

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <button
          onClick={openAddModal}
          className="w-fit border border-black px-4 py-2 hover:bg-gray-200"
        >
          Add Seller
        </button>

        <div className="flex flex-col gap-2 md:flex-row">
          <input
            type="text"
            placeholder="Search status, seller, role, parent, contact, email..."
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
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="border border-black px-3 py-2"
          >
            <option value="all">All Roles</option>
            <option value="broker_network_manager">
              Broker Network Manager
            </option>
            <option value="broker">Broker</option>
            <option value="manager">Manager</option>
            <option value="agent">Agent</option>
          </select>

          <button
            onClick={resetFilters}
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
                Status ↕
              </th>
              <th className="border-r border-black px-4 py-2 text-left">
                Name of Seller ↕
              </th>
              <th className="border-r border-black px-4 py-2 text-left">
                Seller Role ↕
              </th>
              <th className="border-r border-black px-4 py-2 text-left">
                Reports Under ↕
              </th>
              <th className="border-r border-black px-4 py-2 text-left">
                Linked User ↕
              </th>
              <th className="border-r border-black px-4 py-2 text-left">
                Accreditation Date ↕
              </th>
              <th className="border-r border-black px-4 py-2 text-left">
                Contact No. ↕
              </th>
              <th className="border-r border-black px-4 py-2 text-left">
                Email ↕
              </th>
              <th className="px-4 py-2 text-left">Actions ↕</th>
            </tr>
          </thead>

          <tbody>
            {filteredSellers.map((seller) => (
              <tr key={seller.id} className="border-b border-black">
                <td className="border-r border-black px-4 py-2 uppercase">
                  {seller.status}
                </td>

                <td className="border-r border-black px-4 py-2">
                  {seller.full_name}
                </td>

                <td className="border-r border-black px-4 py-2">
                  {formatRole(seller.seller_role)}
                </td>

                <td className="border-r border-black px-4 py-2">
                  {seller.parent_seller_name || "-"}
                </td>

                <td className="border-r border-black px-4 py-2">
                  {seller.linked_user_name || "-"}
                </td>

                <td className="border-r border-black px-4 py-2">
                  {formatDate(seller.created_at)}
                </td>

                <td className="border-r border-black px-4 py-2">
                  {seller.contact_no || "-"}
                </td>

                <td className="border-r border-black px-4 py-2">
                  {seller.email || "-"}
                </td>

                <td className="px-4 py-2">
                  <button
                    onClick={() => openEditModal(seller)}
                    className="border border-black px-3 py-1 hover:bg-gray-200"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}

            {filteredSellers.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-6 text-center text-gray-600">
                  No accredited sellers found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isAddOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg border border-black bg-white p-4">
            <h2 className="mb-4 text-2xl font-bold">Add Seller</h2>

            <form onSubmit={handleAddSeller} className="flex flex-col gap-3">
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as SellerStatus,
                  })
                }
                className="border border-black px-3 py-2"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              <input
                type="text"
                placeholder="Name of seller"
                value={formData.full_name}
                onChange={(e) =>
                  setFormData({ ...formData, full_name: e.target.value })
                }
                className="border border-black px-3 py-2"
                required
              />

              <select
                value={formData.seller_role}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    seller_role: e.target.value as SellerRole,
                    parent_seller_id: null,
                  })
                }
                className="border border-black px-3 py-2"
              >
                <option value="broker_network_manager">
                  Broker Network Manager
                </option>
                <option value="broker">Broker</option>
                <option value="manager">Manager</option>
                <option value="agent">Agent</option>
              </select>

              {formData.seller_role !== "broker_network_manager" && (
                <select
                  value={formData.parent_seller_id ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      parent_seller_id: e.target.value
                        ? Number(e.target.value)
                        : null,
                    })
                  }
                  className="border border-black px-3 py-2"
                  required
                >
                  <option value="">Select reports under</option>

                  {addPossibleParents.map((seller) => (
                    <option key={seller.id} value={seller.id}>
                      {seller.full_name} - {formatRole(seller.seller_role)}
                    </option>
                  ))}
                </select>
              )}

              <input
                type="text"
                placeholder="Contact no."
                value={formData.contact_no}
                onChange={(e) =>
                  setFormData({ ...formData, contact_no: e.target.value })
                }
                className="border border-black px-3 py-2"
              />

              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="border border-black px-3 py-2"
              />

              {createSellerMutation.isError && (
                <p className="border border-black px-4 py-2 text-red-600">
                  {createSellerMutation.error.message}
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
                  disabled={createSellerMutation.isPending}
                  className="border border-black px-4 py-2 hover:bg-gray-200 disabled:opacity-50"
                >
                  {createSellerMutation.isPending ? "Saving..." : "Save Seller"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editSeller && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg border border-black bg-white p-4">
            <h2 className="mb-4 text-2xl font-bold">Edit Seller</h2>

            <form onSubmit={handleUpdateSeller} className="flex flex-col gap-3">
              <select
                value={editSeller.status}
                onChange={(e) =>
                  setEditSeller({
                    ...editSeller,
                    status: e.target.value as SellerStatus,
                  })
                }
                className="border border-black px-3 py-2"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              <input
                type="text"
                value={editSeller.full_name}
                onChange={(e) =>
                  setEditSeller({
                    ...editSeller,
                    full_name: e.target.value,
                  })
                }
                className="border border-black px-3 py-2"
                required
              />

              <select
                value={editSeller.seller_role}
                onChange={(e) =>
                  setEditSeller({
                    ...editSeller,
                    seller_role: e.target.value as SellerRole,
                    parent_seller_id: null,
                  })
                }
                className="border border-black px-3 py-2"
              >
                <option value="broker_network_manager">
                  Broker Network Manager
                </option>
                <option value="broker">Broker</option>
                <option value="manager">Manager</option>
                <option value="agent">Agent</option>
              </select>

              {editSeller.seller_role !== "broker_network_manager" && (
                <select
                  value={editSeller.parent_seller_id ?? ""}
                  onChange={(e) =>
                    setEditSeller({
                      ...editSeller,
                      parent_seller_id: e.target.value
                        ? Number(e.target.value)
                        : null,
                    })
                  }
                  className="border border-black px-3 py-2"
                  required
                >
                  <option value="">Select reports under</option>

                  {editPossibleParents.map((seller) => (
                    <option key={seller.id} value={seller.id}>
                      {seller.full_name} - {formatRole(seller.seller_role)}
                    </option>
                  ))}
                </select>
              )}

              <input
                type="text"
                value={editSeller.contact_no || ""}
                onChange={(e) =>
                  setEditSeller({
                    ...editSeller,
                    contact_no: e.target.value,
                  })
                }
                className="border border-black px-3 py-2"
              />

              <input
                type="email"
                value={editSeller.email || ""}
                onChange={(e) =>
                  setEditSeller({
                    ...editSeller,
                    email: e.target.value,
                  })
                }
                className="border border-black px-3 py-2"
              />

              {updateSellerMutation.isError && (
                <p className="border border-black px-4 py-2 text-red-600">
                  {updateSellerMutation.error.message}
                </p>
              )}

              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditSeller(null)}
                  className="border border-black px-4 py-2 hover:bg-gray-200"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={updateSellerMutation.isPending}
                  className="border border-black px-4 py-2 hover:bg-gray-200 disabled:opacity-50"
                >
                  {updateSellerMutation.isPending
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

export default AccredittedSellers