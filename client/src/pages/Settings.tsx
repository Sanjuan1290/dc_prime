import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FiEdit2, FiRefreshCw, FiSave, FiSettings } from "react-icons/fi";
import Alert from "../components/ui/Alert";
import Button from "../components/ui/Button";
import EmptyState from "../components/ui/EmptyState";
import Input from "../components/ui/Input";
import LoadingState from "../components/ui/LoadingState";
import PageHeader from "../components/ui/PageHeader";
import Select from "../components/ui/Select";
import StatCard from "../components/ui/StatCard";
import StatusBadge from "../components/ui/StatusBadge";
import TableContainer from "../components/ui/TableContainer";
import { API_URL, getErrorMessage } from "../utils/api";
import useCurrentUser from "../utils/useCurrentUser";
import { formatDate, formatText } from "../utils/formatters";

type SettingsMap = {
  company_name?: string;
  company_email?: string;
  company_contact?: string;
  company_address?: string;
  system_status?: string;
  reservation_contact_name?: string;
  reservation_contact_email?: string;
  reservation_contact_no?: string;
  commission_release_days?: string;
};

type SettingRow = {
  id: number;
  setting_key: string;
  setting_value: string | null;
  created_at: string;
  updated_at: string;
};

type SettingsResponse = {
  settings: SettingRow[];
  settingsMap: SettingsMap;
};

type SettingsFormData = {
  company_name: string;
  company_email: string;
  company_contact: string;
  company_address: string;
  system_status: string;
  reservation_contact_name: string;
  reservation_contact_email: string;
  reservation_contact_no: string;
  commission_release_days: string;
};

type CurrentUserResponse = {
  user?: {
    id: number;
    full_name: string;
    email: string;
    role: string;
    status: string;
    must_change_password?: number;
  };
  role?: string;
  isLoggedIn?: boolean;
};

const emptyFormData: SettingsFormData = {
  company_name: "",
  company_email: "",
  company_contact: "",
  company_address: "",
  system_status: "active",
  reservation_contact_name: "",
  reservation_contact_email: "",
  reservation_contact_no: "",
  commission_release_days: "7,22",
};

const hiddenRawKeys = ["default_reservation_fee", "default_commission_rate"];

const fetchSettings = async (): Promise<SettingsResponse> => {
  const res = await fetch(`${API_URL}/settings`, {
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(await getErrorMessage(res));
  }

  return res.json();
};

const updateSettings = async (settingsData: Partial<SettingsFormData>) => {
  const res = await fetch(`${API_URL}/settings`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(settingsData),
  });

  if (!res.ok) {
    throw new Error(await getErrorMessage(res));
  }

  return res.json();
};

const Settings = () => {
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<SettingsFormData>(emptyFormData);
  const [isEditing, setIsEditing] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const { data: currentUser } = useCurrentUser() as {
    data?: CurrentUserResponse | null;
  };

  const currentUserRole = currentUser?.user?.role || currentUser?.role || "";
  const isSuperAdmin =
    String(currentUserRole).trim().toLowerCase() === "super_admin";

  const { data, isLoading, error } = useQuery<SettingsResponse>({
    queryKey: ["settings"],
    queryFn: fetchSettings,
    retry: false,
  });

  const updateSettingsMutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      queryClient.invalidateQueries({ queryKey: ["commission-summary"] });
      setIsEditing(false);
      setSuccessMessage("Settings saved successfully");

      setTimeout(() => {
        setSuccessMessage("");
      }, 2500);
    },
  });

  const settingsMap = data?.settingsMap || {};
  const settingsRows = (data?.settings || []).filter(
    (setting) => !hiddenRawKeys.includes(setting.setting_key),
  );

  const loadSettingsToForm = () => {
    setFormData({
      company_name: settingsMap.company_name || "",
      company_email: settingsMap.company_email || "",
      company_contact: settingsMap.company_contact || "",
      company_address: settingsMap.company_address || "",
      system_status: settingsMap.system_status || "active",
      reservation_contact_name:
        settingsMap.reservation_contact_name || settingsMap.company_name || "",
      reservation_contact_email:
        settingsMap.reservation_contact_email || settingsMap.company_email || "",
      reservation_contact_no:
        settingsMap.reservation_contact_no || settingsMap.company_contact || "",
      commission_release_days: settingsMap.commission_release_days || "7,22",
    });

    setIsEditing(true);
    setSuccessMessage("");
  };

  const handleSaveSettings = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const payload: Partial<SettingsFormData> = { ...formData };

    if (!isSuperAdmin) {
      delete payload.commission_release_days;
    }

    updateSettingsMutation.mutate(payload);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData(emptyFormData);
    setSuccessMessage("");
  };

  if (isLoading) {
    return <LoadingState label="Loading settings..." />;
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6">
        <Alert
          title="Failed to load settings"
          message={error instanceof Error ? error.message : "Request failed"}
          variant="error"
        />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <PageHeader
        icon={<FiSettings />}
        title="Settings"
        subtitle="Manage company details, seller reservation contact, system status, and commission release schedule."
        actions={
          !isEditing ? (
            <Button
              icon={<FiEdit2 />}
              onClick={loadSettingsToForm}
              variant="primary"
            >
              Edit Settings
            </Button>
          ) : null
        }
      />

      {successMessage ? <Alert title={successMessage} variant="success" /> : null}

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Company Name"
          value={settingsMap.company_name || "-"}
          description="Displayed company name"
        />
        <StatCard
          label="Reservation Contact"
          value={
            settingsMap.reservation_contact_name ||
            settingsMap.company_name ||
            "-"
          }
          description="Shown to sellers in Available Units"
        />
        <StatCard
          label="System Status"
          value={formatText(settingsMap.system_status || "active")}
          description="Current operating mode"
        />
        <StatCard
          label="Commission Release Days"
          value={formatReleaseDays(settingsMap.commission_release_days)}
          description={
            isSuperAdmin
              ? "Editable by your account"
              : "Only super admin can edit"
          }
        />
      </div>

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              System Settings
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Update company info, seller reservation contact, system status,
              and commission release schedule.
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
            <SettingDisplay
              label="Company Name"
              value={settingsMap.company_name}
            />
            <SettingDisplay
              label="Company Email"
              value={settingsMap.company_email}
            />
            <SettingDisplay
              label="Company Contact"
              value={settingsMap.company_contact}
            />
            <SettingDisplay
              label="Company Address"
              value={settingsMap.company_address}
            />
            <SettingDisplay
              label="Reservation Contact Name"
              value={
                settingsMap.reservation_contact_name || settingsMap.company_name
              }
            />
            <SettingDisplay
              label="Reservation Contact Email"
              value={
                settingsMap.reservation_contact_email ||
                settingsMap.company_email
              }
            />
            <SettingDisplay
              label="Reservation Contact Number"
              value={
                settingsMap.reservation_contact_no ||
                settingsMap.company_contact
              }
            />
            <SettingDisplay
              label="Commission Release Days"
              value={formatReleaseDays(settingsMap.commission_release_days)}
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
                    setFormData({ ...formData, company_name: e.target.value })
                  }
                  required
                />
                <Input
                  label="Company Email"
                  type="email"
                  value={formData.company_email}
                  onChange={(e) =>
                    setFormData({ ...formData, company_email: e.target.value })
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
                Seller Reservation Contact
              </h3>

              <p className="mb-3 text-sm text-slate-500">
                This is shown on the Available Units page so sellers know who to
                contact for reservation requests or questions.
              </p>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Input
                  label="Contact Name"
                  value={formData.reservation_contact_name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      reservation_contact_name: e.target.value,
                    })
                  }
                  placeholder="Admin / Reservation Officer"
                />
                <Input
                  label="Contact Email"
                  type="email"
                  value={formData.reservation_contact_email}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      reservation_contact_email: e.target.value,
                    })
                  }
                  placeholder="admin@email.com"
                />
                <Input
                  label="Contact Number"
                  value={formData.reservation_contact_no}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      reservation_contact_no: e.target.value,
                    })
                  }
                  placeholder="09xxxxxxxxx"
                />
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-base font-bold text-slate-900">
                Commission Release Schedule
              </h3>

              <p className="mb-3 text-sm text-slate-500">
                Set the only calendar days of the month when eligible
                commissions may be released. Use comma-separated days from 1 to
                31.
              </p>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Input
                  disabled={!isSuperAdmin}
                  label="Release Days"
                  value={formData.commission_release_days}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      commission_release_days: e.target.value,
                    })
                  }
                  placeholder="7,22"
                />
              </div>

              {!isSuperAdmin ? (
                <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700">
                  Only Super Admin can edit commission release days. Admin
                  accounts can view this setting only.
                </p>
              ) : (
                <p className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
                  You are logged in as Super Admin. You can edit commission
                  release days.
                </p>
              )}
            </div>

            <div>
              <h3 className="mb-3 text-base font-bold text-slate-900">
                System Status
              </h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Select
                  label="System Status"
                  value={formData.system_status}
                  onChange={(e) =>
                    setFormData({ ...formData, system_status: e.target.value })
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

        {settingsRows.length === 0 ? (
          <EmptyState title="No settings found" />
        ) : null}
      </TableContainer>
    </div>
  );
};

const formatReleaseDays = (value: string | null | undefined) => {
  const rawDays = String(value || "7,22")
    .split(",")
    .map((day) => Number(day.trim()))
    .filter((day) => Number.isInteger(day) && day >= 1 && day <= 31);

  const days = Array.from(new Set(rawDays)).sort((a, b) => a - b);

  if (!days.length) return "7th, 22nd";

  return days.map((day) => `${day}${getOrdinalSuffix(day)}`).join(", ");
};

const getOrdinalSuffix = (day: number) => {
  if (day >= 11 && day <= 13) return "th";

  switch (day % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
};

const SettingDisplay = ({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) => {
  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-2 font-medium text-slate-900">{value || "-"}</p>
    </div>
  );
};

export default Settings;
