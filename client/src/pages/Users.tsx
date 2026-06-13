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
import { formatDate, formatText } from "../utils/formatters"

type User = {
  id: number
  full_name: string
  email: string
  role: string
  status: string
  last_login: string | null
  created_at: string
}

type UsersResponse = { users?: User[]; data?: User[] }

type UserForm = {
  full_name: string
  email: string
  password: string
  role: string
  status: string
}

const roles = ["super_admin", "admin", "treasury", "broker_network_manager", "broker", "manager", "agent", "client"]
const statuses = ["active", "inactive"]

const emptyForm: UserForm = {
  full_name: "",
  email: "",
  password: "",
  role: "agent",
  status: "active",
}

const fetchUsers = async () => {
  const res = await fetch(`${API_URL}/users`, { credentials: "include" })
  if (!res.ok) throw new Error(await getErrorMessage(res))
  const data = (await res.json()) as UsersResponse
  return data.users || data.data || []
}

const saveUser = async ({ id, form }: { id?: number; form: UserForm }) => {
  const res = await fetch(id ? `${API_URL}/users/${id}` : `${API_URL}/users`, {
    method: id ? "PATCH" : "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(form),
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

  const filteredUsers = useMemo(() => {
    const term = search.toLowerCase().trim()
    if (!term) return users
    return users.filter((user) =>
      [user.full_name, user.email, user.role, user.status]
        .join(" ")
        .toLowerCase()
        .includes(term)
    )
  }, [search, users])

  const saveMutation = useMutation({
    mutationFn: saveUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
      setIsOpen(false)
      setEditUser(null)
      setForm(emptyForm)
      setMessage("User saved successfully")
    },
  })

  const deactivateMutation = useMutation({
    mutationFn: deactivateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
      setMessage("User deactivated successfully")
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
      password: "",
      role: user.role,
      status: user.status,
    })
    setIsOpen(true)
  }

  return (
    <div className="p-6">
      <PageHeader
        icon={<FiUserPlus />}
        title="User Management"
        subtitle="Super admin controls system login accounts."
        actions={<Button icon={<FiPlus />} onClick={openAdd} variant="primary">Create User</Button>}
      />

      {message ? <Alert variant="success" title={message} /> : null}
      {error ? <Alert variant="error" title={error instanceof Error ? error.message : "Failed to load users"} /> : null}
      {saveMutation.error ? <Alert variant="error" title={saveMutation.error instanceof Error ? saveMutation.error.message : "Failed to save user"} /> : null}
      {deactivateMutation.error ? <Alert variant="error" title={deactivateMutation.error instanceof Error ? deactivateMutation.error.message : "Failed to deactivate user"} /> : null}

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
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Role</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Last Login</th>
                <th className="px-4 py-3 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr className="border-b border-slate-100" key={user.id}>
                  <td className="px-4 py-3 font-semibold text-slate-900">{user.full_name}</td>
                  <td className="px-4 py-3 text-slate-600">{user.email}</td>
                  <td className="px-4 py-3">{formatText(user.role)}</td>
                  <td className="px-4 py-3"><StatusBadge status={user.status} /></td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(user.last_login)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button onClick={() => openEdit(user)}>Edit</Button>
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
          footer={
            <div className="flex justify-end gap-2">
              <Button onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button disabled={saveMutation.isPending} onClick={() => saveMutation.mutate({ id: editUser?.id, form })} variant="primary">
                {saveMutation.isPending ? "Saving..." : "Save User"}
              </Button>
            </div>
          }
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input label="Full Name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
            <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            <Input label={editUser ? "New Password (optional)" : "Password"} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <Select label="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              {roles.map((role) => <option value={role} key={role}>{formatText(role)}</option>)}
            </Select>
            <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {statuses.map((status) => <option value={status} key={status}>{formatText(status)}</option>)}
            </Select>
          </div>
        </Modal>
      ) : null}
    </div>
  )
}

export default Users
