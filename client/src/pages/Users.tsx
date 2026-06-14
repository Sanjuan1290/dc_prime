import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { FiPlus, FiSearch, FiUserPlus } from "react-icons/fi"
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
import { API_URL, getErrorMessage } from "../utils/api"
import { formatDate, formatNumber, formatText } from "../utils/formatters"

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
  seller_email: string | null
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
  max_downline_rate: number | string | null
  must_change_password?: boolean | number
  temp_password_sent_at?: string | null
  password_changed_at?: string | null
}

type AccreditedSeller = {
  id: number
  full_name: string
  email: string | null
  contact_no: string | null
  seller_role: string
  parent_seller_id: number | null
  parent_seller_name: string | null
  reports_under_display: string | null
  status: string
  commission_pool_rate: number | string | null
  personal_commission_rate: number | string | null
  override_commission_rate: number | string | null
}

type UsersResponse = { users?: User[]; data?: User[] }
type SellersResponse = { accreditedSellers?: AccreditedSeller[]; sellers?: AccreditedSeller[]; data?: AccreditedSeller[] }

type SellerProfileForm = {
  contact_no: string
  accreditation_date: string
  parent_seller_id: string
  commission_pool_rate: string
  personal_commission_rate: string
  override_commission_rate: string
  max_downline_rate: string
}

type UserForm = {
  full_name: string
  email: string
  role: UserRole
  status: string
  seller_profile: SellerProfileForm
}

const roles: UserRole[] = ["super_admin", "admin", "broker_network_manager", "broker", "manager", "agent"]
const sellerRoles: UserRole[] = ["broker_network_manager", "broker", "manager", "agent"]
const statuses = ["active", "inactive"]

const emptySellerProfile: SellerProfileForm = {
  contact_no: "",
  accreditation_date: "",
  parent_seller_id: "",
  commission_pool_rate: "",
  personal_commission_rate: "",
  override_commission_rate: "",
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

const toNumberOrNull = (value: string) => (value === "" ? null : Number(value))

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
      personal_commission_rate: toNumberOrNull(form.seller_profile.personal_commission_rate),
      override_commission_rate: toNumberOrNull(form.seller_profile.override_commission_rate),
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
  if (role === "manager") return "Reports Under Broker"
  if (role === "agent") return "Reports Under Manager"
  return "Reports Under"
}

const getSellerSetupNote = (role: string) => {
  if (role === "broker_network_manager") return "BNM has no parent. Admin sets the BNM pool."
  if (role === "broker") return "Select the BNM if this broker belongs to a network. Leave blank only for company/direct broker."
  if (role === "manager") return "Select only the broker. The BNM is detected from that broker automatically."
  if (role === "agent") return "Select only the manager. The broker and BNM are detected from that manager automatically."
  return ""
}

const sellerProfileFromUser = (user: User): SellerProfileForm => ({
  contact_no: user.seller_contact_no || "",
  accreditation_date: user.accreditation_date ? user.accreditation_date.slice(0, 10) : "",
  parent_seller_id: user.parent_seller_id ? String(user.parent_seller_id) : "",
  commission_pool_rate: user.commission_pool_rate === null || user.commission_pool_rate === undefined ? "" : String(user.commission_pool_rate),
  personal_commission_rate:
    user.personal_commission_rate === null || user.personal_commission_rate === undefined
      ? user.commission_rate === null || user.commission_rate === undefined
        ? ""
        : String(user.commission_rate)
      : String(user.personal_commission_rate),
  override_commission_rate: user.override_commission_rate === null || user.override_commission_rate === undefined ? "" : String(user.override_commission_rate),
  max_downline_rate: user.max_downline_rate === null || user.max_downline_rate === undefined ? "" : String(user.max_downline_rate),
})

const Users = () => {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [form, setForm] = useState<UserForm>(emptyForm)
  const [message, setMessage] = useState("")

  const { data: users = [], isLoading, error } = useQuery<User[]>({
    queryKey: ["users"],
    queryFn: fetchUsers,
  })

  const { data: sellers = [] } = useQuery<AccreditedSeller[]>({
    queryKey: ["accredited-sellers-for-user-management"],
    queryFn: fetchSellers,
  })

  const filteredUsers = useMemo(() => {
    const term = search.toLowerCase().trim()
    if (!term) return users
    return users.filter((user) =>
      [user.full_name, user.email, user.role, user.status, user.seller_full_name, user.parent_seller_name]
        .join(" ")
        .toLowerCase()
        .includes(term)
    )
  }, [search, users])

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
      setForm(emptyForm)
      setMessage(editUser ? "User saved successfully" : "User saved successfully. Temporary password was emailed if SMTP is configured.")
    },
  })

  const deactivateMutation = useMutation({
    mutationFn: deactivateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
      queryClient.invalidateQueries({ queryKey: ["accredited-sellers"] })
      setMessage("User deactivated successfully")
    },
  })

  const resetPasswordMutation = useMutation({
    mutationFn: resetTemporaryPassword,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
      setMessage("Temporary password was reset and emailed if SMTP is configured")
    },
  })

  const openAdd = () => {
    setEditUser(null)
    setForm(emptyForm)
    setIsOpen(true)
  }

  const openEdit = (user: User) => {
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

  const updateForm = (updates: Partial<UserForm>) => {
    setForm((current) => ({ ...current, ...updates }))
  }

  const updateSellerProfile = (updates: Partial<SellerProfileForm>) => {
    setForm((current) => ({
      ...current,
      seller_profile: {
        ...current.seller_profile,
        ...updates,
      },
    }))
  }

  const handleRoleChange = (role: UserRole) => {
    updateForm({
      role,
      seller_profile: {
        ...form.seller_profile,
        parent_seller_id: "",
        commission_pool_rate: ["broker_network_manager", "broker"].includes(role) ? form.seller_profile.commission_pool_rate : "",
        override_commission_rate: role === "manager" ? form.seller_profile.override_commission_rate : "",
      },
    })
  }

  return (
    <div className="p-6">
      <PageHeader
        icon={<FiUserPlus />}
        title="User Management"
        subtitle="Create system accounts. Seller roles automatically create linked accredited seller profiles."
        actions={<Button icon={<FiPlus />} onClick={openAdd} variant="primary">Create User</Button>}
      />

      {message ? <Alert variant="success" title={message} /> : null}
      {error ? <Alert variant="error" title={error instanceof Error ? error.message : "Failed to load users"} /> : null}
      {saveMutation.error ? <Alert variant="error" title={saveMutation.error instanceof Error ? saveMutation.error.message : "Failed to save user"} /> : null}
      {deactivateMutation.error ? <Alert variant="error" title={deactivateMutation.error instanceof Error ? deactivateMutation.error.message : "Failed to deactivate user"} /> : null}
      {resetPasswordMutation.error ? <Alert variant="error" title={resetPasswordMutation.error instanceof Error ? resetPasswordMutation.error.message : "Failed to reset password"} /> : null}

      <div className="mb-4 max-w-md">
        <Input icon={<FiSearch />} placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} />
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
                <th className="px-4 py-3 text-left">Rates</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Last Login</th>
                <th className="px-4 py-3 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
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
                  <td className="px-4 py-3 text-slate-600">
                    <p>Pool: {formatRate(user.commission_pool_rate)}</p>
                    <p>Personal: {formatRate(user.personal_commission_rate || user.commission_rate)}</p>
                    <p>Override: {formatRate(user.override_commission_rate)}</p>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={user.status} />
                    {user.must_change_password ? <p className="mt-1 text-xs font-semibold text-amber-600">Password change required</p> : null}
                    {user.temp_password_sent_at ? <p className="mt-1 text-xs text-slate-400">Temp sent {formatDate(user.temp_password_sent_at)}</p> : null}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(user.last_login)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button onClick={() => openEdit(user)}>Edit</Button>
                      <Button disabled={resetPasswordMutation.isPending} onClick={() => resetPasswordMutation.mutate(user.id)} variant="secondary">Reset Temp Password</Button>
                      <Button disabled={user.status !== "active" || deactivateMutation.isPending} onClick={() => deactivateMutation.mutate(user.id)} variant="danger">Deactivate</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableContainer>
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
              {roles.map((role) => <option value={role} key={role}>{formatText(role)}</option>)}
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
                    {form.role === "broker" ? <option value="">Company / No BNM</option> : <option value="">Select {getParentLabel(form.role).replace("Reports Under ", "")}</option>}
                    {parentOptions.map((seller) => (
                      <option key={seller.id} value={seller.id}>
                        {seller.full_name} {seller.reports_under_display ? `— under ${seller.reports_under_display}` : ""}
                      </option>
                    ))}
                  </Select>
                ) : null}

                {["broker_network_manager", "broker"].includes(form.role) ? (
                  <Input
                    label={form.role === "broker_network_manager" ? "BNM Pool Rate (%)" : "Broker Pool Rate (%)"}
                    type="number"
                    min={0}
                    max={100}
                    step="0.01"
                    value={form.seller_profile.commission_pool_rate}
                    onChange={(e) => updateSellerProfile({ commission_pool_rate: e.target.value })}
                  />
                ) : null}

                {form.role === "manager" ? (
                  <Input
                    label="Manager Override Rate (%)"
                    type="number"
                    min={0}
                    max={100}
                    step="0.01"
                    value={form.seller_profile.override_commission_rate}
                    onChange={(e) => updateSellerProfile({ override_commission_rate: e.target.value })}
                  />
                ) : null}

                <Input
                  label="Personal Commission Rate (%)"
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  value={form.seller_profile.personal_commission_rate}
                  onChange={(e) => updateSellerProfile({ personal_commission_rate: e.target.value })}
                />
              </div>

              {selectedParent ? (
                <div className="mt-4 rounded-lg border border-blue-200 bg-white px-4 py-3 text-sm text-slate-600">
                  <p className="font-semibold text-slate-900">Automatic hierarchy preview</p>
                  <p>
                    {formatText(form.role)} → {selectedParent.full_name} ({formatText(selectedParent.seller_role)})
                    {selectedParent.parent_seller_name ? ` → ${selectedParent.parent_seller_name}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Existing rates: pool {formatRate(selectedParent.commission_pool_rate)}, personal {formatRate(selectedParent.personal_commission_rate)}, override {formatRate(selectedParent.override_commission_rate)}
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}
        </Modal>
      ) : null}
    </div>
  )
}

export default Users
