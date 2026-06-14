import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { FiGrid, FiMail, FiPhone, FiUser } from "react-icons/fi"
import Alert from "../components/ui/Alert"
import LoadingState from "../components/ui/LoadingState"
import PageHeader from "../components/ui/PageHeader"
import Pagination from "../components/ui/Pagination"
import TableContainer from "../components/ui/TableContainer"
import { API_URL, getErrorMessage } from "../utils/api"
import { formatMoney, formatNumber, formatText } from "../utils/formatters"
import { paginateRows } from "../utils/pagination"

type Unit = {
  id: number
  unit_id: string
  project_name: string
  location: string
  location_code: string
  lot_type: string
  lot_area_sqm: number | string
  price_per_sqm: number | string
  total_contract_price: number | string
  reservation_fee: number | string
  status: string
}

type SettingRow = {
  setting_key: string
  setting_value: string | null
}

type SettingsMap = {
  company_name?: string
  company_email?: string
  company_contact?: string
  reservation_contact_name?: string
  reservation_contact_email?: string
  reservation_contact_no?: string
}

type SettingsResponse = {
  settings?: SettingRow[]
  settingsMap?: SettingsMap
}

const fetchAvailableUnits = async () => {
  const res = await fetch(`${API_URL}/seller/available-units`, { credentials: "include" })
  if (!res.ok) throw new Error(await getErrorMessage(res))
  const data = await res.json()
  return (data.units || data.data || []) as Unit[]
}

const fetchSettings = async () => {
  const res = await fetch(`${API_URL}/settings`, { credentials: "include" })
  if (!res.ok) throw new Error(await getErrorMessage(res))
  return res.json() as Promise<SettingsResponse>
}

const getNonEmptyValue = (...values: Array<string | null | undefined>) => {
  return values.find((value) => typeof value === "string" && value.trim().length > 0)?.trim()
}

const buildSettingsMap = (settingsData?: SettingsResponse): SettingsMap => {
  const rowMap = (settingsData?.settings || []).reduce<SettingsMap>((map, setting) => {
    map[setting.setting_key as keyof SettingsMap] = setting.setting_value || ""
    return map
  }, {})

  return {
    ...rowMap,
    ...(settingsData?.settingsMap || {}),
  }
}

const AvailableUnits = () => {
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const { data = [], isLoading, error } = useQuery({
    queryKey: ["seller-available-units"],
    queryFn: fetchAvailableUnits,
  })
  const { data: settingsData, error: settingsError } = useQuery({
    queryKey: ["settings", "reservation-contact"],
    queryFn: fetchSettings,
  })

  const paginatedUnits = useMemo(
    () => paginateRows(data, page, rowsPerPage),
    [data, page, rowsPerPage]
  )

  const settings = buildSettingsMap(settingsData)
  const contactName = getNonEmptyValue(
    settings.reservation_contact_name,
    settings.company_name,
    "D&C Prime Realty Admin"
  )
  const contactEmail = getNonEmptyValue(
    settings.reservation_contact_email,
    settings.company_email,
    "admin@gmail.com"
  )
  const contactNo = getNonEmptyValue(
    settings.reservation_contact_no,
    settings.company_contact,
    "09000000000"
  )

  return (
    <div className="p-6">
      <PageHeader
        icon={<FiGrid />}
        title="Available Units"
        subtitle="Read-only list. Coordinate tripping or reservation with admin."
        actions={
          <div className="w-full max-w-sm rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900 shadow-sm sm:w-80">
            <p className="font-bold">Reservation Assistance</p>
            <p className="mt-1 text-xs text-blue-700">For reservation requests or unit questions, contact:</p>
            <div className="mt-3 space-y-1.5">
              <p className="flex items-center gap-2"><FiUser className="shrink-0" /> <span>{contactName}</span></p>
              <p className="flex items-center gap-2"><FiMail className="shrink-0" /> <span className="break-all">{contactEmail}</span></p>
              <p className="flex items-center gap-2"><FiPhone className="shrink-0" /> <span>{contactNo}</span></p>
            </div>
          </div>
        }
      />
      {error ? <Alert variant="error" title={error instanceof Error ? error.message : "Failed to load units"} /> : null}
      {settingsError ? (
        <Alert
          variant="warning"
          title="Reservation contact settings were not loaded. Default contact details are being shown."
        />
      ) : null}
      {isLoading ? <LoadingState label="Loading available units..." /> : null}
      {!isLoading ? (
        <>
          <TableContainer>
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-200">
                  <th className="px-4 py-3 text-left">Unit</th>
                  <th className="px-4 py-3 text-left">Project</th>
                  <th className="px-4 py-3 text-left">Area</th>
                  <th className="px-4 py-3 text-left">Price/SQM</th>
                  <th className="px-4 py-3 text-left">TCP</th>
                  <th className="px-4 py-3 text-left">Reservation</th>
                  <th className="px-4 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUnits.map((unit) => (
                  <tr className="border-b border-slate-100" key={unit.id}>
                    <td className="px-4 py-3 font-semibold text-slate-900">{unit.unit_id}</td>
                    <td className="px-4 py-3 text-slate-600">{unit.project_name}<br/><span className="text-xs text-slate-400">{unit.location}</span></td>
                    <td className="px-4 py-3 text-slate-600">{formatNumber(unit.lot_area_sqm)} sqm</td>
                    <td className="px-4 py-3 text-slate-600">{formatMoney(unit.price_per_sqm)}</td>
                    <td className="px-4 py-3 text-slate-600">{formatMoney(unit.total_contract_price)}</td>
                    <td className="px-4 py-3 text-slate-600">{formatMoney(unit.reservation_fee)}</td>
                    <td className="px-4 py-3 text-slate-600">{formatText(unit.status)}</td>
                  </tr>
                ))}
                {!paginatedUnits.length ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500">No available units found.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </TableContainer>
          <Pagination
            page={page}
            rowsPerPage={rowsPerPage}
            totalRows={data.length}
            onPageChange={setPage}
            onRowsPerPageChange={setRowsPerPage}
          />
        </>
      ) : null}
    </div>
  )
}

export default AvailableUnits
