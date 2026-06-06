import { useState } from "react"

type SystemStatus = "active" | "maintenance"

type SettingsForm = {
  companyName: string
  companyEmail: string
  companyContact: string
  companyAddress: string
  defaultReservationFee: number
  defaultCommissionRate: number
  systemStatus: SystemStatus
}

const Settings = () => {
  const [settings, setSettings] = useState<SettingsForm>({
    companyName: "D&C Prime Realty",
    companyEmail: "admin@gmail.com",
    companyContact: "09123456789",
    companyAddress: "Cavite, Philippines",
    defaultReservationFee: 10000,
    defaultCommissionRate: 5,
    systemStatus: "active",
  })

  const [formData, setFormData] = useState<SettingsForm>(settings)
  const [message, setMessage] = useState("")

  const handleSaveSettings = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    setSettings(formData)
    setMessage("Settings saved")

    setTimeout(() => {
      setMessage("")
    }, 2000)
  }

  const handleReset = () => {
    setFormData(settings)
    setMessage("")
  }

  return (
    <div className="p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-sm text-gray-600">
          Manage company details and default system values
        </p>
      </div>

      <div className="max-w-3xl border border-black p-4">
        <form onSubmit={handleSaveSettings} className="flex flex-col gap-4">
          <div>
            <h2 className="mb-3 text-2xl font-bold">Company Settings</h2>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <input
                type="text"
                placeholder="Company name"
                value={formData.companyName}
                onChange={(e) =>
                  setFormData({ ...formData, companyName: e.target.value })
                }
                className="border border-black px-3 py-2"
                required
              />

              <input
                type="email"
                placeholder="Company email"
                value={formData.companyEmail}
                onChange={(e) =>
                  setFormData({ ...formData, companyEmail: e.target.value })
                }
                className="border border-black px-3 py-2"
              />

              <input
                type="text"
                placeholder="Company contact"
                value={formData.companyContact}
                onChange={(e) =>
                  setFormData({ ...formData, companyContact: e.target.value })
                }
                className="border border-black px-3 py-2"
              />

              <input
                type="text"
                placeholder="Company address"
                value={formData.companyAddress}
                onChange={(e) =>
                  setFormData({ ...formData, companyAddress: e.target.value })
                }
                className="border border-black px-3 py-2"
              />
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-2xl font-bold">Default Values</h2>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <input
                type="number"
                placeholder="Default reservation fee"
                value={formData.defaultReservationFee}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    defaultReservationFee: Number(e.target.value),
                  })
                }
                className="border border-black px-3 py-2"
              />

              <input
                type="number"
                placeholder="Default commission rate"
                value={formData.defaultCommissionRate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    defaultCommissionRate: Number(e.target.value),
                  })
                }
                className="border border-black px-3 py-2"
              />

              <select
                value={formData.systemStatus}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    systemStatus: e.target.value as SystemStatus,
                  })
                }
                className="border border-black px-3 py-2"
              >
                <option value="active">Active</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
          </div>

          {message && (
            <p className="border border-black px-4 py-2">
              {message}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="border border-black px-4 py-2 hover:bg-gray-200"
            >
              Reset
            </button>

            <button
              type="submit"
              className="border border-black px-4 py-2 hover:bg-gray-200"
            >
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Settings