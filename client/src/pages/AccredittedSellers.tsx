import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { FiEdit2, FiPlus, FiSearch, FiUserCheck, FiUsers } from "react-icons/fi"
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
  direct_to_developer_rate?: number | string | null
  rate_set_by_name?: string | null
  rate_updated_at?: string | null
  created_at: string
}

type SellersResponse = {
  accreditedSellers?: AccreditedSeller[]
  sellers?: AccreditedSeller[]
  data?: AccreditedSeller[]
}

type SellerGroupMember = {
  id: number
  seller_group_id: number
  seller_id: number
  seller_name: string
  seller_role: string
  role_in_group: string
  status: string
}

type SellerGroup = {
  id: number
  group_name: string
  group_type: string
  pool_rate: number | string
  group_head_id: number | string | null
  group_head_name?: string | null
  status: string
  remarks?: string | null
  active_member_count?: number | string
  members?: SellerGroupMember[]
}

type SellerGroupsResponse = {
  sellerGroups?: SellerGroup[]
  data?: SellerGroup[]
}

type SellerGroupFormData = {
  group_name: string
  group_type: string
  pool_rate: string
  group_head_id: string
  status: string
  remarks: string
  seller_ids: string[]
}

const sellerStatuses = ["active", "inactive"]
const sellerGroupTypes = [
  "external_realty",
  "broker_group",
  "independent_broker",
  "in_house_sales_team",
  "referral_partner",
  "direct_developer",
]
const poolRateOptions = Array.from({ length: 10 }, (_, index) => String(index + 6))
const defaultGroupFormData: SellerGroupFormData = {
  group_name: "",
  group_type: "broker_group",
  pool_rate: "10",
  group_head_id: "",
  status: "active",
  remarks: "",
  seller_ids: [],
}

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

const fetchSellerGroups = async (): Promise<SellerGroup[]> => {
  const response = await fetch(`${API_URL}/seller-groups`, {
    credentials: "include",
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }

  const data = (await response.json()) as SellerGroupsResponse
  return data.sellerGroups || data.data || []
}

const saveSellerGroup = async ({
  id,
  payload,
}: {
  id?: number
  payload: SellerGroupFormData
}) => {
  const response = await fetch(`${API_URL}/seller-groups${id ? `/${id}` : ""}`, {
    method: id ? "PATCH" : "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      ...payload,
      group_head_id: payload.group_head_id || null,
      pool_rate: Number(payload.pool_rate),
      seller_ids: payload.seller_ids.map((sellerId) => Number(sellerId)),
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
  if (seller.reports_under_display) return seller.reports_under_display
  if (seller.parent_seller_name) return seller.parent_seller_name
  return "Company / None"
}

const getCommissionSetup = (seller: AccreditedSeller) => {
  if (seller.seller_role === "broker_network_manager") {
    return <>BNM Pool: <span className="font-semibold text-slate-900">{formatRate(seller.commission_pool_rate)}</span></>
  }

  if (seller.seller_role === "broker") {
    return <>Broker Pool: <span className="font-semibold text-slate-900">{formatRate(seller.commission_pool_rate)}</span></>
  }

  if (seller.seller_role === "manager") {
    return <>Manager Rate: <span className="font-semibold text-slate-900">{formatRate(seller.personal_commission_rate || seller.commission_rate)}</span></>
  }

  return (
    <>
      Agent Rate: <span className="font-semibold text-slate-900">{formatRate(seller.personal_commission_rate || seller.commission_rate)}</span>
      <br />
      Direct Developer: <span className="font-semibold text-slate-900">{formatRate(seller.direct_to_developer_rate || seller.personal_commission_rate || seller.commission_rate)}</span>
    </>
  )
}

const AccredittedSellers = () => {
  const queryClient = useQueryClient()
  const [searchInput, setSearchInput] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [groupFormData, setGroupFormData] =
    useState<SellerGroupFormData>(defaultGroupFormData)
  const [editingGroupId, setEditingGroupId] = useState<number | null>(null)
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false)
  const [groupFormError, setGroupFormError] = useState("")

  const {
    data: sellers = [],
    isLoading,
    error,
  } = useQuery<AccreditedSeller[]>({
    queryKey: ["accredited-sellers"],
    queryFn: fetchSellers,
  })

  const {
    data: sellerGroups = [],
    isLoading: isLoadingGroups,
    error: groupError,
  } = useQuery<SellerGroup[]>({
    queryKey: ["seller-groups"],
    queryFn: fetchSellerGroups,
  })

  const sellerGroupMutation = useMutation({
    mutationFn: saveSellerGroup,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["seller-groups"] })
      setEditingGroupId(null)
      setIsGroupModalOpen(false)
      setGroupFormData(defaultGroupFormData)
      setGroupFormError("")
    },
    onError: (mutationError) => {
      setGroupFormError(
        mutationError instanceof Error ? mutationError.message : "Failed to save seller group"
      )
    },
  })

  const activeSellers = useMemo(
    () => sellers.filter((seller) => seller.status === "active"),
    [sellers]
  )

  const filteredSellers = useMemo(() => {
    const searchTerm = searchInput.toLowerCase().trim()

    return sellers.filter((seller) => {
      const matchesSearch = !searchTerm || [
        seller.full_name,
        seller.email,
        seller.contact_no,
        seller.seller_role,
        seller.parent_seller_name,
        seller.reports_under_display,
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
      inactive: sellers.filter((seller) => seller.status !== "active").length,
      bnm: sellers.filter((seller) => seller.seller_role === "broker_network_manager").length,
      brokers: sellers.filter((seller) => seller.seller_role === "broker").length,
      managers: sellers.filter((seller) => seller.seller_role === "manager").length,
      agents: sellers.filter((seller) => seller.seller_role === "agent").length,
    }
  }, [sellers])

  const roleStats = [
    { label: "BNM", value: stats.bnm, role: "Broker Network Manager" },
    { label: "Brokers", value: stats.brokers, role: "Broker group leaders" },
    { label: "Managers", value: stats.managers, role: "Unit managers" },
    { label: "Agents", value: stats.agents, role: "Frontline sellers" },
  ]

  const openAddGroupModal = () => {
    setEditingGroupId(null)
    setGroupFormData(defaultGroupFormData)
    setIsGroupModalOpen(true)
    setGroupFormError("")
  }

  const openEditGroupModal = (group: SellerGroup) => {
    setEditingGroupId(group.id)
    setGroupFormData({
      group_name: group.group_name || "",
      group_type: group.group_type || "broker_group",
      pool_rate: String(group.pool_rate || 10),
      group_head_id: group.group_head_id ? String(group.group_head_id) : "",
      status: group.status || "active",
      remarks: group.remarks || "",
      seller_ids: (group.members || [])
        .filter((member) => member.status === "active")
        .map((member) => String(member.seller_id)),
    })
    setIsGroupModalOpen(true)
    setGroupFormError("")
  }

  const closeGroupModal = () => {
    if (sellerGroupMutation.isPending) return
    setEditingGroupId(null)
    setIsGroupModalOpen(false)
    setGroupFormData(defaultGroupFormData)
    setGroupFormError("")
  }

  const handleSaveGroup = () => {
    if (!groupFormData.group_name.trim()) {
      setGroupFormError("Group name is required")
      return
    }

    sellerGroupMutation.mutate({
      id: editingGroupId || undefined,
      payload: groupFormData,
    })
  }

  return (
    <div className="p-6">
      <PageHeader
        icon={<FiUsers />}
        title="Accredited Sellers"
        subtitle="Read-only seller directory. Edit accounts, basic info, hierarchy, and commission rates in User Management."
      />

      {error ? (
        <Alert
          variant="error"
          title={error instanceof Error ? error.message : "Failed to load sellers"}
        />
      ) : null}

      {groupError ? (
        <Alert
          variant="error"
          title={groupError instanceof Error ? groupError.message : "Failed to load seller groups"}
        />
      ) : null}

      <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1.6fr]">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            icon={<FiUserCheck />}
            label="Total Sellers"
            value={stats.total}
            description="All accredited seller records"
          />
          <StatCard
            icon={<FiUserCheck />}
            label="Active"
            value={stats.active}
            description="Can be assigned to clients"
          />
          <StatCard
            icon={<FiUserCheck />}
            label="Inactive"
            value={stats.inactive}
            description="Hidden from active assignment"
          />
        </div>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
                Role Breakdown
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Count per commission hierarchy level.
              </p>
            </div>
            <div className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-bold text-blue-700">
              {formatNumber(stats.total)} total
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {roleStats.map((item) => (
              <div
                className="rounded-xl border border-slate-100 bg-slate-50 p-4"
                key={item.label}
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {item.label}
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {formatNumber(item.value)}
                </p>
                <p className="mt-1 text-xs text-slate-500">{item.role}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="mb-6 rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Seller Groups</h2>
            <p className="text-sm text-slate-500">
              Manage group pool rates, heads, and active seller membership.
            </p>
          </div>
          <Button icon={<FiPlus />} onClick={openAddGroupModal} variant="primary">
            Add Group
          </Button>
        </div>

        {isLoadingGroups ? (
          <LoadingState label="Loading seller groups..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-200 text-slate-600">
                  <th className="px-4 py-3 text-left">Group</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Pool Rate</th>
                  <th className="px-4 py-3 text-left">Head</th>
                  <th className="px-4 py-3 text-left">Members</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sellerGroups.map((group) => {
                  const activeMembers = (group.members || []).filter(
                    (member) => member.status === "active"
                  )

                  return (
                    <tr key={group.id} className="border-b border-slate-100">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900">{group.group_name}</p>
                        {group.remarks ? (
                          <p className="text-xs text-slate-500">{group.remarks}</p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{formatText(group.group_type)}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {formatRate(group.pool_rate)}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{group.group_head_name || "-"}</td>
                      <td className="px-4 py-3 text-slate-600">
                        <p>{formatNumber(activeMembers.length)} active</p>
                        <p className="max-w-sm truncate text-xs text-slate-500">
                          {activeMembers.map((member) => member.seller_name).join(", ") || "-"}
                        </p>
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={group.status} /></td>
                      <td className="px-4 py-3 text-right">
                        <Button icon={<FiEdit2 />} onClick={() => openEditGroupModal(group)}>
                          Edit
                        </Button>
                      </td>
                    </tr>
                  )
                })}

                {sellerGroups.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <EmptyState
                        title="No seller groups yet"
                        description="Create a group to snapshot pool rates on future reservations."
                      />
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </section>

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
                  {getCommissionSetup(seller)}
                  {seller.rate_updated_at ? (
                    <p className="mt-1 text-xs text-slate-400">
                      Updated {formatDate(seller.rate_updated_at)} by {seller.rate_set_by_name || "system"}
                    </p>
                  ) : null}
                </td>

                <td className="px-4 py-3 text-slate-600">{formatDate(seller.accreditation_date)}</td>

                <td className="px-4 py-3"><StatusBadge status={seller.status} /></td>
              </tr>
            ))}

            {paginatedSellers.length === 0 ? (
              <tr>
                <td colSpan={7}>
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

      {isGroupModalOpen ? (
        <SellerGroupFormModal
          activeSellers={activeSellers}
          error={groupFormError}
          formData={groupFormData}
          isPending={sellerGroupMutation.isPending}
          onClose={closeGroupModal}
          onSave={handleSaveGroup}
          setFormData={setGroupFormData}
          title={editingGroupId ? "Edit Seller Group" : "Add Seller Group"}
        />
      ) : null}
    </div>
  )
}

type SellerGroupFormModalProps = {
  activeSellers: AccreditedSeller[]
  error: string
  formData: SellerGroupFormData
  isPending: boolean
  onClose: () => void
  onSave: () => void
  setFormData: (data: SellerGroupFormData) => void
  title: string
}

const SellerGroupFormModal = ({
  activeSellers,
  error,
  formData,
  isPending,
  onClose,
  onSave,
  setFormData,
  title,
}: SellerGroupFormModalProps) => {
  const selectedSellerIds = new Set(formData.seller_ids)

  const toggleSeller = (sellerId: string) => {
    const nextIds = selectedSellerIds.has(sellerId)
      ? formData.seller_ids.filter((selectedId) => selectedId !== sellerId)
      : [...formData.seller_ids, sellerId]

    setFormData({ ...formData, seller_ids: nextIds })
  }

  return (
    <Modal
      footer={
        <div className="flex justify-end gap-2">
          <Button disabled={isPending} onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={isPending} onClick={onSave} variant="primary">
            {isPending ? "Saving..." : "Save Group"}
          </Button>
        </div>
      }
      onClose={onClose}
      size="lg"
      title={title}
    >
      {error ? <Alert variant="error" title={error} /> : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="space-y-1">
          <span className="text-sm font-semibold text-slate-700">Group Name</span>
          <Input
            value={formData.group_name}
            onChange={(event) => setFormData({ ...formData, group_name: event.target.value })}
          />
        </label>

        <label className="space-y-1">
          <span className="text-sm font-semibold text-slate-700">Group Type</span>
          <Select
            value={formData.group_type}
            onChange={(event) => setFormData({ ...formData, group_type: event.target.value })}
          >
            {sellerGroupTypes.map((groupType) => (
              <option key={groupType} value={groupType}>{formatText(groupType)}</option>
            ))}
          </Select>
        </label>

        <label className="space-y-1">
          <span className="text-sm font-semibold text-slate-700">Pool Rate</span>
          <Select
            value={formData.pool_rate}
            onChange={(event) => setFormData({ ...formData, pool_rate: event.target.value })}
          >
            {poolRateOptions.map((rate) => (
              <option key={rate} value={rate}>{rate}%</option>
            ))}
          </Select>
        </label>

        <label className="space-y-1">
          <span className="text-sm font-semibold text-slate-700">Group Head</span>
          <Select
            value={formData.group_head_id}
            onChange={(event) => setFormData({ ...formData, group_head_id: event.target.value })}
          >
            <option value="">No group head</option>
            {activeSellers.map((seller) => (
              <option key={seller.id} value={seller.id}>
                {seller.full_name} - {formatText(seller.seller_role)}
              </option>
            ))}
          </Select>
        </label>

        <label className="space-y-1">
          <span className="text-sm font-semibold text-slate-700">Status</span>
          <Select
            value={formData.status}
            onChange={(event) => setFormData({ ...formData, status: event.target.value })}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
        </label>

        <label className="space-y-1 md:col-span-2">
          <span className="text-sm font-semibold text-slate-700">Remarks</span>
          <Input
            value={formData.remarks}
            onChange={(event) => setFormData({ ...formData, remarks: event.target.value })}
          />
        </label>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between gap-3">
          <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">
            Members
          </h3>
          <span className="text-xs font-semibold text-slate-500">
            {formatNumber(formData.seller_ids.length)} selected
          </span>
        </div>

        <div className="max-h-72 overflow-y-auto rounded-lg border border-slate-200">
          {activeSellers.map((seller) => (
            <label
              className="flex cursor-pointer items-center justify-between gap-3 border-b border-slate-100 px-3 py-2 last:border-b-0 hover:bg-slate-50"
              key={seller.id}
            >
              <span>
                <span className="block font-semibold text-slate-900">{seller.full_name}</span>
                <span className="text-xs text-slate-500">{formatText(seller.seller_role)}</span>
              </span>
              <input
                checked={selectedSellerIds.has(String(seller.id))}
                className="h-4 w-4 rounded border-slate-300 text-blue-600"
                onChange={() => toggleSeller(String(seller.id))}
                type="checkbox"
              />
            </label>
          ))}

          {activeSellers.length === 0 ? (
            <div className="px-3 py-4 text-sm text-slate-500">
              No active sellers are available.
            </div>
          ) : null}
        </div>
      </div>
    </Modal>
  )
}

export default AccredittedSellers
