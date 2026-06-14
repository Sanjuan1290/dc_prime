import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { FiEdit2, FiSearch, FiUserCheck, FiUsers } from "react-icons/fi"
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

type AccreditedSeller = {
  id: number
  user_id: number | null
  user_full_name?: string | null
  full_name: string
  email: string | null
  contact_no: string | null
  seller_role: string
  parent_seller_id: number | null
  parent_seller_name: string | null
  reports_under_display: string | null
  status: string
  accreditation_date: string | null
  commission_rate: number | string | null
  commission_pool_rate?: number | string | null
  personal_commission_rate?: number | string | null
  override_commission_rate?: number | string | null
  rate_set_by_name?: string | null
  rate_updated_at?: string | null
  created_at: string
}

type SellersResponse = {
  accreditedSellers?: AccreditedSeller[]
  sellers?: AccreditedSeller[]
  data?: AccreditedSeller[]
}

type SellerBasicForm = {
  full_name: string
  email: string
  contact_no: string
  accreditation_date: string
  status: string
}

const sellerStatuses = ["active", "inactive"]

const fetchSellers = async (): Promise<AccreditedSeller[]> => {
  const response = await fetch(`${API_URL}/accredited-sellers`, {
    credentials: "include",
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }

  const data = (await response.json()) as SellersResponse
  return data.accreditedSellers || data.sellers || data.data || []
}

const sellerToBasicForm = (seller: AccreditedSeller): SellerBasicForm => ({
  full_name: seller.full_name,
  email: seller.email || "",
  contact_no: seller.contact_no || "",
  accreditation_date: seller.accreditation_date ? seller.accreditation_date.slice(0, 10) : "",
  status: seller.status || "active",
})

const updateSellerBasic = async ({ id, form }: { id: number; form: SellerBasicForm }) => {
  const response = await fetch(`${API_URL}/accredited-sellers/${id}`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      full_name: form.full_name.trim(),
      email: form.email.trim() || null,
      contact_no: form.contact_no.trim() || null,
      accreditation_date: form.accreditation_date || null,
      status: form.status,
    }),
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }

  return response.json()
}

const formatRate = (rate: number | string | null | undefined) => {
  if (rate === null || rate === undefined || rate === "") return "-"
  return `${formatNumber(rate)}%`
}

const getHierarchyPath = (seller: AccreditedSeller) => {
  if (!seller.parent_seller_name) return "Company / None"
  return seller.parent_seller_name
}

const AccredittedSellers = () => {
  const queryClient = useQueryClient()
  const [searchInput, setSearchInput] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [editSeller, setEditSeller] = useState<AccreditedSeller | null>(null)
  const [editForm, setEditForm] = useState<SellerBasicForm>({
    full_name: "",
    email: "",
    contact_no: "",
    accreditation_date: "",
    status: "active",
  })
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

  const filteredSellers = useMemo(() => {
    const searchTerm = searchInput.toLowerCase().trim()

    return sellers.filter((seller) => {
      const matchesSearch = !searchTerm || [
        seller.full_name,
        seller.email,
        seller.contact_no,
        seller.seller_role,
        seller.parent_seller_name,
        seller.user_full_name,
        seller.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(searchTerm)

      const matchesRole = roleFilter === "all" || seller.seller_role === roleFilter
      const matchesStatus = statusFilter === "all" || seller.status === statusFilter

      return matchesSearch && matchesRole && matchesStatus
    })
  }, [roleFilter, searchInput, sellers, statusFilter])

  const paginatedSellers = useMemo(
    () => paginateRows(filteredSellers, page, rowsPerPage),
    [filteredSellers, page, rowsPerPage]
  )

  const stats = useMemo(() => {
    return {
      total: sellers.length,
      active: sellers.filter((seller) => seller.status === "active").length,
      bnm: sellers.filter((seller) => seller.seller_role === "broker_network_manager").length,
      agents: sellers.filter((seller) => seller.seller_role === "agent").length,
    }
  }, [sellers])

  const updateMutation = useMutation({
    mutationFn: updateSellerBasic,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accredited-sellers"] })
      queryClient.invalidateQueries({ queryKey: ["users"] })
      setEditSeller(null)
      setSuccessMessage("Seller record updated successfully")
    },
  })

  const openEditModal = (seller: AccreditedSeller) => {
    setEditSeller(seller)
    setEditForm(sellerToBasicForm(seller))
  }

  const handleUpdateSeller = () => {
    if (!editSeller) return
    updateMutation.mutate({ id: editSeller.id, form: editForm })
  }

  return (
    <div className="p-6">
      <PageHeader
        icon={<FiUsers />}
        title="Accredited Sellers"
        subtitle="Seller directory only. Create seller accounts, hierarchy, and commission rates in User Management."
      />

      {successMessage ? <Alert variant="success" title={successMessage} /> : null}
      {error ? (
        <Alert
          variant="error"
          title={error instanceof Error ? error.message : "Failed to load sellers"}
        />
      ) : null}
      {updateMutation.error ? (
        <Alert
          variant="error"
          title={updateMutation.error instanceof Error ? updateMutation.error.message : "Failed to update seller"}
        />
      ) : null}

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard icon={<FiUserCheck />} label="Total Sellers" value={stats.total} />
        <StatCard icon={<FiUserCheck />} label="Active" value={stats.active} />
        <StatCard icon={<FiUserCheck />} label="BNM" value={stats.bnm} />
        <StatCard icon={<FiUserCheck />} label="Agents" value={stats.agents} />
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-[1fr_220px_220px]">
        <Input
          icon={<FiSearch />}
          placeholder="Search sellers, users, roles, or reports under..."
          value={searchInput}
          onChange={(event) => {
            setSearchInput(event.target.value)
            setPage(1)
          }}
        />

        <Select
          value={roleFilter}
          onChange={(event) => {
            setRoleFilter(event.target.value)
            setPage(1)
          }}
        >
          <option value="all">All roles</option>
          <option value="broker_network_manager">Broker Network Manager</option>
          <option value="broker">Broker</option>
          <option value="manager">Manager</option>
          <option value="agent">Agent</option>
        </Select>

        <Select
          value={statusFilter}
          onChange={(event) => {
            setStatusFilter(event.target.value)
            setPage(1)
          }}
        >
          <option value="all">All statuses</option>
          {sellerStatuses.map((status) => (
            <option key={status} value={status}>{formatText(status)}</option>
          ))}
        </Select>
      </div>

      {isLoading ? <LoadingState label="Loading accredited sellers..." /> : null}

      <TableContainer>
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr className="border-b border-slate-200 text-slate-600">
              <th className="px-4 py-3 text-left">Seller</th>
              <th className="px-4 py-3 text-left">Contact</th>
              <th className="px-4 py-3 text-left">Role</th>
              <th className="px-4 py-3 text-left">Reports Under</th>
              <th className="px-4 py-3 text-left">Commission Setup</th>
              <th className="px-4 py-3 text-left">Accreditation</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Action</th>
            </tr>
          </thead>

          <tbody>
            {paginatedSellers.map((seller) => (
              <tr key={seller.id} className="border-b border-slate-100">
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-900">{seller.full_name}</p>
                  <p className="text-xs text-slate-500">User: {seller.user_full_name || "Not linked"}</p>
                </td>

                <td className="px-4 py-3 text-slate-600">
                  <p>{seller.email || "-"}</p>
                  <p className="text-xs text-slate-500">{seller.contact_no || "-"}</p>
                </td>

                <td className="px-4 py-3 text-slate-600">{formatText(seller.seller_role)}</td>

                <td className="px-4 py-3 text-slate-600">
                  <p>{getHierarchyPath(seller)}</p>
                  <p className="text-xs text-slate-500">Managed through User Management</p>
                </td>

                <td className="px-4 py-3 text-slate-600">
                  <p>Pool: <span className="font-semibold text-slate-900">{formatRate(seller.commission_pool_rate)}</span></p>
                  <p>Personal: <span className="font-semibold text-slate-900">{formatRate(seller.personal_commission_rate || seller.commission_rate)}</span></p>
                  <p>Override: <span className="font-semibold text-slate-900">{formatRate(seller.override_commission_rate)}</span></p>
                </td>

                <td className="px-4 py-3 text-slate-600">{formatDate(seller.accreditation_date)}</td>

                <td className="px-4 py-3"><StatusBadge status={seller.status} /></td>

                <td className="px-4 py-3">
                  <Button icon={<FiEdit2 />} onClick={() => openEditModal(seller)}>Edit Basic Info</Button>
                </td>
              </tr>
            ))}

            {paginatedSellers.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <EmptyState
                    title="No sellers found"
                    description="Create broker, manager, and agent accounts from User Management. Seller records will be linked automatically."
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

      {editSeller ? (
        <Modal
          title={`Edit Basic Seller Info - ${editSeller.full_name}`}
          onClose={() => setEditSeller(null)}
          footer={
            <div className="flex justify-end gap-2">
              <Button onClick={() => setEditSeller(null)}>Cancel</Button>
              <Button disabled={updateMutation.isPending} onClick={handleUpdateSeller} variant="primary">
                {updateMutation.isPending ? "Saving..." : "Save Basic Info"}
              </Button>
            </div>
          }
        >
          <Alert
            variant="info"
            title="Role, reports-under, and commission rates are edited in User Management."
          />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input label="Full Name" value={editForm.full_name} onChange={(event) => setEditForm({ ...editForm, full_name: event.target.value })} required />
            <Input label="Email" type="email" value={editForm.email} onChange={(event) => setEditForm({ ...editForm, email: event.target.value })} />
            <Input label="Contact No." value={editForm.contact_no} onChange={(event) => setEditForm({ ...editForm, contact_no: event.target.value })} />
            <Input label="Accreditation Date" type="date" value={editForm.accreditation_date} onChange={(event) => setEditForm({ ...editForm, accreditation_date: event.target.value })} />
            <Select label="Status" value={editForm.status} onChange={(event) => setEditForm({ ...editForm, status: event.target.value })}>
              {sellerStatuses.map((status) => (
                <option key={status} value={status}>{formatText(status)}</option>
              ))}
            </Select>
          </div>
        </Modal>
      ) : null}
    </div>
  )
}

export default AccredittedSellers
