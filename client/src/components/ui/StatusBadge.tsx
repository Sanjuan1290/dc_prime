import { formatText } from "../../utils/formatters"

type StatusBadgeProps = {
  status: string | null | undefined
}

const toneForStatus = (status: string | null | undefined) => {
  switch (status) {
    case "active":
    case "available":
    case "approved":
    case "complete":
    case "on_time":
    case "submitted":
    case "verified":
    case "converted":
      return {
        badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
        dot: "bg-emerald-500",
      }
    case "pending":
    case "pending_cancellation":
    case "pending_settlement":
    case "approved_for_refund":
    case "reserved":
    case "payable":
    case "late":
    case "on_hold":
    case "partial":
    case "partially_paid":
    case "partially_released":
    case "partially_deducted":
    case "offset":
      return {
        badge: "border-amber-200 bg-amber-50 text-amber-700",
        dot: "bg-amber-500",
      }
    case "cancelled":
    case "discontinued":
    case "approved_as_discontinued":
    case "inactive":
    case "rejected":
    case "absent":
    case "no_time_in":
    case "expired":
    case "deducted":
    case "disapproved":
      return {
        badge: "border-red-200 bg-red-50 text-red-700",
        dot: "bg-red-500",
      }
    case "advance":
    case "refunded":
    case "full_refund":
    case "partial_refund":
    case "refund_released":
    case "sold":
    case "released":
    case "fully_paid":
    case "eligible":
    case "closed":
      return {
        badge: "border-blue-200 bg-blue-50 text-blue-700",
        dot: "bg-blue-500",
      }
    case "hold":
    case "no_refund":
    case "unpaid":
    case "overdue":
      return {
        badge: "border-orange-200 bg-orange-50 text-orange-700",
        dot: "bg-orange-500",
      }
    default:
      return {
        badge: "border-slate-200 bg-slate-50 text-slate-600",
        dot: "bg-slate-400",
      }
  }
}

const StatusBadge = ({ status }: StatusBadgeProps) => {
  const tone = toneForStatus(status)

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${tone.badge}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
      {formatText(status)}
    </span>
  )
}

export default StatusBadge
