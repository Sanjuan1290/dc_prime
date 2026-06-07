import { useState, type FormEvent } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { FiEdit2, FiRefreshCw, FiSave, FiSettings } from "react-icons/fi"
import Alert from "../components/ui/Alert"
import Button from "../components/ui/Button"
import EmptyState from "../components/ui/EmptyState"
import Input from "../components/ui/Input"
import LoadingState from "../components/ui/LoadingState"
import PageHeader from "../components/ui/PageHeader"
import Select from "../components/ui/Select"
import StatCard from "../components/ui/StatCard"
import StatusBadge from "../components/ui/StatusBadge"
import TableContainer from "../components/ui/TableContainer"
import { API_URL, getErrorMessage } from "../utils/api"
import { formatDate, formatMoney, formatText } from "../utils/formatters"

type SettingsMap = {
  company_name?: string
  company_email?: string
  company_contact?: string
  company_address?: string
  default_reservation_fee?: string
  default_commission_rate?: string
  system_status?: string
}

type SettingRow = {
  id: number
  setting_key: string
  setting_value: string | null
  created_at: string
  updated_at: string
}

type SettingsResponse = {
  settings: SettingRow[]
  settingsMap: SettingsMap
}

type SettingsFormData = {
  company_name: string
  company_email: string
  company_contact: string
  company_address: string
  default_reservation_fee: string
  default_commission_rate: string
  system_status: string
}

const emptyFormData: SettingsFormData = {
  company_name: "",
  company_email: "",
  company_contact: "",
  company_address: "",
  default_reservation_fee: "10000",
  default_commission_rate: "5",
  system_status: "active",
}

const fetchSettings = async (): Promise<SettingsResponse> => {
  const res = await fetch(`${API_URL}/settings`, {
    credentials: "include",
  })

  if (!res.ok) {
    throw new Error(await getErrorMessage(res))
  }

  return res.json()
}

const updateSettings = async (settingsData: SettingsFormData) => {
  const res = await fetch(`${API_URL}/settings`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(settingsData),
  })

  if (!res.ok) {
    throw new Error(await getErrorMessage(res))
  }

  return res.json()
}

const Settings = () => {
  const queryClient = useQueryClient()

  const [formData, setFormData] = useState<SettingsFormData>(emptyFormData)
  const [isEditing, setIsEditing] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  const {
    data,
    isLoading,
    error,
  } = useQuery<SettingsResponse>({
    queryKey: ["settings"],
    queryFn: fetchSettings,
  })

  const updateSettingsMutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] })
      setIsEditing(false)
      setSuccessMessage("Settings saved successfully")

      setTimeout(() => {
        setSuccessMessage("")
      }, 2500)
    },
  })

  const settingsMap = data?.settingsMap || {}
  const settingsRows = data?.settings || []

  const loadSettingsToForm = () => {
    setFormData({
      company_name: settingsMap.company_name || "",
      company_email: settingsMap.company_email || "",
      company_contact: settingsMap.company_contact || "",
      company_address: settingsMap.company_address || "",
      default_reservation_fee: settingsMap.default_reservation_fee || "10000",
      default_commission_rate: settingsMap.default_commission_rate || "5",
      system_status: settingsMap.system_status || "active",
    })

    setIsEditing(true)
    setSuccessMessage("")
  }

  const handleSaveSettings = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    updateSettingsMutation.mutate(formData)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setFormData(emptyFormData)
    setSuccessMessage("")
  }

  if (isLoading) {
    return <LoadingState label="Loading settings..." />
  }

  if (error) {
    return <Alert title="Failed to load settings" variant="error" />
  }

  return (
    <div className="p-4 sm:p-6">
      <PageHeader
        icon={<FiSettings />}
        title="Settings"
        subtitle="Manage company details and system default values from MySQL"
        actions={
          !isEditing ? (
            <Button icon={<FiEdit2 />} onClick={loadSettingsToForm} variant="primary">
              Edit Settings
            </Button>
          ) : null
        }
      />

      {successMessage ? <Alert title={successMessage} variant="success" /> : null}

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard
          label="Company Name"
          value={settingsMap.company_name || "-"}
          description="Displayed company name"
        />
        <StatCard
          label="Reservation Fee"
          value={formatMoney(settingsMap.default_reservation_fee)}
          description="Default for reservations"
        />
        <StatCard
          label="Commission Rate"
          value={`${settingsMap.default_commission_rate || "0"}%`}
          description="Default seller rate"
        />
        <StatCard
          label="System Status"
          value={formatText(settingsMap.system_status || "active")}
          description="Current operating mode"
        />
      </div>

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">System Settings</h2>
            <p className="mt-1 text-sm text-slate-500">
              Update company info, defaults, and system status.
            </p>
          </div>
          {isEditing ? (
            <Button icon={<FiRefreshCw />} onClick={handleCancel}>
              Cancel Editing
            </Button>
          ) : null}
        </div>

        {!isEditing ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <SettingDisplay label="Company Name" value={settingsMap.company_name} />
            <SettingDisplay label="Company Email" value={settingsMap.company_email} />
            <SettingDisplay
              label="Company Contact"
              value={settingsMap.company_contact}
            />
            <SettingDisplay
              label="Company Address"
              value={settingsMap.company_address}
            />
            <SettingDisplay
              label="Default Reservation Fee"
              value={formatMoney(settingsMap.default_reservation_fee)}
            />
            <SettingDisplay
              label="Default Commission Rate"
              value={`${settingsMap.default_commission_rate || "0"}%`}
            />
            <div className="rounded-lg border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-500">
                System Status
              </p>
              <div className="mt-2">
                <StatusBadge status={settingsMap.system_status || "active"} />
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSaveSettings} className="space-y-6">
            <div>
              <h3 className="mb-3 text-base font-bold text-slate-900">
                Company Details
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Input
                  label="Company Name"
                  value={formData.company_name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      company_name: e.target.value,
                    })
                  }
                  required
                />
                <Input
                  label="Company Email"
                  type="email"
                  value={formData.company_email}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      company_email: e.target.value,
                    })
                  }
                />
                <Input
                  label="Company Contact"
                  value={formData.company_contact}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      company_contact: e.target.value,
                    })
                  }
                />
                <Input
                  label="Company Address"
                  value={formData.company_address}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      company_address: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-base font-bold text-slate-900">
                Default Values
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Input
                  label="Default Reservation Fee"
                  type="number"
                  min={0}
                  step="0.01"
                  value={formData.default_reservation_fee}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      default_reservation_fee: e.target.value,
                    })
                  }
                />
                <Input
                  label="Default Commission Rate"
                  type="number"
                  min={0}
                  step="0.01"
                  value={formData.default_commission_rate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      default_commission_rate: e.target.value,
                    })
                  }
                />
                <Select
                  label="System Status"
                  value={formData.system_status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      system_status: e.target.value,
                    })
                  }
                >
                  <option value="active">Active</option>
                  <option value="maintenance">Maintenance</option>
                </Select>
              </div>
            </div>

            {updateSettingsMutation.error instanceof Error ? (
              <Alert
                title={updateSettingsMutation.error.message}
                variant="error"
              />
            ) : null}

            <div className="flex justify-end gap-2">
              <Button onClick={handleCancel}>Cancel</Button>
              <Button
                disabled={updateSettingsMutation.isPending}
                icon={<FiSave />}
                type="submit"
                variant="primary"
              >
                {updateSettingsMutation.isPending
                  ? "Saving..."
                  : "Save Settings"}
              </Button>
            </div>
          </form>
        )}
      </div>

      <div className="mb-3">
        <h2 className="text-xl font-bold text-slate-900">Raw Settings</h2>
        <p className="mt-1 text-sm text-slate-500">
          Key-value records saved in the settings table.
        </p>
      </div>

      <TableContainer>
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">
                Key
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">
                Value
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">
                Created At
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">
                Updated At
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {settingsRows.map((setting) => (
              <tr key={setting.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-semibold text-slate-900">
                  {setting.setting_key}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {setting.setting_value || "-"}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {formatDate(setting.created_at)}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {formatDate(setting.updated_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {settingsRows.length === 0 ? <EmptyState title="No settings found" /> : null}
      </TableContainer>
    </div>
  )
}

const SettingDisplay = ({
  label,
  value,
}: {
  label: string
  value: string | null | undefined
}) => {
  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-2 font-medium text-slate-900">{value || "-"}</p>
    </div>
  )
}

export default Settings
