import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { FiEdit2, FiPlus, FiSearch, FiUsers } from "react-icons/fi"
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

type SellerRole = "broker_network_manager" | "broker" | "agent" | string

type AccreditedSeller = {
  id: number
  user_id: number | null
  full_name: string
  email: string | null
  contact_no: string | null
  seller_role: SellerRole
  commission_rate: number | string | null
  parent_seller_id: number | null
  parent_seller_name: string | null
  parent_seller_role: string | null
  custom_reports_under: string | null
  reports_under_display: string
  status: SellerStatus
  accreditation_date: string | null
  created_at: string
  updated_at: string
}

type SellerFormData = {
  user_id: string
  full_name: string
  email: string
  contact_no: string
  seller_role: SellerRole
  commission_rate: string
  parent_seller_id: string
  custom_reports_under: string
  reports_under_mode: "none" | "seller" | "custom"
  status: SellerStatus
  accreditation_date: string
}

type SellersResponse = {
  accreditedSellers: AccreditedSeller[]
}

type PossibleParentSellersResponse = {
  possibleParentSellers: AccreditedSeller[]
}

const defaultSellerFormData: SellerFormData = {
  user_id: "",
  full_name: "",
  email: "",
  contact_no: "",
  seller_role: "agent",
  commission_rate: "",
  parent_seller_id: "",
  custom_reports_under: "",
  reports_under_mode: "none",
  status: "active",
  accreditation_date: "",
}

const sellerRoles = [
  { label: "Broker Network Manager", value: "broker_network_manager" },
  { label: "Broker", value: "broker" },
  { label: "Agent", value: "agent" },
]

const sellerStatuses = ["active", "inactive"]

const fetchSellers = async () => {
  const response = await fetch(`${API_URL}/accredited-sellers`, {
    credentials: "include",
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }

  const data = (await response.json()) as SellersResponse
  return data.accreditedSellers
}

const fetchPossibleParentSellers = async (excludeId?: number | null) => {
  const url = excludeId
    ? `${API_URL}/accredited-sellers/possible-parents?exclude_id=${excludeId}`
    : `${API_URL}/accredited-sellers/possible-parents`

  const response = await fetch(url, {
    credentials: "include",
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }

  const data = (await response.json()) as PossibleParentSellersResponse
  return data.possibleParentSellers
}

const createSeller = async (sellerData: SellerFormData) => {
  const response = await fetch(`${API_URL}/accredited-sellers`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(formatSellerPayload(sellerData)),
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
  sellerData: SellerFormData
}) => {
  const response = await fetch(`${API_URL}/accredited-sellers/${id}`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(formatSellerPayload(sellerData)),
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }

  return response.json()
}

const formatSellerPayload = (sellerData: SellerFormData) => {
  const parent_seller_id =
    sellerData.reports_under_mode === "seller"
      ? Number(sellerData.parent_seller_id)
      : null

  const custom_reports_under =
    sellerData.reports_under_mode === "custom"
      ? sellerData.custom_reports_under.trim()
      : null

  return {
    user_id: sellerData.user_id ? Number(sellerData.user_id) : null,
    full_name: sellerData.full_name,
    email: sellerData.email || null,
    contact_no: sellerData.contact_no || null,
    seller_role: sellerData.seller_role,
    commission_rate:
      sellerData.commission_rate === ""
        ? null
        : Number(sellerData.commission_rate),
    parent_seller_id,
    custom_reports_under,
    status: sellerData.status,
    accreditation_date: sellerData.accreditation_date || null,
  }
}

const sellerToFormData = (seller: AccreditedSeller): SellerFormData => {
  let reportsUnderMode: SellerFormData["reports_under_mode"] = "none"

  if (seller.parent_seller_id) {
    reportsUnderMode = "seller"
  } else if (seller.custom_reports_under) {
    reportsUnderMode = "custom"
  }

  return {
    user_id: seller.user_id ? String(seller.user_id) : "",
    full_name: seller.full_name,
    email: seller.email || "",
    contact_no: seller.contact_no || "",
    seller_role: seller.seller_role,
    commission_rate:
      seller.commission_rate === null || seller.commission_rate === undefined
        ? ""
        : String(seller.commission_rate),
    parent_seller_id: seller.parent_seller_id
      ? String(seller.parent_seller_id)
      : "",
    custom_reports_under: seller.custom_reports_under || "",
    reports_under_mode: reportsUnderMode,
    status: seller.status,
    accreditation_date: seller.accreditation_date
      ? seller.accreditation_date.slice(0, 10)
      : "",
  }
}

const AccredittedSellers = () => {
  const queryClient = useQueryClient()

  const [searchInput, setSearchInput] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editSeller, setEditSeller] = useState<AccreditedSeller | null>(null)
  const [formData, setFormData] = useState<SellerFormData>(
    defaultSellerFormData
  )
  const [editFormData, setEditFormData] = useState<SellerFormData>(
    defaultSellerFormData
  )
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [successMessage, setSuccessMessage] = useState("")

  const {
    data: sellers = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["accredited-sellers"],
    queryFn: fetchSellers,
  })

  const { data: possibleParentSellers = [] } = useQuery({
    queryKey: ["possible-parent-sellers", editSeller?.id || null],
    queryFn: () => fetchPossibleParentSellers(editSeller?.id || null),
  })

  const createSellerMutation = useMutation({
    mutationFn: createSeller,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accredited-sellers"] })
      queryClient.invalidateQueries({ queryKey: ["possible-parent-sellers"] })
      setIsAddOpen(false)
      setFormData(defaultSellerFormData)
      setSuccessMessage("Accredited seller created successfully")
    },
  })

  const updateSellerMutation = useMutation({
    mutationFn: updateSeller,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accredited-sellers"] })
      queryClient.invalidateQueries({ queryKey: ["possible-parent-sellers"] })
      setEditSeller(null)
      setSuccessMessage("Accredited seller updated successfully")
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
      (seller.reports_under_display || "").toLowerCase().includes(search)

    const matchesRole =
      roleFilter === "all" || seller.seller_role === roleFilter

    const matchesStatus =
      statusFilter === "all" || seller.status === statusFilter

    return matchesSearch && matchesRole && matchesStatus
  })

  const paginatedSellers = paginateRows(filteredSellers, page, rowsPerPage)

  const roleCounts = useMemo(() => {
    return sellerRoles.reduce<Record<string, number>>((counts, role) => {
      counts[role.value] = sellers.filter(
        (seller) => seller.seller_role === role.value
      ).length

      return counts
    }, {})
  }, [sellers])

  const handleAddSeller = () => {
    createSellerMutation.mutate(formData)
  }

  const handleUpdateSeller = () => {
    if (!editSeller) return

    updateSellerMutation.mutate({
      id: editSeller.id,
      sellerData: editFormData,
    })
  }

  const openAddModal = () => {
    setFormData(defaultSellerFormData)
    setSuccessMessage("")
    setIsAddOpen(true)
  }

  const openEditModal = (seller: AccreditedSeller) => {
    setEditSeller(seller)
    setEditFormData(sellerToFormData(seller))
    setSuccessMessage("")
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
        subtitle="Manage brokers, agents, reporting hierarchy, accreditation dates, and default commission rates."
        actions={
          <Button icon={<FiPlus />} onClick={openAddModal} variant="primary">
            Add Seller
          </Button>
        }
      />

      {successMessage ? <Alert variant="success" title={successMessage} /> : null}
      {mutationError ? <Alert variant="error" title={mutationError} /> : null}

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard label="All Sellers" value={sellers.length} />
        <StatCard label="Agents" value={roleCounts.agent || 0} />
        <StatCard label="Brokers" value={roleCounts.broker || 0} />
        <StatCard
          label="Network Managers"
          value={roleCounts.broker_network_manager || 0}
        />
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
        <Input
          icon={<FiSearch />}
          placeholder="Search seller, email, role, reports under..."
          value={searchInput}
          onChange={(e) => {
            setSearchInput(e.target.value)
            setPage(1)
          }}
        />

        <Select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value)
            setPage(1)
          }}
        >
          <option value="all">All Roles</option>
          {sellerRoles.map((role) => (
            <option key={role.value} value={role.value}>
              {role.label}
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
          {sellerStatuses.map((status) => (
            <option key={status} value={status}>
              {formatText(status)}
            </option>
          ))}
        </Select>

        <Button
          onClick={() => {
            setSearchInput("")
            setRoleFilter("all")
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
              <th className="px-4 py-3 text-left">Role</th>
              <th className="px-4 py-3 text-left">Default Commission Rate</th>
              <th className="px-4 py-3 text-left">Reports Under</th>
              <th className="px-4 py-3 text-left">Contact</th>
              <th className="px-4 py-3 text-left">Accreditation Date</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {paginatedSellers.map((seller) => (
              <tr key={seller.id} className="border-b border-slate-100">
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-900">
                    {seller.full_name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {seller.email || "-"}
                  </p>
                </td>

                <td className="px-4 py-3 text-slate-600">
                  {formatText(seller.seller_role)}
                </td>

                <td className="px-4 py-3 text-slate-600">
                  {seller.commission_rate === null ||
                  seller.commission_rate === undefined
                    ? "-"
                    : `${formatNumber(seller.commission_rate)}%`}
                </td>

                <td className="px-4 py-3 text-slate-600">
                  {seller.reports_under_display || "None"}
                </td>

                <td className="px-4 py-3 text-slate-600">
                  {seller.contact_no || "-"}
                </td>

                <td className="px-4 py-3 text-slate-600">
                  {formatDate(seller.accreditation_date)}
                </td>

                <td className="px-4 py-3">
                  <StatusBadge status={seller.status} />
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
                  <EmptyState title="No accredited sellers found" />
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
        <Modal
          title="Add Accredited Seller"
          onClose={() => setIsAddOpen(false)}
          size="lg"
          footer={
            <div className="flex justify-end gap-2">
              <Button onClick={() => setIsAddOpen(false)}>Cancel</Button>
              <Button
                disabled={createSellerMutation.isPending}
                onClick={handleAddSeller}
                variant="primary"
              >
                {createSellerMutation.isPending ? "Saving..." : "Add Seller"}
              </Button>
            </div>
          }
        >
          <SellerForm
            formData={formData}
            setFormData={setFormData}
            possibleParentSellers={possibleParentSellers}
          />
        </Modal>
      ) : null}

      {editSeller ? (
        <Modal
          title="Edit Accredited Seller"
          onClose={() => setEditSeller(null)}
          size="lg"
          footer={
            <div className="flex justify-end gap-2">
              <Button onClick={() => setEditSeller(null)}>Cancel</Button>
              <Button
                disabled={updateSellerMutation.isPending}
                onClick={handleUpdateSeller}
                variant="primary"
              >
                {updateSellerMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          }
        >
          <SellerForm
            formData={editFormData}
            setFormData={setEditFormData}
            possibleParentSellers={possibleParentSellers}
          />
        </Modal>
      ) : null}
    </div>
  )
}

type SellerFormProps = {
  formData: SellerFormData
  setFormData: (formData: SellerFormData) => void
  possibleParentSellers: AccreditedSeller[]
}

const SellerForm = ({
  formData,
  setFormData,
  possibleParentSellers,
}: SellerFormProps) => {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Input
        label="Full Name"
        value={formData.full_name}
        onChange={(e) =>
          setFormData({
            ...formData,
            full_name: e.target.value,
          })
        }
        required
      />

      <Input
        label="Email"
        type="email"
        value={formData.email}
        onChange={(e) =>
          setFormData({
            ...formData,
            email: e.target.value,
          })
        }
      />

      <Input
        label="Contact No."
        value={formData.contact_no}
        onChange={(e) =>
          setFormData({
            ...formData,
            contact_no: e.target.value,
          })
        }
      />

      <Select
        label="Seller Role"
        value={formData.seller_role}
        onChange={(e) =>
          setFormData({
            ...formData,
            seller_role: e.target.value,
          })
        }
      >
        {sellerRoles.map((role) => (
          <option key={role.value} value={role.value}>
            {role.label}
          </option>
        ))}
      </Select>

      <Input
        label="Default Commission Rate (%)"
        type="number"
        min={0}
        max={100}
        step="0.01"
        placeholder="Optional"
        value={formData.commission_rate}
        onChange={(e) =>
          setFormData({
            ...formData,
            commission_rate: e.target.value,
          })
        }
      />

      <Input
        label="Accreditation Date"
        type="date"
        value={formData.accreditation_date}
        onChange={(e) =>
          setFormData({
            ...formData,
            accreditation_date: e.target.value,
          })
        }
      />

      <Select
        label="Reports Under"
        value={formData.reports_under_mode}
        onChange={(e) =>
          setFormData({
            ...formData,
            reports_under_mode: e.target.value as SellerFormData["reports_under_mode"],
            parent_seller_id: "",
            custom_reports_under: "",
          })
        }
      >
        <option value="none">None</option>
        <option value="seller">Existing Seller</option>
        <option value="custom">Custom Name</option>
      </Select>

      {formData.reports_under_mode === "seller" ? (
        <Select
          label="Select Parent Seller"
          value={formData.parent_seller_id}
          onChange={(e) =>
            setFormData({
              ...formData,
              parent_seller_id: e.target.value,
            })
          }
          required
        >
          <option value="">Select seller</option>
          {possibleParentSellers.map((seller) => (
            <option key={seller.id} value={seller.id}>
              {seller.full_name} - {formatText(seller.seller_role)}
            </option>
          ))}
        </Select>
      ) : null}

      {formData.reports_under_mode === "custom" ? (
        <Input
          label="Custom Reports Under"
          placeholder="Example: external broker / old manager name"
          value={formData.custom_reports_under}
          onChange={(e) =>
            setFormData({
              ...formData,
              custom_reports_under: e.target.value,
            })
          }
          required
        />
      ) : null}

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
        {sellerStatuses.map((status) => (
          <option key={status} value={status}>
            {formatText(status)}
          </option>
        ))}
      </Select>
    </div>
  )
}

export default AccredittedSellers