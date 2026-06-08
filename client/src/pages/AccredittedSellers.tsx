import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  FiEdit2,
  FiRefreshCw,
  FiSearch,
  FiUserPlus,
  FiUsers,
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
import { formatDate, formatText } from "../utils/formatters"
import { paginateRows } from "../utils/pagination"

type SellerRole = "broker_network_manager" | "broker" | "agent" | string
type ReportsUnderMode = "none" | "existing" | "custom"

type AccreditedSeller = {
  id: number
  user_id: number | null
  full_name: string
  email: string | null
  contact_no: string | null
  seller_role: SellerRole
  parent_seller_id: number | null
  parent_seller_name: string | null
  parent_seller_role: SellerRole | null
  custom_reports_under: string | null
  reports_under_display: string | null
  status: string
  accreditation_date: string | null
  created_at: string
  updated_at: string
}

type SellerFormData = {
  user_id: number | null
  full_name: string
  email: string
  contact_no: string
  seller_role: SellerRole
  reports_under_mode: ReportsUnderMode
  parent_seller_id: number | null
  custom_reports_under: string
  status: string
  accreditation_date: string
}

type SellerPayload = {
  user_id: number | null
  full_name: string
  email: string
  contact_no: string
  seller_role: SellerRole
  parent_seller_id: number | null
  custom_reports_under: string | null
  status: string
  accreditation_date: string | null
}

type AccreditedSellersResponse = {
  accreditedSellers: AccreditedSeller[]
}

type PossibleParentSellersResponse = {
  possibleParentSellers: AccreditedSeller[]
}

const sellerRoles = ["broker_network_manager", "broker", "agent"]

const emptyFormData: SellerFormData = {
  user_id: null,
  full_name: "",
  email: "",
  contact_no: "",
  seller_role: "agent",
  reports_under_mode: "none",
  parent_seller_id: null,
  custom_reports_under: "",
  status: "active",
  accreditation_date: "",
}

const fetchSellers = async (): Promise<AccreditedSeller[]> => {
  const response = await fetch(`${API_URL}/accredited-sellers`, {
    credentials: "include",
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }

  const data = (await response.json()) as AccreditedSellersResponse
  return data.accreditedSellers
}

const fetchPossibleParentSellers = async (): Promise<AccreditedSeller[]> => {
  const response = await fetch(`${API_URL}/accredited-sellers/possible-parents`, {
    credentials: "include",
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }

  const data = (await response.json()) as PossibleParentSellersResponse
  return data.possibleParentSellers
}

const createSeller = async (sellerData: SellerPayload) => {
  const response = await fetch(`${API_URL}/accredited-sellers`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(sellerData),
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }

  return response.json()
}

const updateSeller = async ({
  id,
  sellerData,
}: {
  id: number
  sellerData: SellerPayload
}) => {
  const response = await fetch(`${API_URL}/accredited-sellers/${id}`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(sellerData),
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }

  return response.json()
}

const getReportsUnderMode = (seller: AccreditedSeller): ReportsUnderMode => {
  if (seller.parent_seller_id) return "existing"
  if (seller.custom_reports_under) return "custom"
  return "none"
}

const sellerToFormData = (seller: AccreditedSeller): SellerFormData => ({
  user_id: seller.user_id,
  full_name: seller.full_name,
  email: seller.email || "",
  contact_no: seller.contact_no || "",
  seller_role: seller.seller_role,
  reports_under_mode: getReportsUnderMode(seller),
  parent_seller_id: seller.parent_seller_id,
  custom_reports_under: seller.custom_reports_under || "",
  status: seller.status,
  accreditation_date: seller.accreditation_date
    ? seller.accreditation_date.slice(0, 10)
    : "",
})

const buildSellerPayload = (data: SellerFormData): SellerPayload => {
  return {
    user_id: data.user_id,
    full_name: data.full_name,
    email: data.email,
    contact_no: data.contact_no,
    seller_role: data.seller_role,
    parent_seller_id:
      data.reports_under_mode === "existing" ? data.parent_seller_id : null,
    custom_reports_under:
      data.reports_under_mode === "custom"
        ? data.custom_reports_under.trim()
        : null,
    status: data.status,
    accreditation_date: data.accreditation_date || null,
  }
}

const AccredittedSellers = () => {
  const queryClient = useQueryClient()

  const [searchInput, setSearchInput] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [roleFilter, setRoleFilter] = useState("all")

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editSeller, setEditSeller] = useState<AccreditedSeller | null>(null)

  const [formData, setFormData] = useState<SellerFormData>(emptyFormData)
  const [editFormData, setEditFormData] =
    useState<SellerFormData>(emptyFormData)

  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [successMessage, setSuccessMessage] = useState("")

  const {
    data: sellers = [],
    isLoading,
    error,
  } = useQuery<AccreditedSeller[]>({
    queryKey: ["accredited-sellers"],
    queryFn: fetchSellers,
  })

  const { data: possibleParentSellers = [] } = useQuery<AccreditedSeller[]>({
    queryKey: ["accredited-sellers-possible-parents"],
    queryFn: fetchPossibleParentSellers,
  })

  const createSellerMutation = useMutation({
    mutationFn: createSeller,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accredited-sellers"] })
      queryClient.invalidateQueries({
        queryKey: ["accredited-sellers-possible-parents"],
      })
      setIsAddOpen(false)
      setFormData(emptyFormData)
      setSuccessMessage("Seller added successfully")
    },
  })

  const updateSellerMutation = useMutation({
    mutationFn: updateSeller,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accredited-sellers"] })
      queryClient.invalidateQueries({
        queryKey: ["accredited-sellers-possible-parents"],
      })
      setEditSeller(null)
      setEditFormData(emptyFormData)
      setSuccessMessage("Seller updated successfully")
    },
  })

  const filteredSellers = sellers.filter((seller) => {
    const search = searchInput.toLowerCase().trim()

    const matchesSearch =
      search === "" ||
      seller.full_name.toLowerCase().includes(search) ||
      (seller.email || "").toLowerCase().includes(search) ||
      (seller.contact_no || "").toLowerCase().includes(search) ||
      seller.seller_role.toLowerCase().includes(search) ||
      seller.status.toLowerCase().includes(search) ||
      (seller.parent_seller_name || "").toLowerCase().includes(search) ||
      (seller.custom_reports_under || "").toLowerCase().includes(search) ||
      (seller.reports_under_display || "").toLowerCase().includes(search)

    const matchesStatus =
      statusFilter === "all" || seller.status === statusFilter

    const matchesRole =
      roleFilter === "all" || seller.seller_role === roleFilter

    return matchesSearch && matchesStatus && matchesRole
  })

  const paginatedSellers = paginateRows(filteredSellers, page, rowsPerPage)

  const parentOptionsForAdd = possibleParentSellers
  const parentOptionsForEdit = possibleParentSellers.filter(
    (seller) => seller.id !== editSeller?.id
  )

  const totalSellers = sellers.length
  const activeSellers = sellers.filter(
    (seller) => seller.status === "active"
  ).length
  const brokerNetworkManagers = sellers.filter(
    (seller) => seller.seller_role === "broker_network_manager"
  ).length
  const brokers = sellers.filter(
    (seller) => seller.seller_role === "broker"
  ).length
  const agents = sellers.filter(
    (seller) => seller.seller_role === "agent"
  ).length

  const sellersByRole = useMemo(() => {
    return sellerRoles.map((role) => ({
      role,
      count: sellers.filter((seller) => seller.seller_role === role).length,
    }))
  }, [sellers])

  const resetFilters = () => {
    setSearchInput("")
    setStatusFilter("all")
    setRoleFilter("all")
    setPage(1)
  }

  const openAddModal = () => {
    setFormData(emptyFormData)
    setSuccessMessage("")
    setIsAddOpen(true)
  }

  const openEditModal = (seller: AccreditedSeller) => {
    setEditSeller(seller)
    setEditFormData(sellerToFormData(seller))
    setSuccessMessage("")
  }

  const handleAddSeller = (e: { preventDefault: () => void }) => {
    e.preventDefault()
    createSellerMutation.mutate(buildSellerPayload(formData))
  }

  const handleUpdateSeller = (e: { preventDefault: () => void }) => {
    e.preventDefault()

    if (!editSeller) return

    updateSellerMutation.mutate({
      id: editSeller.id,
      sellerData: buildSellerPayload(editFormData),
    })
  }

  const mutationError =
    createSellerMutation.error?.message || updateSellerMutation.error?.message

  if (isLoading) {
    return <LoadingState label="Loading accredited sellers..." />
  }

  if (error) {
    return <Alert variant="error" title="Failed to load accredited sellers" />
  }

  return (
    <div>
      <PageHeader
        icon={<FiUsers />}
        title="Accredited Sellers"
        subtitle="Manage seller hierarchy, custom reporting lines, and agent records."
        actions={
          <Button icon={<FiUserPlus />} onClick={openAddModal} variant="primary">
            Add Seller
          </Button>
        }
      />

      {successMessage ? <Alert variant="success" title={successMessage} /> : null}
      {mutationError ? <Alert variant="error" title={mutationError} /> : null}

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard label="Total Sellers" value={totalSellers} />
        <StatCard label="Active Sellers" value={activeSellers} />
        <StatCard label="Brokers" value={brokers} />
        <StatCard label="Agents" value={agents} />
      </div>

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Sellers by Role
            </h2>
            <p className="text-sm text-slate-500">
              Broker network managers: {brokerNetworkManagers}
            </p>
          </div>

          <FiRefreshCw className="text-slate-400" />
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {sellersByRole.map((item) => (
            <div
              key={item.role}
              className="rounded-xl border border-slate-200 bg-slate-50 p-4"
            >
              <p className="text-sm font-semibold text-slate-500">
                {formatText(item.role)}
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {item.count}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
        <Input
          icon={<FiSearch />}
          placeholder="Search seller, role, reports under, contact, email..."
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

        <Button onClick={resetFilters}>Reset</Button>
      </div>

      <TableContainer>
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr className="border-b border-slate-200">
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Name of Seller</th>
              <th className="px-4 py-3 text-left">Seller Role</th>
              <th className="px-4 py-3 text-left">Reports Under</th>
              <th className="px-4 py-3 text-left">Contact No.</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Accreditation Date</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {paginatedSellers.map((seller) => (
              <tr key={seller.id} className="border-b border-slate-100">
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
                  {seller.reports_under_display || "None"}
                </td>

                <td className="px-4 py-3 text-slate-600">
                  {seller.contact_no || "-"}
                </td>

                <td className="px-4 py-3 text-slate-600">
                  {seller.email || "-"}
                </td>

                <td className="px-4 py-3 text-slate-600">
                  {formatDate(seller.accreditation_date)}
                </td>

                <td className="px-4 py-3">
                  <Button
                    icon={<FiEdit2 />}
                    onClick={() => openEditModal(seller)}
                  >
                    Edit
                  </Button>
                </td>
              </tr>
            ))}

            {paginatedSellers.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <EmptyState
                    title="No accredited sellers found"
                    description="Try clearing filters or add a new seller."
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
        totalRows={filteredSellers.length}
        onPageChange={setPage}
        onRowsPerPageChange={setRowsPerPage}
      />

      {isAddOpen ? (
        <Modal title="Add Seller" onClose={() => setIsAddOpen(false)} size="lg">
          <SellerForm
            sellerData={formData}
            setSellerData={setFormData}
            parentOptions={parentOptionsForAdd}
            onSubmit={handleAddSeller}
            onCancel={() => setIsAddOpen(false)}
            isPending={createSellerMutation.isPending}
            submitLabel="Add Seller"
            error={createSellerMutation.error?.message}
          />
        </Modal>
      ) : null}

      {editSeller ? (
        <Modal title="Edit Seller" onClose={() => setEditSeller(null)} size="lg">
          <SellerForm
            sellerData={editFormData}
            setSellerData={setEditFormData}
            parentOptions={parentOptionsForEdit}
            onSubmit={handleUpdateSeller}
            onCancel={() => setEditSeller(null)}
            isPending={updateSellerMutation.isPending}
            submitLabel="Save Changes"
            error={updateSellerMutation.error?.message}
          />
        </Modal>
      ) : null}
    </div>
  )
}

type SellerFormProps = {
  sellerData: SellerFormData
  setSellerData: (sellerData: SellerFormData) => void
  parentOptions: AccreditedSeller[]
  onSubmit: (e: { preventDefault: () => void }) => void
  onCancel: () => void
  isPending: boolean
  submitLabel: string
  error?: string
}

const SellerForm = ({
  sellerData,
  setSellerData,
  parentOptions,
  onSubmit,
  onCancel,
  isPending,
  submitLabel,
  error,
}: SellerFormProps) => {
  const setReportsUnderMode = (mode: ReportsUnderMode) => {
    setSellerData({
      ...sellerData,
      reports_under_mode: mode,
      parent_seller_id: null,
      custom_reports_under: "",
    })
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input
          label="Name of Seller"
          value={sellerData.full_name}
          onChange={(e) =>
            setSellerData({
              ...sellerData,
              full_name: e.target.value,
            })
          }
          required
        />

        <Select
          label="Seller Role"
          value={sellerData.seller_role}
          onChange={(e) =>
            setSellerData({
              ...sellerData,
              seller_role: e.target.value,
            })
          }
        >
          {sellerRoles.map((role) => (
            <option key={role} value={role}>
              {formatText(role)}
            </option>
          ))}
        </Select>

        <Select
          label="Reports Under"
          value={sellerData.reports_under_mode}
          onChange={(e) =>
            setReportsUnderMode(e.target.value as ReportsUnderMode)
          }
        >
          <option value="none">None</option>
          <option value="existing">Existing Seller</option>
          <option value="custom">Custom</option>
        </Select>

        {sellerData.reports_under_mode === "existing" ? (
          <Select
            label="Select Seller"
            value={sellerData.parent_seller_id || ""}
            onChange={(e) =>
              setSellerData({
                ...sellerData,
                parent_seller_id: e.target.value
                  ? Number(e.target.value)
                  : null,
              })
            }
            required
          >
            <option value="">Select seller</option>
            {parentOptions.map((seller) => (
              <option key={seller.id} value={seller.id}>
                {seller.full_name} - {formatText(seller.seller_role)}
              </option>
            ))}
          </Select>
        ) : null}

        {sellerData.reports_under_mode === "custom" ? (
          <Input
            label="Custom Reports Under"
            placeholder="Example: Direct owner, external broker, walk-in, independent"
            value={sellerData.custom_reports_under}
            onChange={(e) =>
              setSellerData({
                ...sellerData,
                custom_reports_under: e.target.value,
              })
            }
            required
          />
        ) : null}

        <Input
          label="Contact No."
          value={sellerData.contact_no}
          onChange={(e) =>
            setSellerData({
              ...sellerData,
              contact_no: e.target.value,
            })
          }
        />

        <Input
          label="Email"
          type="email"
          value={sellerData.email}
          onChange={(e) =>
            setSellerData({
              ...sellerData,
              email: e.target.value,
            })
          }
        />

        <Input
          label="Accreditation Date"
          type="date"
          value={sellerData.accreditation_date}
          onChange={(e) =>
            setSellerData({
              ...sellerData,
              accreditation_date: e.target.value,
            })
          }
        />

        <Select
          label="Status"
          value={sellerData.status}
          onChange={(e) =>
            setSellerData({
              ...sellerData,
              status: e.target.value,
            })
          }
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Select>
      </div>

      {sellerData.reports_under_mode === "none" ? (
        <Alert variant="info">
          This seller will not report under anyone. Use this for independent
          sellers, walk-ins, or sellers without a broker network.
        </Alert>
      ) : null}

      {sellerData.reports_under_mode === "custom" ? (
        <Alert variant="info">
          Custom reports under will be saved as text. Use this when the person
          or group is not yet encoded in the seller list.
        </Alert>
      ) : null}

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