import { useQuery } from "@tanstack/react-query"
import { FiGrid } from "react-icons/fi"
import Alert from "../components/ui/Alert"
import LoadingState from "../components/ui/LoadingState"
import PageHeader from "../components/ui/PageHeader"
import TableContainer from "../components/ui/TableContainer"
import { API_URL, getErrorMessage } from "../utils/api"
import { formatMoney, formatNumber, formatText } from "../utils/formatters"

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

const fetchAvailableUnits = async () => {
  const res = await fetch(`${API_URL}/seller/available-units`, { credentials: "include" })
  if (!res.ok) throw new Error(await getErrorMessage(res))
  const data = await res.json()
  return (data.units || data.data || []) as Unit[]
}

const AvailableUnits = () => {
  const { data = [], isLoading, error } = useQuery({ queryKey: ["seller-available-units"], queryFn: fetchAvailableUnits })

  return (
    <div className="p-6">
      <PageHeader icon={<FiGrid />} title="Available Units" subtitle="Read-only list. Coordinate tripping or reservation with admin." />
      {error ? <Alert variant="error" title={error instanceof Error ? error.message : "Failed to load units"} /> : null}
      {isLoading ? <LoadingState label="Loading available units..." /> : null}
      {!isLoading ? (
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
              {data.map((unit) => (
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
            </tbody>
          </table>
        </TableContainer>
      ) : null}
    </div>
  )
}

export default AvailableUnits
