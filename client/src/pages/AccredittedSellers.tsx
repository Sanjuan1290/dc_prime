import { useMemo, useState, type FormEvent } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { FiEdit2, FiRefreshCw, FiSearch, FiUserPlus, FiUsers } from "react-icons/fi"
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
import { formatDate, formatNumber, formatText } from "../utils/formatters"
import { paginateRows } from "../utils/pagination"

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

const sellerRoles: SellerRole[] = [
  "broker_network_manager",
  "broker",
  "manager",
  "agent",
]

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
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)

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

  const filteredSellers = useMemo(() => {
    return sellers.filter((seller) => {
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
  }, [roleFilter, searchInput, sellers, statusFilter])

  const paginatedSellers = paginateRows(filteredSellers, page, rowsPerPage)
  const activeCount = sellers.filter((seller) => seller.status === "active").length
  const managerCount = sellers.filter((seller) =>
    ["broker_network_manager", "broker", "manager"].includes(
      seller.seller_role
    )
  ).length
  const linkedCount = sellers.filter((seller) => seller.linked_user_name).length

  const resetFilters = () => {
    setSearchInput("")
    setStatusFilter("all")
    setRoleFilter("all")
    setPage(1)
  }

  const resetForm = () => {
    setFormData(emptyFormData)
  }

  const openAddModal = () => {
    resetForm()
    setIsAddOpen(true)
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

  if (isLoading) {
    return <LoadingState label="Loading accredited sellers..." />
  }

  if (error) {
    return <Alert title="Failed to load accredited sellers" variant="error" />
  }

  return (
    <div className="p-4 sm:p-6">
      <PageHeader
        icon={<FiUsers />}
        title="Accredited Sellers"
        subtitle="Live seller hierarchy records from MySQL"
        actions={
          <Button icon={<FiUserPlus />} onClick={openAddModal} variant="primary">
            Add Seller
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard label="Total Sellers" value={formatNumber(sellers.length)} />
        <StatCard label="Active Sellers" value={formatNumber(activeCount)} />
        <StatCard label="Leadership Roles" value={formatNumber(managerCount)} />
        <StatCard label="Linked Users" value={formatNumber(linkedCount)} />
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_180px_220px_auto]">
        <Input
          icon={<FiSearch />}
          placeholder="Search seller, role, parent, contact, or email..."
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
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Select>
        <Select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value)
            setPage(1)
          }}
        >
          <option value="all">All Roles</option>
          {sellerRoles.map((role) => (
            <option key={role} value={role}>
              {formatText(role)}
            </option>
          ))}
        </Select>
        <Button icon={<FiRefreshCw />} onClick={resetFilters}>
          Reset
        </Button>
      </div>

      <TableContainer>
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">
                Status
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">
                Name of Seller
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">
                Seller Role
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">
                Reports Under
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">
                Linked User
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">
                Accreditation Date
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">
                Contact No.
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">
                Email
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {paginatedSellers.map((seller) => (
              <tr key={seller.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <StatusBadge status={seller.status} />
                </td>
                <td className="px-4 py-3 font-semibold text-slate-900">
                  {seller.full_name}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {formatText(seller.seller_role)}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {seller.parent_seller_name || "-"}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {seller.linked_user_name || "-"}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {formatDate(seller.created_at)}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {seller.contact_no || "-"}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {seller.email || "-"}
                </td>
                <td className="px-4 py-3">
                  <Button
                    icon={<FiEdit2 />}
                    onClick={() => setEditSeller(seller)}
                    variant="secondary"
                  >
                    Edit
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredSellers.length === 0 ? (
          <EmptyState
            title="No accredited sellers found"
            description="Try clearing filters or adding a seller."
          />
        ) : null}
      </TableContainer>

      <Pagination
        page={page}
        rowsPerPage={rowsPerPage}
        totalRows={filteredSellers.length}
        onPageChange={setPage}
        onRowsPerPageChange={setRowsPerPage}
      />

      {isAddOpen ? (
        <Modal
          title="Add Seller"
          onClose={() => {
            resetForm()
            setIsAddOpen(false)
          }}
        >
          <SellerForm
            error={
              createSellerMutation.error instanceof Error
                ? createSellerMutation.error.message
                : ""
            }
            isPending={createSellerMutation.isPending}
            onCancel={() => {
              resetForm()
              setIsAddOpen(false)
            }}
            onSubmit={handleAddSeller}
            parentOptions={addPossibleParents}
            sellerData={formData}
            setSellerData={setFormData}
            submitLabel="Save Seller"
          />
        </Modal>
      ) : null}

      {editSeller ? (
        <Modal title="Edit Seller" onClose={() => setEditSeller(null)}>
          <SellerForm
            error={
              updateSellerMutation.error instanceof Error
                ? updateSellerMutation.error.message
                : ""
            }
            isPending={updateSellerMutation.isPending}
            onCancel={() => setEditSeller(null)}
            onSubmit={handleUpdateSeller}
            parentOptions={editPossibleParents}
            sellerData={{
              user_id: editSeller.user_id,
              full_name: editSeller.full_name,
              email: editSeller.email || "",
              contact_no: editSeller.contact_no || "",
              seller_role: editSeller.seller_role,
              parent_seller_id: editSeller.parent_seller_id,
              status: editSeller.status,
            }}
            setSellerData={(nextData) =>
              setEditSeller({
                ...editSeller,
                user_id: nextData.user_id,
                full_name: nextData.full_name,
                email: nextData.email,
                contact_no: nextData.contact_no,
                seller_role: nextData.seller_role,
                parent_seller_id: nextData.parent_seller_id,
                status: nextData.status,
              })
            }
            submitLabel="Save Changes"
          />
        </Modal>
      ) : null}
    </div>
  )
}

type SellerFormProps = {
  error: string
  isPending: boolean
  onCancel: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  parentOptions: PossibleParentSeller[]
  sellerData: SellerFormData
  setSellerData: (sellerData: SellerFormData) => void
  submitLabel: string
}

const SellerForm = ({
  error,
  isPending,
  onCancel,
  onSubmit,
  parentOptions,
  sellerData,
  setSellerData,
  submitLabel,
}: SellerFormProps) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input
          label="Name of Seller"
          value={sellerData.full_name}
          onChange={(e) =>
            setSellerData({ ...sellerData, full_name: e.target.value })
          }
          required
        />
        <Select
          label="Status"
          value={sellerData.status}
          onChange={(e) =>
            setSellerData({
              ...sellerData,
              status: e.target.value as SellerStatus,
            })
          }
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Select>
        <Select
          label="Seller Role"
          value={sellerData.seller_role}
          onChange={(e) =>
            setSellerData({
              ...sellerData,
              seller_role: e.target.value as SellerRole,
              parent_seller_id: null,
            })
          }
        >
          {sellerRoles.map((role) => (
            <option key={role} value={role}>
              {formatText(role)}
            </option>
          ))}
        </Select>
        {sellerData.seller_role !== "broker_network_manager" ? (
          <Select
            label="Reports Under"
            value={sellerData.parent_seller_id ?? ""}
            onChange={(e) =>
              setSellerData({
                ...sellerData,
                parent_seller_id: e.target.value ? Number(e.target.value) : null,
              })
            }
            required
          >
            <option value="">Select reports under</option>
            {parentOptions.map((seller) => (
              <option key={seller.id} value={seller.id}>
                {seller.full_name} - {formatText(seller.seller_role)}
              </option>
            ))}
          </Select>
        ) : null}
        <Input
          label="Contact No."
          value={sellerData.contact_no}
          onChange={(e) =>
            setSellerData({ ...sellerData, contact_no: e.target.value })
          }
        />
        <Input
          label="Email"
          type="email"
          value={sellerData.email}
          onChange={(e) =>
            setSellerData({ ...sellerData, email: e.target.value })
          }
        />
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

export default AccredittedSellers
