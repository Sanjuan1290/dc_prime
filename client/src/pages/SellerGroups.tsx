import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { FiArrowLeft, FiEye, FiPlus, FiRefreshCw, FiSearch, FiSettings, FiTrash2, FiUsers } from "react-icons/fi"
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
import useCurrentUser from "../utils/useCurrentUser"

type SaleSplitRole = "broker_network_manager" | "broker" | "manager" | "agent"
type SaleSplit = Partial<Record<SaleSplitRole, number | string | null>>
type SaleSplitForm = Record<SaleSplitRole, string>

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
  group_head_seller_id: number | null
  group_head_name: string | null
  status: string
  notes: string | null
  active_member_count: number | string
  bnm_count: number | string
  broker_count: number | string
  manager_count: number | string
  agent_count: number | string
}

type AccreditedSeller = {
  id: number
  full_name: string
  seller_role: string
  status: string
}

type SellerGroupMember = {
  id: number
  full_name: string
  email: string | null
  contact_no: string | null
  seller_role: string
  parent_seller_id: number | null
  parent_seller_name: string | null
  seller_group_id: number | null
  seller_group_name: string | null
  status: string
  commission_rate: number | string | null
  commission_pool_rate: number | string | null
  personal_commission_rate: number | string | null
  override_commission_rate: number | string | null
  direct_to_developer_rate: number | string | null
  max_downline_rate: number | string | null
  rate_set_by: number | null
  rate_set_by_name: string | null
  rate_updated_at: string | null
  direct_downline_count?: number | string
  hierarchy_path?: string | null
}

type CurrentUserResponse = {
  user?: {
    role?: string
  }
}

type GroupsResponse = { groups?: SellerGroup[]; data?: SellerGroup[] }
type SellersResponse = { accreditedSellers?: AccreditedSeller[]; sellers?: AccreditedSeller[]; data?: AccreditedSeller[] }
type GroupDetailsResponse = {
  group?: SellerGroup
  members?: SellerGroupMember[]
  data?: {
    group?: SellerGroup
    members?: SellerGroupMember[]
  }
}

type SellerGroupForm = {
  group_name: string
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

type MemberRateForm = {
  personal_commission_rate: string
  override_commission_rate: string
}

const statuses = ["active", "inactive"]

const saleSplitSections: Array<{
  key: "agent_sale_split" | "manager_sale_split" | "broker_sale_split" | "bnm_sale_split"
  label: string
  description: string
  roles: Array<{ key: SaleSplitRole; label: string }>
}> = [
  {
    key: "agent_sale_split",
    label: "Agent sale",
    description: "Agent closed the sale. Set allocation for BNM, Broker, Manager, and Agent.",
    roles: [
      { key: "broker_network_manager", label: "BNM" },
      { key: "broker", label: "Broker" },
      { key: "manager", label: "Manager" },
      { key: "agent", label: "Agent" },
    ],
  },
  {
    key: "manager_sale_split",
    label: "Manager sale",
    description: "Manager personally closed the sale. Set BNM, Broker, and Manager split.",
    roles: [
      { key: "broker_network_manager", label: "BNM" },
      { key: "broker", label: "Broker" },
      { key: "manager", label: "Manager" },
    ],
  },
  {
    key: "broker_sale_split",
    label: "Broker sale",
    description: "Broker personally closed the sale. Set BNM and Broker split.",
    roles: [
      { key: "broker_network_manager", label: "BNM" },
      { key: "broker", label: "Broker" },
    ],
  },
  {
    key: "bnm_sale_split",
    label: "BNM sale",
    description: "BNM personally closed the sale.",
    roles: [{ key: "broker_network_manager", label: "BNM" }],
  },
]

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

const emptyMemberRateForm: MemberRateForm = {
  personal_commission_rate: "",
  override_commission_rate: "",
}

const fetchSellerGroups = async () => {
  const res = await fetch(`${API_URL}/seller-groups`, { credentials: "include" })
  if (!res.ok) throw new Error(await getErrorMessage(res))
  const data = (await res.json()) as GroupsResponse
  return data.groups || data.data || []
}

const fetchSellers = async () => {
  const res = await fetch(`${API_URL}/accredited-sellers`, { credentials: "include" })
  if (!res.ok) throw new Error(await getErrorMessage(res))
  const data = (await res.json()) as SellersResponse
  return data.accreditedSellers || data.sellers || data.data || []
}

const fetchSellerGroupDetails = async (id: number) => {
  const res = await fetch(`${API_URL}/seller-groups/${id}/details`, { credentials: "include" })
  if (!res.ok) throw new Error(await getErrorMessage(res))
  const data = (await res.json()) as GroupDetailsResponse
  return {
    group: data.group || data.data?.group,
    members: data.members || data.data?.members || [],
  }
}

const saveSellerGroup = async ({ id, form }: { id?: number; form: SellerGroupForm }) => {
  const res = await fetch(id ? `${API_URL}/seller-groups/${id}` : `${API_URL}/seller-groups`, {
    method: id ? "PATCH" : "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      group_name: form.group_name.trim(),
      group_code: null,
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

const deleteSellerGroup = async (id: number) => {
  const res = await fetch(`${API_URL}/seller-groups/${id}`, {
    method: "DELETE",
    credentials: "include",
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

const updateMemberRates = async ({
  groupId,
  sellerId,
  sellerRole,
  form,
}: {
  groupId: number
  sellerId: number
  sellerRole: string
  form: MemberRateForm
}) => {
  const nullableRate = (value: string) => (value.trim() === "" ? null : Number(value))
  const payload: Record<string, number | null> = {
    personal_commission_rate: nullableRate(form.personal_commission_rate),
  }

  if (sellerRole !== "agent") {
    payload.override_commission_rate = nullableRate(form.override_commission_rate)
  }

  const res = await fetch(`${API_URL}/seller-groups/${groupId}/members/${sellerId}/rates`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await getErrorMessage(res))
  return res.json()
}

const formatRate = (rate: number | string | null | undefined) => {
  if (rate === null || rate === undefined || rate === "") return "-"
  return `${formatNumber(rate)}%`
}

const formatRateInput = (rate: number | string | null | undefined) => {
  if (rate === null || rate === undefined) return ""
  return String(rate)
}

const parseGroupSplit = (value: SaleSplit | string | null | undefined, fallback: SaleSplitForm) => {
  const normalized = { ...blankSaleSplit(), ...fallback }
  if (!value) return normalized

  let parsed: SaleSplit | null

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

const memberRateFormFromMember = (member: SellerGroupMember): MemberRateForm => ({
  personal_commission_rate: formatRateInput(member.personal_commission_rate),
  override_commission_rate: formatRateInput(member.override_commission_rate),
})

const getGroupSplitTotals = (form: SellerGroupForm) => {
  return saleSplitSections.reduce<Record<string, number>>((totals, section) => {
    totals[section.key] = getSplitTotal(form[section.key], section.roles.map((role) => role.key))
    return totals
  }, {})
}

const getHierarchyDisplay = (member: SellerGroupMember) => {
  if (member.hierarchy_path) return member.hierarchy_path
  if (member.parent_seller_name) return `${member.parent_seller_name} -> ${member.full_name}`
  return member.full_name
}

const canUseOverrideRate = (sellerRole: string) => sellerRole !== "agent"

const parseOptionalRateInput = (value: string) => {
  if (value.trim() === "") return null
  const parsed = Number(value)
  return Number.isNaN(parsed) ? undefined : parsed
}

const validateRateInput = (value: string, label: string) => {
  const parsed = parseOptionalRateInput(value)
  if (parsed === undefined) return `${label} must be numeric or blank.`
  if (parsed !== null && (parsed < 0 || parsed > 100)) return `${label} must be between 0 and 100.`
  return null
}

const SellerGroups = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [message, setMessage] = useState("")
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [selectedGroup, setSelectedGroup] = useState<SellerGroup | null>(null)
  const [editingGroup, setEditingGroup] = useState<SellerGroup | null>(null)
  const [isGroupFormOpen, setIsGroupFormOpen] = useState(false)
  const [groupForm, setGroupForm] = useState<SellerGroupForm>(emptyGroupForm)
  const [selectedMember, setSelectedMember] = useState<SellerGroupMember | null>(null)
  const [memberRateForm, setMemberRateForm] = useState<MemberRateForm>(emptyMemberRateForm)
  const [memberRateError, setMemberRateError] = useState("")

  const { data: currentUserData } = useCurrentUser()
  const currentUser = (currentUserData as CurrentUserResponse | null)?.user
  const canManageRates = currentUser?.role === "super_admin"

  const { data: sellerGroups = [], isLoading, error } = useQuery<SellerGroup[]>({
    queryKey: ["seller-groups"],
    queryFn: fetchSellerGroups,
  })

  const { data: sellers = [] } = useQuery<AccreditedSeller[]>({
    queryKey: ["accredited-sellers-for-seller-groups"],
    queryFn: fetchSellers,
  })

  const {
    data: groupDetails,
    error: detailsError,
    isFetching: isDetailsFetching,
  } = useQuery({
    queryKey: ["seller-group-details", selectedGroup?.id],
    queryFn: () => fetchSellerGroupDetails(selectedGroup?.id || 0),
    enabled: Boolean(selectedGroup?.id),
  })

  const detailsGroup = groupDetails?.group || selectedGroup
  const members = useMemo(() => groupDetails?.members || [], [groupDetails?.members])

  const groupHeadOptions = sellers.filter(
    (seller) => ["broker_network_manager", "broker"].includes(String(seller.seller_role)) && seller.status === "active"
  )

  const groupPoolRate = Number(groupForm.pool_rate || 0)
  const groupSplitTotals = getGroupSplitTotals(groupForm)
  const groupRateOverPool = Object.values(groupSplitTotals).some((total) => total > groupPoolRate)

  const filteredMembers = useMemo(() => {
    const term = search.toLowerCase().trim()

    return members.filter((member) => {
      const matchesRole = roleFilter === "all" || member.seller_role === roleFilter
      const matchesSearch = !term || [
        member.full_name,
        member.email,
        member.contact_no,
        member.seller_role,
        member.parent_seller_name,
        member.hierarchy_path,
        member.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term)

      return matchesRole && matchesSearch
    })
  }, [members, roleFilter, search])

  useEffect(() => {
    if (message) {
      const timeout = window.setTimeout(() => setMessage(""), 5000)
      return () => window.clearTimeout(timeout)
    }
  }, [message])

  const invalidateGroupData = () => {
    queryClient.invalidateQueries({ queryKey: ["seller-groups"] })
    queryClient.invalidateQueries({ queryKey: ["seller-group-details"] })
    queryClient.invalidateQueries({ queryKey: ["accredited-sellers-for-seller-groups"] })
    queryClient.invalidateQueries({ queryKey: ["accredited-sellers-for-user-management"] })
  }

  const saveGroupMutation = useMutation({
    mutationFn: saveSellerGroup,
    onSuccess: () => {
      invalidateGroupData()
      setEditingGroup(null)
      setGroupForm(emptyGroupForm)
      setIsGroupFormOpen(false)
      setMessage("Seller group saved successfully.")
    },
  })

  const deleteGroupMutation = useMutation({
    mutationFn: deleteSellerGroup,
    onSuccess: () => {
      invalidateGroupData()
      setSelectedGroup(null)
      setMessage("Seller group removed successfully.")
    },
  })

  const recalculateGroupMutation = useMutation({
    mutationFn: recalculateSellerGroup,
    onSuccess: () => {
      invalidateGroupData()
      setMessage("Seller group members recalculated successfully.")
    },
  })

  const updateMemberRatesMutation = useMutation({
    mutationFn: updateMemberRates,
    onSuccess: () => {
      invalidateGroupData()
      setSelectedMember(null)
      setMemberRateForm(emptyMemberRateForm)
      setMemberRateError("")
      setMessage("Member rates updated successfully.")
    },
  })

  const openCreateGroup = () => {
    setEditingGroup(null)
    setGroupForm(emptyGroupForm)
    setIsGroupFormOpen(true)
  }

  const openEditGroup = (group: SellerGroup) => {
    setEditingGroup(group)
    setGroupForm(groupFormFromGroup(group))
    setIsGroupFormOpen(true)
  }

  const openMemberDetails = (member: SellerGroupMember) => {
    setSelectedMember(member)
    setMemberRateForm(memberRateFormFromMember(member))
    setMemberRateError("")
  }

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

  const updateMemberRate = (values: Partial<MemberRateForm>) => {
    setMemberRateError("")
    setMemberRateForm((prev) => ({ ...prev, ...values }))
  }

  const handleRemoveGroup = (group: SellerGroup) => {
    const activeMembers = Number(group.active_member_count || 0)
    const confirmed = window.confirm(
      activeMembers > 0
        ? `Remove ${group.group_name}? This will unassign ${activeMembers} active member(s) from this group and clear their inherited group rates.`
        : `Remove ${group.group_name}? This cannot be undone.`
    )

    if (confirmed) deleteGroupMutation.mutate(group.id)
  }

  const handleSaveMemberRates = () => {
    if (!selectedMember || !detailsGroup) return

    const directError = validateRateInput(memberRateForm.personal_commission_rate, "Direct Rate")
    const overrideError = canUseOverrideRate(selectedMember.seller_role)
      ? validateRateInput(memberRateForm.override_commission_rate, "Override Rate")
      : null
    const validationError = directError || overrideError

    if (validationError) {
      setMemberRateError(validationError)
      return
    }

    setMemberRateError("")
    updateMemberRatesMutation.mutate({
      groupId: detailsGroup.id,
      sellerId: selectedMember.id,
      sellerRole: selectedMember.seller_role,
      form: memberRateForm,
    })
  }

  return (
    <div className="p-6">
      <PageHeader
        icon={<FiUsers />}
        title="Seller Groups"
        subtitle="Manage seller groups, hierarchy, pool rates, and member commission rates."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button icon={<FiArrowLeft />} onClick={() => navigate("/users")} variant="secondary">
              Back to Users
            </Button>
            {canManageRates ? (
              <Button icon={<FiPlus />} onClick={openCreateGroup} variant="primary">
                New Group
              </Button>
            ) : null}
          </div>
        }
      />

      {message ? <Alert variant="success" title={message} /> : null}
      {!canManageRates ? <Alert variant="info" title="Admins can view Seller Groups. Only Super Admin can create, edit, remove, recalculate, or update rates." /> : null}
      {error ? <Alert variant="error" title={error instanceof Error ? error.message : "Failed to load seller groups"} /> : null}
      {detailsError ? <Alert variant="error" title={detailsError instanceof Error ? detailsError.message : "Failed to load seller group details"} /> : null}
      {saveGroupMutation.error ? <Alert variant="error" title={saveGroupMutation.error instanceof Error ? saveGroupMutation.error.message : "Failed to save seller group"} /> : null}
      {deleteGroupMutation.error ? <Alert variant="error" title={deleteGroupMutation.error instanceof Error ? deleteGroupMutation.error.message : "Failed to remove seller group"} /> : null}
      {recalculateGroupMutation.error ? <Alert variant="error" title={recalculateGroupMutation.error instanceof Error ? recalculateGroupMutation.error.message : "Failed to recalculate seller group"} /> : null}
      {updateMemberRatesMutation.error ? <Alert variant="error" title={updateMemberRatesMutation.error instanceof Error ? updateMemberRatesMutation.error.message : "Failed to update member rates"} /> : null}

      {isLoading ? <LoadingState label="Loading seller groups..." /> : null}
      {!isLoading && sellerGroups.length === 0 ? <EmptyState title="No seller groups found" /> : null}

      {sellerGroups.length > 0 ? (
        <TableContainer>
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="border-b border-slate-200">
                <th className="px-4 py-3 text-left">Group Name</th>
                <th className="px-4 py-3 text-left">Pool Rate</th>
                <th className="px-4 py-3 text-left">Group Head</th>
                <th className="px-4 py-3 text-left">Members</th>
                <th className="px-4 py-3 text-left">BNM / Broker / Manager / Agent</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sellerGroups.map((group) => (
                <tr key={group.id} className="border-b border-slate-100 last:border-b-0">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900">{group.group_name}</p>
                    {group.notes ? <p className="text-xs text-slate-500">{group.notes}</p> : null}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{formatRate(group.pool_rate)}</td>
                  <td className="px-4 py-3 text-slate-600">{group.group_head_name || "-"}</td>
                  <td className="px-4 py-3 text-slate-600">{formatNumber(group.active_member_count)} active</td>
                  <td className="px-4 py-3 text-slate-600">
                    {formatNumber(group.bnm_count)} / {formatNumber(group.broker_count)} / {formatNumber(group.manager_count)} / {formatNumber(group.agent_count)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={group.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button icon={<FiEye />} onClick={() => setSelectedGroup(group)}>
                        Details
                      </Button>
                      {canManageRates ? (
                        <>
                          <Button icon={<FiSettings />} onClick={() => openEditGroup(group)} variant="secondary">
                            Edit Group
                          </Button>
                          <Button disabled={deleteGroupMutation.isPending} icon={<FiTrash2 />} onClick={() => handleRemoveGroup(group)} variant="danger">
                            Remove
                          </Button>
                        </>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableContainer>
      ) : null}

      {selectedGroup ? (
        <Modal
          title={`Seller Group Details - ${detailsGroup?.group_name || selectedGroup.group_name}`}
          onClose={() => {
            setSelectedGroup(null)
            setSelectedMember(null)
            setSearch("")
            setRoleFilter("all")
          }}
          size="xl"
          footer={
            <div className="flex flex-wrap justify-between gap-2">
              <Button onClick={() => setSelectedGroup(null)}>Close</Button>
              {canManageRates && detailsGroup ? (
                <Button disabled={recalculateGroupMutation.isPending} icon={<FiRefreshCw />} onClick={() => recalculateGroupMutation.mutate(detailsGroup.id)} variant="primary">
                  Recalculate Members
                </Button>
              ) : null}
            </div>
          }
        >
          {isDetailsFetching ? <LoadingState label="Loading group details..." /> : null}
          {detailsGroup ? (
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                {[
                  ["Group name", detailsGroup.group_name],
                  ["Pool rate", formatRate(detailsGroup.pool_rate)],
                  ["Group head", detailsGroup.group_head_name || "-"],
                  ["Status", formatText(detailsGroup.status)],
                  ["Notes", detailsGroup.notes || "-"],
                  ["Total members", formatNumber(detailsGroup.active_member_count)],
                  ["BNM count", formatNumber(detailsGroup.bnm_count)],
                  ["Broker count", formatNumber(detailsGroup.broker_count)],
                  ["Manager count", formatNumber(detailsGroup.manager_count)],
                  ["Agent count", formatNumber(detailsGroup.agent_count)],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg border border-slate-200 bg-white p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
                    <p className="mt-1 font-semibold text-slate-900">{value}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_220px]">
                <Input
                  icon={<FiSearch />}
                  placeholder="Search members, parent, hierarchy, role..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                  <option value="all">All roles</option>
                  <option value="broker_network_manager">BNM</option>
                  <option value="broker">Broker</option>
                  <option value="manager">Manager</option>
                  <option value="agent">Agent</option>
                </Select>
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr className="border-b border-slate-200">
                      <th className="px-4 py-3 text-left">Member</th>
                      <th className="px-4 py-3 text-left">Role</th>
                      <th className="px-4 py-3 text-left">Reports Under</th>
                      <th className="px-4 py-3 text-left">Hierarchy Path</th>
                      <th className="px-4 py-3 text-left">Direct Rate</th>
                      <th className="px-4 py-3 text-left">Override Rate</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Last Updated</th>
                      <th className="px-4 py-3 text-left">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMembers.map((member) => (
                      <tr key={member.id} className="border-b border-slate-100 last:border-b-0">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-900">{member.full_name}</p>
                          <p className="text-xs text-slate-500">{member.email || member.contact_no || `Seller ID #${member.id}`}</p>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{formatText(member.seller_role)}</td>
                        <td className="px-4 py-3 text-slate-600">{member.parent_seller_name || "Group Head"}</td>
                        <td className="px-4 py-3 text-slate-600">{getHierarchyDisplay(member)}</td>
                        <td className="px-4 py-3 text-slate-600">{formatRate(member.personal_commission_rate ?? member.commission_rate)}</td>
                        <td className="px-4 py-3 text-slate-600">{formatRate(member.override_commission_rate)}</td>
                        <td className="px-4 py-3"><StatusBadge status={member.status} /></td>
                        <td className="px-4 py-3 text-slate-600">{member.rate_updated_at ? formatDate(member.rate_updated_at) : "-"}</td>
                        <td className="px-4 py-3">
                          <Button icon={<FiEye />} onClick={() => openMemberDetails(member)}>
                            Details
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {!filteredMembers.length ? (
                      <tr>
                        <td colSpan={9} className="px-4 py-8 text-center text-slate-500">No members found.</td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </Modal>
      ) : null}

      {selectedMember && detailsGroup ? (
        <Modal
          title={`Member Details - ${selectedMember.full_name}`}
          onClose={() => {
            setSelectedMember(null)
            setMemberRateError("")
          }}
          size="lg"
          footer={
            <div className="flex justify-end gap-2">
              <Button
                onClick={() => {
                  setSelectedMember(null)
                  setMemberRateError("")
                }}
              >
                Close
              </Button>
              {canManageRates ? (
                <Button disabled={updateMemberRatesMutation.isPending} onClick={handleSaveMemberRates} variant="primary">
                  {updateMemberRatesMutation.isPending ? "Saving..." : "Save Rates"}
                </Button>
              ) : null}
            </div>
          }
        >
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {[
                ["Member name", selectedMember.full_name],
                ["Role", formatText(selectedMember.seller_role)],
                ["Group", selectedMember.seller_group_name || detailsGroup.group_name],
                ["Reports Under", selectedMember.parent_seller_name || "Group Head"],
                ["Hierarchy", getHierarchyDisplay(selectedMember)],
                ["Group Pool Rate", formatRate(detailsGroup.pool_rate)],
                ["Rate last updated", selectedMember.rate_updated_at ? formatDate(selectedMember.rate_updated_at) : "-"],
                ["Rate set by", selectedMember.rate_set_by_name || "-"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-slate-200 bg-white p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
                  <p className="mt-1 font-semibold text-slate-900">{value}</p>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
              <h3 className="text-sm font-bold text-slate-900">Member Rates</h3>
              <p className="mt-1 text-xs text-slate-600">
                Direct Rate is used when this member personally sells. Override Rate is used when a downline seller closes the sale.
              </p>

              {memberRateError ? (
                <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                  {memberRateError}
                </p>
              ) : null}

              {(() => {
                const poolRate = parseOptionalRateInput(String(detailsGroup.pool_rate ?? ""))
                const directRate = parseOptionalRateInput(memberRateForm.personal_commission_rate)
                const overrideRate = parseOptionalRateInput(memberRateForm.override_commission_rate)
                const directOverPool = poolRate !== null && poolRate !== undefined && directRate !== null && directRate !== undefined && directRate > poolRate
                const overrideOverPool = poolRate !== null && poolRate !== undefined && overrideRate !== null && overrideRate !== undefined && overrideRate > poolRate

                return directOverPool || (canUseOverrideRate(selectedMember.seller_role) && overrideOverPool) ? (
                  <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700">
                    One or more visible rates are greater than the group pool rate of {formatRate(detailsGroup.pool_rate)}.
                  </p>
                ) : null
              })()}

              <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
                <Input
                  disabled={!canManageRates}
                  label="Direct Rate (%) - used when this member personally sells"
                  max={100}
                  min={0}
                  step="0.01"
                  type="number"
                  value={memberRateForm.personal_commission_rate}
                  onChange={(e) => updateMemberRate({ personal_commission_rate: e.target.value })}
                />
                {canUseOverrideRate(selectedMember.seller_role) ? (
                  <Input
                    disabled={!canManageRates}
                    label="Override Rate (%) - used when a downline seller closes the sale"
                    max={100}
                    min={0}
                    step="0.01"
                    type="number"
                    value={memberRateForm.override_commission_rate}
                    onChange={(e) => updateMemberRate({ override_commission_rate: e.target.value })}
                  />
                ) : null}
              </div>
            </div>
          </div>
        </Modal>
      ) : null}

      {isGroupFormOpen ? (
        <Modal
          title={editingGroup ? `Edit Group - ${editingGroup.group_name}` : "Create Seller Group"}
          onClose={() => setIsGroupFormOpen(false)}
          size="xl"
          footer={
            <div className="flex justify-between gap-2">
              <Button onClick={() => setIsGroupFormOpen(false)}>Cancel</Button>
              <Button
                disabled={!canManageRates || saveGroupMutation.isPending || groupRateOverPool}
                onClick={() => saveGroupMutation.mutate({ id: editingGroup?.id, form: groupForm })}
                variant="primary"
              >
                {saveGroupMutation.isPending ? "Saving..." : editingGroup ? "Save Changes" : "Create Seller Group"}
              </Button>
            </div>
          }
        >
          <div className="space-y-5">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <FiSettings className="text-blue-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Group Details</h3>
                  <p className="text-xs text-slate-500">Basic group information and assigned group head.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Input label="Group Name" value={groupForm.group_name} onChange={(e) => setGroupForm((prev) => ({ ...prev, group_name: e.target.value }))} />
                <Input label="Pool Rate (%)" max={100} min={0} step="0.01" type="number" value={groupForm.pool_rate} onChange={(e) => setGroupForm((prev) => ({ ...prev, pool_rate: e.target.value }))} />
                <Select label="Status" value={groupForm.status} onChange={(e) => setGroupForm((prev) => ({ ...prev, status: e.target.value }))}>
                  {statuses.map((status) => (
                    <option key={status} value={status}>{formatText(status)}</option>
                  ))}
                </Select>
                <Select label="Group Head (BNM/Broker)" value={groupForm.group_head_seller_id} onChange={(e) => setGroupForm((prev) => ({ ...prev, group_head_seller_id: e.target.value }))}>
                  <option value="">No group head yet</option>
                  {groupHeadOptions.map((seller) => (
                    <option key={seller.id} value={seller.id}>{seller.full_name} - {formatText(seller.seller_role)}</option>
                  ))}
                </Select>
                <Input label="Notes" value={groupForm.notes} onChange={(e) => setGroupForm((prev) => ({ ...prev, notes: e.target.value }))} />
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Flexible Pool Distribution</h4>
                  <p className="text-xs text-slate-500">Each sale type total must not exceed the group pool.</p>
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
                          <p className={isOverPool ? "font-bold text-red-600" : "font-bold text-slate-900"}>Total {formatRate(total)}</p>
                          <p className="text-slate-500">Remaining {formatRate(remaining)}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {section.roles.map((role) => (
                          <Input
                            key={`${section.key}-${role.key}`}
                            label={`${role.label} Rate (%)`}
                            max={100}
                            min={0}
                            step="0.01"
                            type="number"
                            value={groupForm[section.key][role.key]}
                            onChange={(e) => updateGroupSaleSplit(section.key, role.key, e.target.value)}
                          />
                        ))}
                      </div>

                      {isOverPool ? <p className="mt-3 text-xs font-semibold text-red-600">{section.label} total cannot exceed the pool rate.</p> : null}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  )
}

export default SellerGroups
