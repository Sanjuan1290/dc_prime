import { useState, type FormEvent } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1"

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

const getErrorMessage = async (response: Response) => {
  try {
    const data = await response.json()

    if (typeof data.message === "string") {
      return data.message
    }

    return "Something went wrong"
  } catch {
    return "Something went wrong"
  }
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
      default_reservation_fee:
        settingsMap.default_reservation_fee || "10000",
      default_commission_rate:
        settingsMap.default_commission_rate || "5",
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

  const formatMoney = (amount: string | undefined) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(Number(amount || 0))
  }

  const formatText = (value: string | null | undefined) => {
    if (!value) return "-"

    return value
      .replaceAll("_", " ")
      .split(" ")
      .map((word) => word[0]?.toUpperCase() + word.slice(1))
      .join(" ")
  }

  const formatDate = (date: string | null) => {
    if (!date) return "-"

    return date.slice(0, 10)
  }

  if (isLoading) {
    return <p className="p-4">Loading settings...</p>
  }

  if (error) {
    return <p className="p-4">Failed to load settings</p>
  }

  return (
    <div className="p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-sm text-gray-600">
          Manage company details and system default values from MySQL
        </p>
      </div>

      {successMessage && (
        <p className="mb-4 border border-black px-4 py-2 text-green-700">
          {successMessage}
        </p>
      )}

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="border border-black px-4 py-3">
          <p className="text-sm">Company Name</p>
          <h3 className="text-2xl font-bold">
            {settingsMap.company_name || "-"}
          </h3>
          <p className="text-sm text-gray-600">Displayed company name</p>
        </div>

        <div className="border border-black px-4 py-3">
          <p className="text-sm">Default Reservation Fee</p>
          <h3 className="text-2xl font-bold">
            {formatMoney(settingsMap.default_reservation_fee)}
          </h3>
          <p className="text-sm text-gray-600">Default fee for new reservations</p>
        </div>

        <div className="border border-black px-4 py-3">
          <p className="text-sm">Default Commission Rate</p>
          <h3 className="text-2xl font-bold">
            {settingsMap.default_commission_rate || "0"}%
          </h3>
          <p className="text-sm text-gray-600">Default seller commission rate</p>
        </div>
      </div>

      <div className="mb-6 border border-black p-4">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold">System Settings</h2>
            <p className="text-sm text-gray-600">
              Update company info, defaults, and system status
            </p>
          </div>

          {!isEditing && (
            <button
              onClick={loadSettingsToForm}
              className="w-fit border border-black px-4 py-2 hover:bg-gray-200"
            >
              Edit Settings
            </button>
          )}
        </div>

        {!isEditing ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <p>
              <b>Company Name:</b> {settingsMap.company_name || "-"}
            </p>

            <p>
              <b>Company Email:</b> {settingsMap.company_email || "-"}
            </p>

            <p>
              <b>Company Contact:</b> {settingsMap.company_contact || "-"}
            </p>

            <p>
              <b>Company Address:</b> {settingsMap.company_address || "-"}
            </p>

            <p>
              <b>Default Reservation Fee:</b>{" "}
              {formatMoney(settingsMap.default_reservation_fee)}
            </p>

            <p>
              <b>Default Commission Rate:</b>{" "}
              {settingsMap.default_commission_rate || "0"}%
            </p>

            <p>
              <b>System Status:</b>{" "}
              {formatText(settingsMap.system_status || "active")}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSaveSettings} className="flex flex-col gap-4">
            <div>
              <h3 className="mb-3 text-xl font-bold">Company Details</h3>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <input
                  type="text"
                  placeholder="Company name"
                  value={formData.company_name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      company_name: e.target.value,
                    })
                  }
                  className="border border-black px-3 py-2"
                  required
                />

                <input
                  type="email"
                  placeholder="Company email"
                  value={formData.company_email}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      company_email: e.target.value,
                    })
                  }
                  className="border border-black px-3 py-2"
                />

                <input
                  type="text"
                  placeholder="Company contact"
                  value={formData.company_contact}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      company_contact: e.target.value,
                    })
                  }
                  className="border border-black px-3 py-2"
                />

                <input
                  type="text"
                  placeholder="Company address"
                  value={formData.company_address}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      company_address: e.target.value,
                    })
                  }
                  className="border border-black px-3 py-2"
                />
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-xl font-bold">Default Values</h3>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="Default reservation fee"
                  value={formData.default_reservation_fee}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      default_reservation_fee: e.target.value,
                    })
                  }
                  className="border border-black px-3 py-2"
                />

                <input
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="Default commission rate"
                  value={formData.default_commission_rate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      default_commission_rate: e.target.value,
                    })
                  }
                  className="border border-black px-3 py-2"
                />

                <select
                  value={formData.system_status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      system_status: e.target.value,
                    })
                  }
                  className="border border-black px-3 py-2"
                >
                  <option value="active">Active</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
            </div>

            {updateSettingsMutation.isError && (
              <p className="border border-black px-4 py-2 text-red-600">
                {updateSettingsMutation.error.message}
              </p>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={handleCancel}
                className="border border-black px-4 py-2 hover:bg-gray-200"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={updateSettingsMutation.isPending}
                className="border border-black px-4 py-2 hover:bg-gray-200 disabled:opacity-50"
              >
                {updateSettingsMutation.isPending
                  ? "Saving..."
                  : "Save Settings"}
              </button>
            </div>
          </form>
        )}
      </div>

      <div>
        <div className="mb-3">
          <h2 className="text-2xl font-bold">Raw Settings</h2>
          <p className="text-sm text-gray-600">
            Key-value records saved in the settings table
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border border-black text-sm">
            <thead>
              <tr className="border-b border-black">
                <th className="border-r border-black px-4 py-2 text-left">
                  Key ↕
                </th>
                <th className="border-r border-black px-4 py-2 text-left">
                  Value ↕
                </th>
                <th className="border-r border-black px-4 py-2 text-left">
                  Created At ↕
                </th>
                <th className="px-4 py-2 text-left">Updated At ↕</th>
              </tr>
            </thead>

            <tbody>
              {settingsRows.map((setting) => (
                <tr key={setting.id} className="border-b border-black">
                  <td className="border-r border-black px-4 py-2">
                    {setting.setting_key}
                  </td>

                  <td className="border-r border-black px-4 py-2">
                    {setting.setting_value || "-"}
                  </td>

                  <td className="border-r border-black px-4 py-2">
                    {formatDate(setting.created_at)}
                  </td>

                  <td className="px-4 py-2">
                    {formatDate(setting.updated_at)}
                  </td>
                </tr>
              ))}

              {settingsRows.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-gray-600">
                    No settings found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Settings