import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { FiPlus, FiSearch, FiSettings, FiUserPlus } from "react-icons/fi"
import Alert from "../components/ui/Alert"
import Button from "../components/ui/Button"
import EmptyState from "../components/ui/EmptyState"
import Input from "../components/ui/Input"
import LoadingState from "../components/ui/LoadingState"
import Modal from "../components/ui/Modal"
import PageHeader from "../components/ui/PageHeader"
import Select from "../components/ui/Select"
import StatusBadge from "../components/ui/StatusBadge"
import TableContainer from "../components/ui/TableContainer"
import Pagination from "../components/ui/Pagination"
import { API_URL, getErrorMessage } from "../utils/api"
import { formatDate, formatNumber, formatText } from "../utils/formatters"
import useCurrentUser from "../utils/useCurrentUser"

type UserRole = "super_admin" | "admin" | "broker_network_manager" | "broker" | "manager" | "agent"

type User = {
  id: number
  full_name: string
  email: string
  role: UserRole | string
  status: string
  last_login: string | null
  created_at: string
  seller_id: number | null
  seller_full_name: string | null
  seller_contact_no: string | null
  seller_role: string | null
  parent_seller_id: number | null
  parent_seller_name: string | null
  parent_seller_role: string | null
  seller_status: string | null
  accreditation_date: string | null
  commission_rate: number | string | null
  commission_pool_rate: number | string | null
  personal_commission_rate: number | string | null
  override_commission_rate: number | string | null
  direct_to_developer_rate?: number | string | null
  max_downline_rate: number | string | null
  must_change_password?: boolean | number
  temp_password_sent_at?: string | null
}

type AccreditedSeller = {
  id: number
  full_name: string
  seller_role: string
  parent_seller_id: number | null
  parent_seller_name: string | null
  reports_under_display: string | null
  status: string
  commission_pool_rate: number | string | null
  personal_commission_rate: number | string | null
  override_commission_rate: number | string | null
  direct_to_developer_rate?: number | string | null
}

type CurrentUserResponse = {
  user?: {
    role?: string
  }
}

type UsersResponse = { users?: User[]; data?: User[] }
type SellersResponse = { accreditedSellers?: AccreditedSeller[]; sellers?: AccreditedSeller[]; data?: AccreditedSeller[] }

type CommissionDefault = {
  setting_key: string
  label: string
  role: string
  rate_type: string
  default_rate: number | string
}

type DefaultsResponse = {
  defaults?: CommissionDefault[]
  data?: CommissionDefault[]
  defaultsMap?: Record<string, CommissionDefault>
}

type SellerProfileForm = {
  contact_no: string
  accreditation_date: string
  parent_seller_id: string
  commission_pool_rate: string
  manager_rate: string
  agent_commission_rate: string
  max_downline_rate: string
}

type UserForm = {
  full_name: string
  email: string
  role: UserRole
  status: string
  seller_profile: SellerProfileForm
}

type DefaultsForm = {
  bnm_pool_rate: string
  broker_pool_rate: string
}

const allRoles: UserRole[] = ["super_admin", "admin", "broker_network_manager", "broker", "manager", "agent"]
const adminCreatableRoles: UserRole[] = ["broker_network_manager", "broker", "manager", "agent"]
const sellerRoles: UserRole[] = ["broker_network_manager", "broker", "manager", "agent"]
const statuses = ["active", "inactive"]

const defaultDefaultsForm: DefaultsForm = {
  bnm_pool_rate: "8",
  broker_pool_rate: "7",
}

const emptySellerProfile: SellerProfileForm = {
  contact_no: "",
  accreditation_date: "",
  parent_seller_id: "",
  commission_pool_rate: "",
  manager_rate: "",
  agent_commission_rate: "",
  max_downline_rate: "",
}

const emptyForm: UserForm = {
  full_name: "",
  email: "",
  role: "agent",
  status: "active",
  seller_profile: emptySellerProfile,
}

const isSellerRole = (role: string) => sellerRoles.includes(role as UserRole)
const isOfficeRole = (role: string) => ["super_admin", "admin"].includes(String(role))
const toNumberOrNull = (value: string) => (value === "" ? null : Number(value))

const fetchUsers = async () => {
  const res = await fetch(`${API_URL}/users`, { credentials: "include" })
  if (!res.ok) throw new Error(await getErrorMessage(res))
  const data = (await res.json()) as UsersResponse
  return data.users || data.data || []
}

const fetchSellers = async () => {
  const res = await fetch(`${API_URL}/accredited-sellers`, { credentials: "include" })
  if (!res.ok) throw new Error(await getErrorMessage(res))
  const data = (await res.json()) as SellersResponse
  return data.accreditedSellers || data.sellers || data.data || []
}

const fetchDefaults = async () => {
  const res = await fetch(`${API_URL}/commission-role-defaults`, { credentials: "include" })
  if (!res.ok) throw new Error(await getErrorMessage(res))
  const data = (await res.json()) as DefaultsResponse
  return data.defaults || data.data || []
}

const getDefaultsFormFromRows = (rows: CommissionDefault[]): DefaultsForm => {
  const next = { ...defaultDefaultsForm }
  rows.forEach((row) => {
    if (row.setting_key in next) {
      next[row.setting_key as keyof DefaultsForm] = String(row.default_rate ?? "")
    }
  })
  return next
}

const getDefaultForRole = (role: UserRole, defaults: DefaultsForm): Partial<SellerProfileForm> => {
  if (role === "broker_network_manager") return { commission_pool_rate: defaults.bnm_pool_rate }
  if (role === "broker") return { commission_pool_rate: defaults.broker_pool_rate }
  if (role === "manager") return {}
  if (role === "agent") return {}
  return {}
}

const getPayload = (form: UserForm) => {
  const payload: Record<string, unknown> = {
    full_name: form.full_name.trim(),
    email: form.email.trim(),
    role: form.role,
    status: form.status,
  }

  if (isSellerRole(form.role)) {
    payload.seller_profile = {
      full_name: form.full_name.trim(),
      email: form.email.trim(),
      contact_no: form.seller_profile.contact_no.trim() || null,
      accreditation_date: form.seller_profile.accreditation_date || null,
      parent_seller_id: form.seller_profile.parent_seller_id || null,
      commission_pool_rate: toNumberOrNull(form.seller_profile.commission_pool_rate),
      manager_rate: toNumberOrNull(form.seller_profile.manager_rate),
      agent_commission_rate: toNumberOrNull(form.seller_profile.agent_commission_rate),
      personal_commission_rate: form.role === "manager"
        ? toNumberOrNull(form.seller_profile.manager_rate)
        : toNumberOrNull(form.seller_profile.agent_commission_rate),
      direct_to_developer_rate: form.role === "agent"
        ? toNumberOrNull(form.seller_profile.agent_commission_rate)
        : null,
      max_downline_rate: toNumberOrNull(form.seller_profile.max_downline_rate),
      status: form.status,
    }
  }

  return payload
}

const saveUser = async ({ id, form }: { id?: number; form: UserForm }) => {
  const res = await fetch(id ? `${API_URL}/users/${id}` : `${API_URL}/users`, {
    method: id ? "PATCH" : "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(getPayload(form)),
  })
  if (!res.ok) throw new Error(await getErrorMessage(res))
  return res.json()
}

const saveDefaults = async (defaults: DefaultsForm) => {
  const res = await fetch(`${API_URL}/commission-role-defaults`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ defaults }),
  })
  if (!res.ok) throw new Error(await getErrorMessage(res))
  return res.json()
}

const resetTemporaryPassword = async (id: number) => {
  const res = await fetch(`${API_URL}/users/${id}/reset-temporary-password`, {
    method: "PATCH",
    credentials: "include",
  })
  if (!res.ok) throw new Error(await getErrorMessage(res))
  return res.json()
}

const deactivateUser = async (id: number) => {
  const res = await fetch(`${API_URL}/users/${id}`, {
    method: "DELETE",
    credentials: "include",
  })
  if (!res.ok) throw new Error(await getErrorMessage(res))
}

const formatRate = (rate: number | string | null | undefined) => {
  if (rate === null || rate === undefined || rate === "") return "-"
  return `${formatNumber(rate)}%`
}

const getParentOptions = (role: string, sellers: AccreditedSeller[]) => {
  if (role === "broker") return sellers.filter((seller) => seller.seller_role === "broker_network_manager" && seller.status === "active")
  if (role === "manager") return sellers.filter((seller) => seller.seller_role === "broker" && seller.status === "active")
  if (role === "agent") return sellers.filter((seller) => seller.seller_role === "manager" && seller.status === "active")
  return []
}

const getParentLabel = (role: string) => {
  if (role === "broker") return "Reports Under Broker Network Manager"
  if (role === "manager") return "Reports Under Broker (optional)"
  if (role === "agent") return "Reports Under Manager"
  return "Reports Under"
}

const getSellerSetupNote = (role: string) => {
  if (role === "broker_network_manager") return "BNM has no parent. Only the BNM pool rate is needed."
  if (role === "broker") return "Select BNM only if this broker belongs to a network. Independent brokers can stay Company / No BNM."
  if (role === "manager") return "Reports Under is optional. Leave it blank for a company/direct-to-developer manager. If under a broker, manager rate cannot exceed the broker pool."
  if (role === "agent") return "Reports Under Manager is required. Agent rate cannot exceed the manager rate. Direct-to-developer creates no override release."
  return ""
}

const sellerProfileFromUser = (user: User): SellerProfileForm => ({
  contact_no: user.seller_contact_no || "",
  accreditation_date: user.accreditation_date ? user.accreditation_date.slice(0, 10) : "",
  parent_seller_id: user.parent_seller_id ? String(user.parent_seller_id) : "",
  commission_pool_rate: user.commission_pool_rate === null || user.commission_pool_rate === undefined ? "" : String(user.commission_pool_rate),
  manager_rate: user.role === "manager"
    ? user.personal_commission_rate === null || user.personal_commission_rate === undefined
      ? user.commission_rate === null || user.commission_rate === undefined
        ? ""
        : String(user.commission_rate)
      : String(user.personal_commission_rate)
    : "",
  agent_commission_rate: user.role === "agent"
    ? user.personal_commission_rate === null || user.personal_commission_rate === undefined
      ? user.commission_rate === null || user.commission_rate === undefined
        ? ""
        : String(user.commission_rate)
      : String(user.personal_commission_rate)
    : "",
  max_downline_rate: user.max_downline_rate === null || user.max_downline_rate === undefined ? "" : String(user.max_downline_rate),
})

const Users = () => {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [isDefaultsOpen, setIsDefaultsOpen] = useState(false)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [form, setForm] = useState<UserForm>(emptyForm)
  const [defaultsForm, setDefaultsForm] = useState<DefaultsForm>(defaultDefaultsForm)
  const [message, setMessage] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sellerProfileFilter, setSellerProfileFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const { data: currentUserData } = useCurrentUser()
  const currentUser = (currentUserData as CurrentUserResponse | null)?.user
  const canEditDefaults = currentUser?.role === "super_admin"
  const availableRoles = canEditDefaults ? allRoles : adminCreatableRoles

  const { data: users = [], isLoading, error } = useQuery<User[]>({
    queryKey: ["users"],
    queryFn: fetchUsers,
  })

  const { data: sellers = [] } = useQuery<AccreditedSeller[]>({
    queryKey: ["accredited-sellers-for-user-management"],
    queryFn: fetchSellers,
  })

  const { data: defaults = [] } = useQuery<CommissionDefault[]>({
    queryKey: ["commission-role-defaults"],
    queryFn: fetchDefaults,
  })

  useEffect(() => {
    setDefaultsForm(getDefaultsFormFromRows(defaults))
  }, [defaults])

  const filteredUsers = useMemo(() => {
    const term = search.toLowerCase().trim()

    return users.filter((user) => {
      const matchesSearch = !term || [
        user.full_name,
        user.email,
        user.role,
        user.status,
        user.seller_full_name,
        user.parent_seller_name,
        user.seller_role,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term)

      const matchesRole = roleFilter === "all" || String(user.role) === roleFilter
      const matchesStatus = statusFilter === "all" || String(user.status) === statusFilter
      const matchesSellerProfile =
        sellerProfileFilter === "all" ||
        (sellerProfileFilter === "linked" && Boolean(user.seller_id)) ||
        (sellerProfileFilter === "unlinked" && !user.seller_id)

      return matchesSearch && matchesRole && matchesStatus && matchesSellerProfile
    })
  }, [roleFilter, search, sellerProfileFilter, statusFilter, users])

  const paginatedUsers = useMemo(
    () => filteredUsers.slice((page - 1) * rowsPerPage, page * rowsPerPage),
    [filteredUsers, page, rowsPerPage]
  )

  const parentOptions = useMemo(() => getParentOptions(form.role, sellers), [form.role, sellers])

  const selectedParent = useMemo(() => {
    if (!form.seller_profile.parent_seller_id) return null
    return sellers.find((seller) => String(seller.id) === form.seller_profile.parent_seller_id) || null
  }, [form.seller_profile.parent_seller_id, sellers])

  const saveMutation = useMutation({
    mutationFn: saveUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
      queryClient.invalidateQueries({ queryKey: ["accredited-sellers-for-user-management"] })
      queryClient.invalidateQueries({ queryKey: ["accredited-sellers"] })
      setIsOpen(false)
      setEditUser(null)
      setMessage("User saved successfully. Temporary password was emailed for new users.")
    },
  })

  const defaultsMutation = useMutation({
    mutationFn: saveDefaults,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commission-role-defaults"] })
      setIsDefaultsOpen(false)
      setMessage("Default commission rates updated successfully.")
    },
  })

  const resetPasswordMutation = useMutation({
    mutationFn: resetTemporaryPassword,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
      setMessage("Temporary password reset and emailed.")
    },
  })

  const deactivateMutation = useMutation({
    mutationFn: deactivateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
      setMessage("User deactivated successfully.")
    },
  })

  const updateForm = (values: Partial<UserForm>) => setForm((prev) => ({ ...prev, ...values }))
  const updateSellerProfile = (values: Partial<SellerProfileForm>) =>
    setForm((prev) => ({
      ...prev,
      seller_profile: { ...prev.seller_profile, ...values },
    }))

  const handleRoleChange = (role: UserRole) => {
    const defaultsForRole = getDefaultForRole(role, defaultsForm)
    setForm((prev) => ({
      ...prev,
      role,
      seller_profile: {
        ...emptySellerProfile,
        ...defaultsForRole,
      },
    }))
  }

  const openCreate = () => {
    const role = canEditDefaults ? "admin" : "agent"
    setEditUser(null)
    setForm({
      ...emptyForm,
      role,
      seller_profile: {
        ...emptySellerProfile,
        ...getDefaultForRole(role, defaultsForm),
      },
    })
    setIsOpen(true)
  }

  const openEdit = (user: User) => {
    if (!canEditDefaults && ["super_admin", "admin"].includes(String(user.role))) {
      setMessage("Only super admin can edit admin or super admin accounts.")
      return
    }

    setEditUser(user)
    setForm({
      full_name: user.full_name,
      email: user.email,
      role: user.role as UserRole,
      status: user.status,
      seller_profile: sellerProfileFromUser(user),
    })
    setIsOpen(true)
  }

  const canResetOrDeactivateUser = (user: User) => canEditDefaults || !isOfficeRole(String(user.role))

  const handleResetPassword = (user: User) => {
    if (!canResetOrDeactivateUser(user)) {
      setMessage("Only super admin can reset another admin or super admin password.")
      return
    }

    const confirmed = window.confirm(
      `Are you sure you want to reset the password for ${user.full_name}? A new temporary password will be emailed and the user must change it on first login.`
    )

    if (confirmed) {
      resetPasswordMutation.mutate(user.id)
    }
  }

  const handleDeactivate = (user: User) => {
    if (!canResetOrDeactivateUser(user)) {
      setMessage("Only super admin can deactivate admin or super admin accounts.")
      return
    }

    const confirmed = window.confirm(
      `Are you sure you want to deactivate ${user.full_name}? They will no longer be able to login.`
    )

    if (confirmed) {
      deactivateMutation.mutate(user.id)
    }
  }

  const rateSummary = (user: User) => {
    if (user.role === "broker_network_manager") return `BNM Pool: ${formatRate(user.commission_pool_rate)}`
    if (user.role === "broker") return `Broker Pool: ${formatRate(user.commission_pool_rate)}`
    if (user.role === "manager") return `Manager Rate: ${formatRate(user.personal_commission_rate || user.commission_rate)}`
    if (user.role === "agent") {
      return `Agent Rate: ${formatRate(user.personal_commission_rate || user.commission_rate)}`
    }
    return "-"
  }

  return (
    <div className="p-6">
      <PageHeader
        icon={<FiUserPlus />}
        title="User Management"
        subtitle="Create accounts, link seller profiles, and set hierarchy rates."
        actions={
          <div className="flex flex-wrap gap-2">
            {canEditDefaults ? (
              <Button icon={<FiSettings />} onClick={() => setIsDefaultsOpen(true)} variant="secondary">
                Commission Defaults
              </Button>
            ) : null}
            <Button icon={<FiPlus />} onClick={openCreate} variant="primary">
              Create User
            </Button>
          </div>
        }
      />

      {message ? <Alert variant="success" title={message} /> : null}
      {error ? <Alert variant="error" title={error instanceof Error ? error.message : "Failed to load users"} /> : null}
      {saveMutation.error ? <Alert variant="error" title={saveMutation.error instanceof Error ? saveMutation.error.message : "Failed to save user"} /> : null}
      {deactivateMutation.error ? <Alert variant="error" title={deactivateMutation.error instanceof Error ? deactivateMutation.error.message : "Failed to deactivate user"} /> : null}
      {resetPasswordMutation.error ? <Alert variant="error" title={resetPasswordMutation.error instanceof Error ? resetPasswordMutation.error.message : "Failed to reset password"} /> : null}
      {defaultsMutation.error ? <Alert variant="error" title={defaultsMutation.error instanceof Error ? defaultsMutation.error.message : "Failed to save defaults"} /> : null}

      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-[1fr_220px_220px_220px]">
        <Input
          icon={<FiSearch />}
          placeholder="Search users, email, seller, or parent..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
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
          <option value="all">All roles</option>
          {allRoles.map((role) => (
            <option key={role} value={role}>{formatText(role)}</option>
          ))}
        </Select>

        <Select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value)
            setPage(1)
          }}
        >
          <option value="all">All statuses</option>
          {statuses.map((status) => (
            <option key={status} value={status}>{formatText(status)}</option>
          ))}
        </Select>

        <Select
          value={sellerProfileFilter}
          onChange={(e) => {
            setSellerProfileFilter(e.target.value)
            setPage(1)
          }}
        >
          <option value="all">All profiles</option>
          <option value="linked">With seller profile</option>
          <option value="unlinked">No seller profile</option>
        </Select>
      </div>

      {isLoading ? <LoadingState label="Loading users..." /> : null}
      {!isLoading && filteredUsers.length === 0 ? <EmptyState title="No users found" /> : null}

      {filteredUsers.length > 0 ? (
        <TableContainer>
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="border-b border-slate-200">
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Role</th>
                <th className="px-4 py-3 text-left">Seller Profile</th>
                <th className="px-4 py-3 text-left">Reports Under</th>
                <th className="px-4 py-3 text-left">Commission Setup</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Last Login</th>
                <th className="px-4 py-3 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.map((user) => (
                <tr className="border-b border-slate-100" key={user.id}>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900">{user.full_name}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{formatText(user.role)}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {user.seller_id ? (
                      <>
                        <p className="font-medium text-slate-900">{user.seller_full_name || user.full_name}</p>
                        <p className="text-xs text-slate-500">Seller ID #{user.seller_id}</p>
                      </>
                    ) : (
                      <span>-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {user.parent_seller_name ? (
                      <>
                        <p>{user.parent_seller_name}</p>
                        <p className="text-xs text-slate-500">{formatText(user.parent_seller_role || "")}</p>
                      </>
                    ) : isSellerRole(user.role) ? "Company / None" : "-"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{rateSummary(user)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={user.status} />
                    {user.must_change_password ? <p className="mt-1 text-xs font-semibold text-amber-600">Password change required</p> : null}
                    {user.temp_password_sent_at ? <p className="mt-1 text-xs text-slate-400">Temp sent {formatDate(user.temp_password_sent_at)}</p> : null}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(user.last_login)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button onClick={() => openEdit(user)}>Edit</Button>
                      {canResetOrDeactivateUser(user) ? (
                        <>
                          <Button disabled={resetPasswordMutation.isPending} onClick={() => handleResetPassword(user)} variant="secondary">Reset Temp Password</Button>
                          <Button disabled={user.status !== "active" || deactivateMutation.isPending} onClick={() => handleDeactivate(user)} variant="danger">Deactivate</Button>
                        </>
                      ) : (
                        <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500">Super admin only</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableContainer>
      ) : null}

      {filteredUsers.length > 0 ? (
        <Pagination
          page={page}
          rowsPerPage={rowsPerPage}
          totalRows={filteredUsers.length}
          onPageChange={setPage}
          onRowsPerPageChange={(nextRowsPerPage) => {
            setRowsPerPage(nextRowsPerPage)
            setPage(1)
          }}
        />
      ) : null}

      {isOpen ? (
        <Modal
          title={editUser ? "Edit User" : "Create User"}
          onClose={() => setIsOpen(false)}
          size="lg"
          footer={
            <div className="flex justify-end gap-2">
              <Button onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button disabled={saveMutation.isPending} onClick={() => saveMutation.mutate({ id: editUser?.id, form })} variant="primary">
                {saveMutation.isPending ? "Saving..." : "Save User"}
              </Button>
            </div>
          }
        >
          {!editUser ? (
            <Alert variant="info" title="A temporary password will be generated and emailed to this user. They must change it on first login." />
          ) : null}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input label="Full Name" value={form.full_name} onChange={(e) => updateForm({ full_name: e.target.value })} required />
            <Input label="Email" type="email" value={form.email} onChange={(e) => updateForm({ email: e.target.value })} required />
            <Select label="Role" value={form.role} onChange={(e) => handleRoleChange(e.target.value as UserRole)}>
              {availableRoles.map((role) => <option value={role} key={role}>{formatText(role)}</option>)}
            </Select>
            <Select label="Status" value={form.status} onChange={(e) => updateForm({ status: e.target.value })}>
              {statuses.map((status) => <option value={status} key={status}>{formatText(status)}</option>)}
            </Select>
          </div>

          {isSellerRole(form.role) ? (
            <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-4">
              <div className="mb-4">
                <h3 className="text-base font-bold text-slate-900">Seller Profile Setup</h3>
                <p className="mt-1 text-sm text-slate-600">{getSellerSetupNote(form.role)}</p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Input label="Seller Contact No." value={form.seller_profile.contact_no} onChange={(e) => updateSellerProfile({ contact_no: e.target.value })} />
                <Input label="Accreditation Date" type="date" value={form.seller_profile.accreditation_date} onChange={(e) => updateSellerProfile({ accreditation_date: e.target.value })} />

                {form.role !== "broker_network_manager" ? (
                  <Select label={getParentLabel(form.role)} value={form.seller_profile.parent_seller_id} onChange={(e) => updateSellerProfile({ parent_seller_id: e.target.value })}>
                    {form.role === "broker" ? (
                      <option value="">Company / No BNM</option>
                    ) : form.role === "manager" ? (
                      <option value="">Company / Direct to Developer</option>
                    ) : (
                      <option value="">Select Manager</option>
                    )}
                    {parentOptions.map((seller) => (
                      <option key={seller.id} value={seller.id}>
                        {seller.full_name} {seller.reports_under_display ? `— under ${seller.reports_under_display}` : ""}
                      </option>
                    ))}
                  </Select>
                ) : null}

                {form.role === "broker_network_manager" ? (
                  <Input label="BNM Pool Rate (%)" type="number" min={0} max={100} step="0.01" value={form.seller_profile.commission_pool_rate} onChange={(e) => updateSellerProfile({ commission_pool_rate: e.target.value })} />
                ) : null}

                {form.role === "broker" ? (
                  <Input label="Broker Pool Rate (%)" type="number" min={0} max={100} step="0.01" value={form.seller_profile.commission_pool_rate} onChange={(e) => updateSellerProfile({ commission_pool_rate: e.target.value })} />
                ) : null}

                {form.role === "manager" ? (
                  <Input label="Manager Rate (%)" type="number" min={0} max={100} step="0.01" value={form.seller_profile.manager_rate} onChange={(e) => updateSellerProfile({ manager_rate: e.target.value })} />
                ) : null}

                {form.role === "agent" ? (
                  <Input label="Agent Rate (%)" type="number" min={0} max={100} step="0.01" value={form.seller_profile.agent_commission_rate} onChange={(e) => updateSellerProfile({ agent_commission_rate: e.target.value })} />
                ) : null}
              </div>

              {selectedParent ? (
                <div className="mt-4 rounded-lg border border-blue-200 bg-white px-4 py-3 text-sm text-slate-600">
                  <p className="font-semibold text-slate-900">Automatic hierarchy preview</p>
                  <p>
                    {formatText(form.role)} → {selectedParent.full_name} ({formatText(selectedParent.seller_role)})
                    {selectedParent.parent_seller_name ? ` → ${selectedParent.parent_seller_name}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Parent rates: pool {formatRate(selectedParent.commission_pool_rate)}, assigned rate {formatRate(selectedParent.personal_commission_rate || selectedParent.commission_pool_rate)}
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}
        </Modal>
      ) : null}

      {isDefaultsOpen ? (
        <Modal
          title="Default Commission Rates"
          onClose={() => setIsDefaultsOpen(false)}
          size="lg"
          footer={
            <div className="flex justify-end gap-2">
              <Button onClick={() => setIsDefaultsOpen(false)}>Cancel</Button>
              <Button disabled={defaultsMutation.isPending} onClick={() => defaultsMutation.mutate(defaultsForm)} variant="primary">
                {defaultsMutation.isPending ? "Saving..." : "Save Defaults"}
              </Button>
            </div>
          }
        >
          <Alert variant="warning" title="Only super admin can update default rates. Only BNM and Broker have system defaults. Manager and Agent rates are assigned by their upline or edited per account." />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input label="Default BNM Pool Rate (%)" type="number" min={0} max={100} step="0.01" value={defaultsForm.bnm_pool_rate} onChange={(e) => setDefaultsForm({ ...defaultsForm, bnm_pool_rate: e.target.value })} />
            <Input label="Default Broker Pool Rate (%)" type="number" min={0} max={100} step="0.01" value={defaultsForm.broker_pool_rate} onChange={(e) => setDefaultsForm({ ...defaultsForm, broker_pool_rate: e.target.value })} />
          </div>
        </Modal>
      ) : null}
    </div>
  )
}

export default Users
