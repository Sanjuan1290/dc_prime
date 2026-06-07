import type { ReactNode } from "react"

type StatCardProps = {
  className?: string
  description?: ReactNode
  icon?: ReactNode
  label?: ReactNode
  title?: ReactNode
  value: ReactNode
}

const StatCard = ({
  className = "",
  description,
  icon,
  label,
  title,
  value,
}: StatCardProps) => {
  return (
    <div
      className={[
        "rounded-xl border border-slate-200 bg-white p-4 shadow-sm",
        className,
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-500">
            {label || title}
          </p>
          <p className="mt-2 truncate text-2xl font-bold text-slate-900">
            {value}
          </p>
        </div>
        {icon ? (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            {icon}
          </div>
        ) : null}
      </div>
      {description ? (
        <p className="mt-2 text-sm text-slate-500">{description}</p>
      ) : null}
    </div>
  )
}

export default StatCard
