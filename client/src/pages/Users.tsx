import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { FiEdit2, FiPlus, FiSearch, FiSettings, FiUserPlus, FiUsers } from "react-icons/fi"
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
  seller_group_id: number | null
  seller_group_name: string | null
  seller_group_pool_rate: number | string | null
  seller_group_closing_seller_rate?: number | string | null
  seller_group_bnm_override_rate?: number | string | null
  seller_group_broker_override_rate?: number | string | null
  seller_group_manager_override_rate?: number | string | null
  seller_group_role_rate: number | string | null
  seller_group_status: string | null
  commission_rate: number | string | null
  commission_pool_rate: number | string | null
  personal_commission_rate: number | string | null
  direct_to_developer_rate?: number | string | null
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
  seller_group_id?: number | null
  seller_group_name?: string | null
  seller_group_pool_rate?: number | string | null
  seller_group_closing_seller_rate?: number | string | null
  seller_group_bnm_override_rate?: number | string | null
  seller_group_broker_override_rate?: number | string | null
  seller_group_manager_override_rate?: number | string | null
  seller_group_role_rate?: number | string | null
}

type SaleSplitRole = "broker_network_manager" | "broker" | "manager" | "agent"

type SaleSplit = Partial<Record<SaleSplitRole, number | string | null>>

type SaleSplitForm = Record<SaleSplitRole, string>

type SellerGroupDistribution = {
  seller_group_id?: number
  seller_role: string
  requested_rate: number | string | null
  approved_rate: number | string | null
  status?: string
  remarks?: string | null
}

type SellerGroup = {
  id: number
  group_name: string
  group_code: string | null
  pool_rate: number | string
  closing_seller_rate: number | string
  bnm_override_rate: number | string
  broker_override_rate: number | string
  manager_override_rate: number | string
  agent_sale_split_json?: SaleSplit | string | null
  manager_sale_split_json?: SaleSplit | string | null
  broker_sale_split_json?: SaleSplit | string | null
  bnm_sale_split_json?: SaleSplit | string | null
  rollover_policy?: string | null
  group_head_seller_id: number | null
  group_head_name: string | null
  status: string
  notes: string | null
  active_member_count: number | string
  bnm_count: number | string
  broker_count: number | string
  manager_count: number | string
  agent_count: number | string
  distribution: SellerGroupDistribution[]
}

type CurrentUserResponse = {
  user?: {
    role?: string
  }
}

type UsersResponse = { users?: User[]; data?: User[] }
type SellersResponse = { accreditedSellers?: AccreditedSeller[]; sellers?: AccreditedSeller[]; data?: AccreditedSeller[] }
type GroupsResponse = { groups?: SellerGroup[]; data?: SellerGroup[] }

type SellerProfileForm = {
  contact_no: string
  accreditation_date: string
  parent_seller_id: string
  seller_group_id: string
}

type UserForm = {
  full_name: string
  email: string
  role: UserRole
  status: string
  seller_profile: SellerProfileForm
}

type SellerGroupForm = {
  group_name: string
  group_code: string
  pool_rate: string
  closing_seller_rate: string
  bnm_override_rate: string
  broker_override_rate: string
  manager_override_rate: string
  agent_sale_split: SaleSplitForm
  manager_sale_split: SaleSplitForm
  broker_sale_split: SaleSplitForm
  bnm_sale_split: SaleSplitForm
  group_head_seller_id: string
  status: string
  notes: string
}

const allRoles: UserRole[] = ["super_admin", "admin", "broker_network_manager", "broker", "manager", "agent"]
const adminCreatableRoles: UserRole[] = ["broker_network_manager", "broker", "manager", "agent"]
const sellerRoles: UserRole[] = ["broker_network_manager", "broker", "manager", "agent"]
const statuses = ["active", "inactive"]

const saleSplitSections: Array<{
  key: "agent_sale_split" | "manager_sale_split" | "broker_sale_split" | "bnm_sale_split"
  payloadKey: "agent_sale_split" | "manager_sale_split" | "broker_sale_split" | "bnm_sale_split"
  label: string
  description: string
  roles: Array<{ key: SaleSplitRole; label: string }>
}> = [
  {
    key: "agent_sale_split",
    payloadKey: "agent_sale_split",
    label: "Agent sale",
    description: "Agent closed the sale. Edit exact allocation for BNM, Broker, Manager, and Agent.",
    roles: [
      { key: "broker_network_manager", label: "BNM" },
      { key: "broker", label: "Broker" },
      { key: "manager", label: "Manager" },
      { key: "agent", label: "Agent" },
    ],
  },
  {
    key: "manager_sale_split",
    payloadKey: "manager_sale_split",
    label: "Manager sale",
    description: "Manager personally closed the sale. Edit BNM, Broker, and Manager split.",
    roles: [
      { key: "broker_network_manager", label: "BNM" },
      { key: "broker", label: "Broker" },
      { key: "manager", label: "Manager" },
    ],
  },
  {
    key: "broker_sale_split",
    payloadKey: "broker_sale_split",
    label: "Broker sale",
    description: "Broker personally closed the sale. Edit BNM and Broker split.",
    roles: [
      { key: "broker_network_manager", label: "BNM" },
      { key: "broker", label: "Broker" },
    ],
  },
  {
    key: "bnm_sale_split",
    payloadKey: "bnm_sale_split",
    label: "BNM sale",
    description: "BNM personally closed the sale.",
    roles: [
      { key: "broker_network_manager", label: "BNM" },
    ],
  },
]

const emptySellerProfile: SellerProfileForm = {
  contact_no: "",
  accreditation_date: "",
  parent_seller_id: "",
  seller_group_id: "",
}

const emptyForm: UserForm = {
  full_name: "",
  email: "",
  role: "agent",
  status: "active",
  seller_profile: emptySellerProfile,
}

const blankSaleSplit = (): SaleSplitForm => ({
  broker_network_manager: "0",
  broker: "0",
  manager: "0",
  agent: "0",
})

const defaultSaleSplits = {
  agent_sale_split: {
    broker_network_manager: "1",
    broker: "1",
    manager: "1",
    agent: "5",
  },
  manager_sale_split: {
    broker_network_manager: "1",
    broker: "2",
    manager: "5",
    agent: "0",
  },
  broker_sale_split: {
    broker_network_manager: "3",
    broker: "5",
    manager: "0",
    agent: "0",
  },
  bnm_sale_split: {
    broker_network_manager: "8",
    broker: "0",
    manager: "0",
    agent: "0",
  },
} satisfies Record<string, SaleSplitForm>

const emptyGroupForm: SellerGroupForm = {
  group_name: "",
  group_code: "",
  pool_rate: "8",
  closing_seller_rate: "5",
  bnm_override_rate: "1",
  broker_override_rate: "1",
  manager_override_rate: "1",
  agent_sale_split: { ...defaultSaleSplits.agent_sale_split },
  manager_sale_split: { ...defaultSaleSplits.manager_sale_split },
  broker_sale_split: { ...defaultSaleSplits.broker_sale_split },
  bnm_sale_split: { ...defaultSaleSplits.bnm_sale_split },
  group_head_seller_id: "",
  status: "active",
  notes: "",
}

const isSellerRole = (role: string) => sellerRoles.includes(role as UserRole)
const isOfficeRole = (role: string) => ["super_admin", "admin"].includes(String(role))

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

const fetchSellerGroups = async () => {
  const res = await fetch(`${API_URL}/seller-groups`, { credentials: "include" })
  if (!res.ok) throw new Error(await getErrorMessage(res))
  const data = (await res.json()) as GroupsResponse
  return data.groups || data.data || []
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
      seller_group_id: form.seller_profile.seller_group_id || null,
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

const saveSellerGroup = async ({ id, form }: { id?: number; form: SellerGroupForm }) => {
  const res = await fetch(id ? `${API_URL}/seller-groups/${id}` : `${API_URL}/seller-groups`, {
    method: id ? "PATCH" : "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      group_name: form.group_name.trim(),
      group_code: form.group_code.trim() || null,
      pool_rate: Number(form.pool_rate || 0),
      closing_seller_rate: Number(form.agent_sale_split.agent || form.closing_seller_rate || 0),
      bnm_override_rate: Number(form.agent_sale_split.broker_network_manager || form.bnm_override_rate || 0),
      broker_override_rate: Number(form.agent_sale_split.broker || form.broker_override_rate || 0),
      manager_override_rate: Number(form.agent_sale_split.manager || form.manager_override_rate || 0),
      agent_sale_split: getSplitPayload(form.agent_sale_split, saleSplitSections[0].roles.map((role) => role.key)),
      manager_sale_split: getSplitPayload(form.manager_sale_split, saleSplitSections[1].roles.map((role) => role.key)),
      broker_sale_split: getSplitPayload(form.broker_sale_split, saleSplitSections[2].roles.map((role) => role.key)),
      bnm_sale_split: getSplitPayload(form.bnm_sale_split, saleSplitSections[3].roles.map((role) => role.key)),
      rollover_policy: "custom_sale_type_splits",
      group_head_seller_id: form.group_head_seller_id || null,
      status: form.status,
      notes: form.notes.trim() || null,
    }),
  })
  if (!res.ok) throw new Error(await getErrorMessage(res))
  return res.json()
}

const recalculateSellerGroup = async (id: number) => {
  const res = await fetch(`${API_URL}/seller-groups/${id}/recalculate-members`, {
    method: "POST",
    credentials: "include",
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
  if (role === "broker_network_manager") return "Select a seller group. Closing and override rates are inherited from the group, not edited on this account."
  if (role === "broker") return "If you select a BNM, this broker inherits the BNM's seller group. Independent brokers may select a group manually."
  if (role === "manager") return "If you select a broker, this manager inherits that broker's seller group. Direct-to-developer managers may select a group manually."
  if (role === "agent") return "Select the manager. The agent automatically inherits that manager's seller group and closing seller rate."
  return ""
}

const sellerProfileFromUser = (user: User): SellerProfileForm => ({
  contact_no: user.seller_contact_no || "",
  accreditation_date: user.accreditation_date ? user.accreditation_date.slice(0, 10) : "",
  parent_seller_id: user.parent_seller_id ? String(user.parent_seller_id) : "",
  seller_group_id: user.seller_group_id ? String(user.seller_group_id) : "",
})

const parseGroupSplit = (value: SaleSplit | string | null | undefined, fallback: SaleSplitForm) => {
  const normalized = { ...blankSaleSplit(), ...fallback }

  if (!value) return normalized

  let parsed: SaleSplit | null = null

  if (typeof value === "string") {
    try {
      parsed = JSON.parse(value) as SaleSplit
    } catch {
      parsed = null
    }
  } else {
    parsed = value
  }

  if (!parsed || typeof parsed !== "object") return normalized

  for (const role of Object.keys(normalized) as SaleSplitRole[]) {
    const rawValue = parsed[role]
    if (rawValue !== null && rawValue !== undefined && rawValue !== "") {
      normalized[role] = String(rawValue)
    }
  }

  return normalized
}

const getSplitPayload = (split: SaleSplitForm, roles: SaleSplitRole[]) => {
  return roles.reduce<Record<string, number>>((payload, role) => {
    payload[role] = Number(split[role] || 0)
    return payload
  }, {})
}

const getSplitTotal = (split: SaleSplitForm, roles: SaleSplitRole[]) => {
  return roles.reduce((total, role) => total + Number(split[role] || 0), 0)
}

const groupFormFromGroup = (group: SellerGroup): SellerGroupForm => ({
  group_name: group.group_name || "",
  group_code: group.group_code || "",
  pool_rate: String(group.pool_rate ?? "0"),
  closing_seller_rate: String(group.closing_seller_rate ?? "5"),
  bnm_override_rate: String(group.bnm_override_rate ?? "1"),
  broker_override_rate: String(group.broker_override_rate ?? "1"),
  manager_override_rate: String(group.manager_override_rate ?? "1"),
  agent_sale_split: parseGroupSplit(group.agent_sale_split_json, defaultSaleSplits.agent_sale_split),
  manager_sale_split: parseGroupSplit(group.manager_sale_split_json, defaultSaleSplits.manager_sale_split),
  broker_sale_split: parseGroupSplit(group.broker_sale_split_json, defaultSaleSplits.broker_sale_split),
  bnm_sale_split: parseGroupSplit(group.bnm_sale_split_json, defaultSaleSplits.bnm_sale_split),
  group_head_seller_id: group.group_head_seller_id ? String(group.group_head_seller_id) : "",
  status: group.status || "active",
  notes: group.notes || "",
})

const getGroupRateForRole = (group: SellerGroup | null | undefined, role: string) => {
  if (!group) return null

  if (role === "broker_network_manager") {
    return parseGroupSplit(group.bnm_sale_split_json, defaultSaleSplits.bnm_sale_split).broker_network_manager
  }

  if (role === "broker") {
    return parseGroupSplit(group.broker_sale_split_json, defaultSaleSplits.broker_sale_split).broker
  }

  if (role === "manager") {
    return parseGroupSplit(group.manager_sale_split_json, defaultSaleSplits.manager_sale_split).manager
  }

  if (role === "agent") {
    return parseGroupSplit(group.agent_sale_split_json, defaultSaleSplits.agent_sale_split).agent
  }

  return group.closing_seller_rate
}

const getGroupSplitTotals = (form: SellerGroupForm) => {
  return saleSplitSections.reduce<Record<string, number>>((totals, section) => {
    totals[section.key] = getSplitTotal(form[section.key], section.roles.map((role) => role.key))
    return totals
  }, {})
}


const Users = () => {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [isGroupsOpen, setIsGroupsOpen] = useState(false)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [form, setForm] = useState<UserForm>(emptyForm)
  const [editingGroup, setEditingGroup] = useState<SellerGroup | null>(null)
  const [groupForm, setGroupForm] = useState<SellerGroupForm>(emptyGroupForm)
  const [message, setMessage] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sellerProfileFilter, setSellerProfileFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const { data: currentUserData } = useCurrentUser()
  const currentUser = (currentUserData as CurrentUserResponse | null)?.user
  const canEditAdminUsers = currentUser?.role === "super_admin"
  const availableRoles = canEditAdminUsers ? allRoles : adminCreatableRoles

  const { data: users = [], isLoading, error } = useQuery<User[]>({
    queryKey: ["users"],
    queryFn: fetchUsers,
  })

  const { data: sellers = [] } = useQuery<AccreditedSeller[]>({
    queryKey: ["accredited-sellers-for-user-management"],
    queryFn: fetchSellers,
  })

  const { data: sellerGroups = [] } = useQuery<SellerGroup[]>({
    queryKey: ["seller-groups"],
    queryFn: fetchSellerGroups,
  })

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
        user.seller_group_name,
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

  const selectedGroup = useMemo(() => {
    const inheritedGroupId = selectedParent?.seller_group_id ? String(selectedParent.seller_group_id) : ""
    const chosenGroupId = inheritedGroupId || form.seller_profile.seller_group_id
    if (!chosenGroupId) return null
    return sellerGroups.find((group) => String(group.id) === chosenGroupId) || null
  }, [form.seller_profile.seller_group_id, selectedParent, sellerGroups])

  const activeSellerGroups = sellerGroups.filter((group) => group.status === "active")
  const groupHeadOptions = sellers.filter((seller) => seller.seller_role === "broker_network_manager" && seller.status === "active")
  const groupPoolRate = Number(groupForm.pool_rate || 0)
  const groupSplitTotals = getGroupSplitTotals(groupForm)
  const groupRateOverPool = Object.values(groupSplitTotals).some((total) => total > groupPoolRate)

  useEffect(() => {
    if (message) {
      const timeout = window.setTimeout(() => setMessage(""), 5000)
      return () => window.clearTimeout(timeout)
    }
  }, [message])

  const invalidateUserData = () => {
    queryClient.invalidateQueries({ queryKey: ["users"] })
    queryClient.invalidateQueries({ queryKey: ["accredited-sellers-for-user-management"] })
    queryClient.invalidateQueries({ queryKey: ["accredited-sellers"] })
    queryClient.invalidateQueries({ queryKey: ["seller-groups"] })
  }

  const saveMutation = useMutation({
    mutationFn: saveUser,
    onSuccess: () => {
      invalidateUserData()
      setIsOpen(false)
      setEditUser(null)
      setMessage("User saved successfully. Seller group and rates were resolved automatically.")
    },
  })

  const saveGroupMutation = useMutation({
    mutationFn: saveSellerGroup,
    onSuccess: () => {
      invalidateUserData()
      setEditingGroup(null)
      setGroupForm(emptyGroupForm)
      setMessage("Seller group saved successfully. Closing and override rates were applied to group members.")
    },
  })

  const recalculateGroupMutation = useMutation({
    mutationFn: recalculateSellerGroup,
    onSuccess: () => {
      invalidateUserData()
      setMessage("Seller group members and rates recalculated successfully.")
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
      invalidateUserData()
      setMessage("User deactivated successfully.")
    },
  })

  const updateForm = (values: Partial<UserForm>) => setForm((prev) => ({ ...prev, ...values }))
  const updateSellerProfile = (values: Partial<SellerProfileForm>) =>
    setForm((prev) => ({
      ...prev,
      seller_profile: { ...prev.seller_profile, ...values },
    }))

  const updateGroupSaleSplit = (
    splitKey: "agent_sale_split" | "manager_sale_split" | "broker_sale_split" | "bnm_sale_split",
    role: SaleSplitRole,
    value: string
  ) => {
    setGroupForm((prev) => ({
      ...prev,
      [splitKey]: {
        ...prev[splitKey],
        [role]: value,
      },
    }))
  }

  const handleRoleChange = (role: UserRole) => {
    setForm((prev) => ({
      ...prev,
      role,
      seller_profile: { ...emptySellerProfile },
    }))
  }

  const openCreate = () => {
    const role = canEditAdminUsers ? "admin" : "agent"
    setEditUser(null)
    setForm({ ...emptyForm, role })
    setIsOpen(true)
  }

  const openEdit = (user: User) => {
    if (!canEditAdminUsers && ["super_admin", "admin"].includes(String(user.role))) {
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

  const openCreateGroup = () => {
    setEditingGroup(null)
    setGroupForm(emptyGroupForm)
    setIsGroupsOpen(true)
  }

  const openEditGroup = (group: SellerGroup) => {
    setEditingGroup(group)
    setGroupForm(groupFormFromGroup(group))
    setIsGroupsOpen(true)
  }

  const canResetOrDeactivateUser = (user: User) => canEditAdminUsers || !isOfficeRole(String(user.role))

  const handleResetPassword = (user: User) => {
    if (!canResetOrDeactivateUser(user)) {
      setMessage("Only super admin can reset another admin or super admin password.")
      return
    }

    const confirmed = window.confirm(
      `Are you sure you want to reset the password for ${user.full_name}? A new temporary password will be emailed and the user must change it on first login.`
    )

    if (confirmed) resetPasswordMutation.mutate(user.id)
  }

  const handleDeactivate = (user: User) => {
    if (!canResetOrDeactivateUser(user)) {
      setMessage("Only super admin can deactivate admin or super admin accounts.")
      return
    }

    const confirmed = window.confirm(`Are you sure you want to deactivate ${user.full_name}? They will no longer be able to login.`)
    if (confirmed) deactivateMutation.mutate(user.id)
  }

  const rateSummary = (user: User) => {
    if (!isSellerRole(String(user.role))) return "-"
    if (!user.seller_group_name) return "No seller group"
    return `Pool ${formatRate(user.seller_group_pool_rate)} / Closing ${formatRate(user.seller_group_closing_seller_rate ?? user.seller_group_role_rate ?? user.personal_commission_rate ?? user.commission_rate)}`
  }

  const shouldShowGroupSelect = isSellerRole(form.role) && !selectedParent && ["broker_network_manager", "broker", "manager"].includes(form.role)

  return (
    <div className="p-6">
      <PageHeader
        icon={<FiUserPlus />}
        title="User Management"
        subtitle="Create accounts and set hierarchy. Commission rates are controlled by Seller Groups, not individual accounts."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button icon={<FiUsers />} onClick={openCreateGroup} variant="secondary">
              Seller Groups
            </Button>
            <Button icon={<FiPlus />} onClick={openCreate} variant="primary">
              Create User
            </Button>
          </div>
        }
      />

      {message ? <Alert variant="success" title={message} /> : null}
      {error ? <Alert variant="error" title={error instanceof Error ? error.message : "Failed to load users"} /> : null}
      {saveMutation.error ? <Alert variant="error" title={saveMutation.error instanceof Error ? saveMutation.error.message : "Failed to save user"} /> : null}
      {saveGroupMutation.error ? <Alert variant="error" title={saveGroupMutation.error instanceof Error ? saveGroupMutation.error.message : "Failed to save seller group"} /> : null}
      {recalculateGroupMutation.error ? <Alert variant="error" title={recalculateGroupMutation.error instanceof Error ? recalculateGroupMutation.error.message : "Failed to recalculate seller group"} /> : null}
      {deactivateMutation.error ? <Alert variant="error" title={deactivateMutation.error instanceof Error ? deactivateMutation.error.message : "Failed to deactivate user"} /> : null}
      {resetPasswordMutation.error ? <Alert variant="error" title={resetPasswordMutation.error instanceof Error ? resetPasswordMutation.error.message : "Failed to reset password"} /> : null}

      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-[1fr_220px_220px_220px]">
        <Input
          icon={<FiSearch />}
          placeholder="Search users, email, seller, parent, or group..."
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
                <th className="px-4 py-3 text-left">Seller Group</th>
                <th className="px-4 py-3 text-left">Commission Setup</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.map((user) => (
                <tr className="border-b border-slate-100" key={user.id}>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900">{user.full_name}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                    <p className="text-xs text-slate-400">Created {formatDate(user.created_at)}</p>
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
                    {user.seller_group_name ? (
                      <>
                        <p className="font-semibold text-slate-900">{user.seller_group_name}</p>
                        <p className="text-xs text-slate-500">Pool {formatRate(user.seller_group_pool_rate)}</p>
                      </>
                    ) : isSellerRole(user.role) ? (
                      <span className="text-amber-600">No group</span>
                    ) : "-"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{rateSummary(user)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={user.status} />
                    {user.must_change_password ? <p className="mt-1 text-xs font-semibold text-amber-600">Password change required</p> : null}
                    {user.temp_password_sent_at ? <p className="mt-1 text-xs text-slate-400">Temp sent {formatDate(user.temp_password_sent_at)}</p> : null}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
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
          {!editUser ? <Alert variant="info" title="A temporary password will be generated and emailed. Commission rates are inherited from the selected seller group." /> : null}

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
                  <Select
                    label={getParentLabel(form.role)}
                    value={form.seller_profile.parent_seller_id}
                    onChange={(e) => updateSellerProfile({ parent_seller_id: e.target.value, seller_group_id: e.target.value ? "" : form.seller_profile.seller_group_id })}
                  >
                    {form.role === "broker" ? <option value="">Company / No BNM</option> : form.role === "manager" ? <option value="">Company / Direct to Developer</option> : <option value="">Select Manager</option>}
                    {parentOptions.map((seller) => (
                      <option key={seller.id} value={seller.id}>
                        {seller.full_name} {seller.seller_group_name ? `— ${seller.seller_group_name}` : ""}
                      </option>
                    ))}
                  </Select>
                ) : null}

                {shouldShowGroupSelect ? (
                  <Select label="Seller Group" value={form.seller_profile.seller_group_id} onChange={(e) => updateSellerProfile({ seller_group_id: e.target.value })}>
                    <option value="">Select seller group</option>
                    {activeSellerGroups.map((group) => (
                      <option key={group.id} value={group.id}>{group.group_name} — Pool {formatRate(group.pool_rate)}</option>
                    ))}
                  </Select>
                ) : null}
              </div>

              <div className="mt-4 rounded-lg border border-blue-200 bg-white px-4 py-3 text-sm text-slate-600">
                <p className="font-semibold text-slate-900">Automatic group/rate preview</p>
                {selectedParent ? (
                  <p>{formatText(form.role)} inherits group from {selectedParent.full_name}.</p>
                ) : null}
                {selectedGroup ? (
                  <p className="mt-1">
                    Group: <span className="font-semibold text-slate-900">{selectedGroup.group_name}</span> / Pool {formatRate(selectedGroup.pool_rate)} / {form.role === "broker_network_manager" ? "BNM personal total" : "Closing rate"} {formatRate(getGroupRateForRole(selectedGroup, form.role))}
                  </p>
                ) : (
                  <p className="mt-1 text-amber-600">No seller group selected yet. This seller will not have an approved commission rate until assigned to a group.</p>
                )}
              </div>
            </div>
          ) : null}
        </Modal>
      ) : null}

      {isGroupsOpen ? (
        <Modal
          title="Seller Groups and Flexible Pool Distribution"
          onClose={() => setIsGroupsOpen(false)}
          size="xl"
          footer={
            <div className="flex justify-between gap-2">
              <Button onClick={() => setIsGroupsOpen(false)}>Close</Button>
              <Button
                disabled={saveGroupMutation.isPending || groupRateOverPool}
                onClick={() => saveGroupMutation.mutate({ id: editingGroup?.id, form: groupForm })}
                variant="primary"
              >
                {saveGroupMutation.isPending ? "Saving..." : editingGroup ? "Save Seller Group" : "Create Seller Group"}
              </Button>
            </div>
          }
        >
          <Alert
            variant="info"
            title="Rates are now managed per Seller Group. User accounts inherit their group from the selected higher-up. Edit the exact split for Agent, Manager, Broker, and BNM sale scenarios."
          />

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1.2fr]">
            <div>
              <div className="mb-3 flex items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-slate-900">Existing Groups</h3>
                <Button icon={<FiPlus />} onClick={openCreateGroup} variant="secondary">New</Button>
              </div>
              <div className="max-h-[460px] overflow-auto rounded-xl border border-slate-200 bg-white">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-left">Group</th>
                      <th className="px-3 py-2 text-left">Pool</th>
                      <th className="px-3 py-2 text-left">Members</th>
                      <th className="px-3 py-2 text-left">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sellerGroups.map((group) => (
                      <tr key={group.id} className="border-t border-slate-100">
                        <td className="px-3 py-2">
                          <p className="font-semibold text-slate-900">{group.group_name}</p>
                          <p className="text-xs text-slate-500">{group.group_code || "No code"}</p>
                          <StatusBadge status={group.status} />
                        </td>
                        <td className="px-3 py-2 text-slate-600">{formatRate(group.pool_rate)}</td>
                        <td className="px-3 py-2 text-slate-600">
                          <p>{formatNumber(group.active_member_count)} active</p>
                          <p className="text-xs text-slate-500">A {formatNumber(group.agent_count)} / M {formatNumber(group.manager_count)} / B {formatNumber(group.broker_count)}</p>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex flex-col gap-2">
                            <Button icon={<FiEdit2 />} onClick={() => openEditGroup(group)}>Edit</Button>
                            <Button disabled={recalculateGroupMutation.isPending} onClick={() => recalculateGroupMutation.mutate(group.id)} variant="ghost">Recalc</Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!sellerGroups.length ? (
                      <tr>
                        <td colSpan={4} className="px-3 py-8 text-center text-slate-500">No seller groups yet.</td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="mb-4 flex items-center gap-2">
                <FiSettings className="text-blue-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{editingGroup ? "Edit Group" : "Create Group"}</h3>
                  <p className="text-xs text-slate-500">Admin controls the group pool and exact commission split per sale type here.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Input label="Group Name" value={groupForm.group_name} onChange={(e) => setGroupForm((prev) => ({ ...prev, group_name: e.target.value }))} />
                <Input label="Group Code" value={groupForm.group_code} onChange={(e) => setGroupForm((prev) => ({ ...prev, group_code: e.target.value }))} />
                <Input label="Pool Rate (%)" type="number" min={0} max={100} step="0.01" value={groupForm.pool_rate} onChange={(e) => setGroupForm((prev) => ({ ...prev, pool_rate: e.target.value }))} />
                <Select label="Status" value={groupForm.status} onChange={(e) => setGroupForm((prev) => ({ ...prev, status: e.target.value }))}>
                  {statuses.map((status) => <option key={status} value={status}>{formatText(status)}</option>)}
                </Select>
                <Select label="Group Head / BNM" value={groupForm.group_head_seller_id} onChange={(e) => setGroupForm((prev) => ({ ...prev, group_head_seller_id: e.target.value }))}>
                  <option value="">No group head yet</option>
                  {groupHeadOptions.map((seller) => <option key={seller.id} value={seller.id}>{seller.full_name}</option>)}
                </Select>
                <Input label="Notes" value={groupForm.notes} onChange={(e) => setGroupForm((prev) => ({ ...prev, notes: e.target.value }))} />
              </div>

              <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Editable Pool Distribution per Sale Type</h4>
                    <p className="text-xs text-slate-500">
                      Edit the actual rates shown below. Each sale type can have its own split as long as its total does not exceed the group pool.
                    </p>
                  </div>
                  <p className={groupRateOverPool ? "text-sm font-bold text-red-600" : "text-sm font-semibold text-slate-600"}>
                    Pool {formatRate(groupPoolRate)}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {saleSplitSections.map((section) => {
                    const total = groupSplitTotals[section.key] || 0
                    const isOverPool = total > groupPoolRate
                    const remaining = Math.max(groupPoolRate - total, 0)

                    return (
                      <div key={section.key} className="rounded-xl border border-blue-100 bg-white p-4">
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-bold text-slate-900">{section.label}</p>
                            <p className="mt-1 text-xs text-slate-500">{section.description}</p>
                          </div>
                          <div className="text-right text-xs">
                            <p className={isOverPool ? "font-bold text-red-600" : "font-bold text-slate-900"}>
                              Total {formatRate(total)}
                            </p>
                            <p className="text-slate-500">Remaining {formatRate(remaining)}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          {section.roles.map((role) => (
                            <Input
                              key={`${section.key}-${role.key}`}
                              label={`${role.label} Rate (%)`}
                              type="number"
                              min={0}
                              max={100}
                              step="0.01"
                              value={groupForm[section.key][role.key]}
                              onChange={(e) => updateGroupSaleSplit(section.key, role.key, e.target.value)}
                            />
                          ))}
                        </div>

                        {isOverPool ? (
                          <p className="mt-3 text-xs font-semibold text-red-600">
                            {section.label} total cannot exceed the pool rate.
                          </p>
                        ) : null}

                        {!isOverPool && total < groupPoolRate ? (
                          <p className="mt-3 text-xs font-semibold text-amber-600">
                            This split leaves {formatRate(groupPoolRate - total)} undistributed.
                          </p>
                        ) : null}
                      </div>
                    )
                  })}
                </div>

                {groupRateOverPool ? <p className="mt-3 text-sm font-semibold text-red-600">One or more sale-type totals exceed the pool rate.</p> : null}
              </div>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  )
}

export default Users
