import { formatText } from "../../utils/formatters"

type StatusBadgeProps = {
  status: string | null | undefined
}

const colorForStatus = (status: string | null | undefined) => {
  switch (status) {
    case "active":
    case "available":
    case "approved":
    case "complete":
    case "on_time":
    case "submitted":
      return "border-emerald-200 bg-emerald-50 text-emerald-700"
    case "pending":
    case "reserved":
    case "payable":
    case "late":
    case "on_hold":
      return "border-amber-200 bg-amber-50 text-amber-700"
    case "cancelled":
    case "inactive":
    case "rejected":
    case "absent":
    case "no_time_in":
      return "border-red-200 bg-red-50 text-red-700"
    case "sold":
    case "released":
    case "fully_paid":
    case "eligible":
      return "border-blue-200 bg-blue-50 text-blue-700"
    default:
      return "border-slate-200 bg-slate-50 text-slate-600"
  }
}

const StatusBadge = ({ status }: StatusBadgeProps) => {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${colorForStatus(status)}`}>
      {formatText(status)}
    </span>
  )
}

export default StatusBadge
