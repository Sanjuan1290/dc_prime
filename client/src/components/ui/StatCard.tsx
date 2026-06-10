import { useState, type ReactNode } from "react"

 type StatCardProps = {
  className?: string
  description?: ReactNode
  formula?: ReactNode
  icon?: ReactNode
  label?: ReactNode
  title?: ReactNode
  value: ReactNode
}

const StatCard = ({
  className = "",
  description,
  formula,
  icon,
  label,
  title,
  value,
}: StatCardProps) => {
  const [isFlipped, setIsFlipped] = useState(false)
  const canFlip = Boolean(formula)

  return (
    <button
      className={[
        "group min-h-[148px] w-full rounded-xl border border-slate-200 bg-white p-0 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-100",
        canFlip ? "cursor-pointer" : "cursor-default",
        className,
      ].join(" ")}
      disabled={!canFlip}
      onClick={() => canFlip && setIsFlipped((current) => !current)}
      type="button"
    >
      <div className="relative min-h-[148px] overflow-hidden rounded-xl">
        <div
          className={[
            "absolute inset-0 p-4 transition duration-200",
            isFlipped ? "opacity-0" : "opacity-100",
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
          {formula ? (
            <p className="mt-3 text-xs font-semibold text-blue-600">
              Click to view formula
            </p>
          ) : null}
        </div>

        {formula ? (
          <div
            className={[
              "absolute inset-0 overflow-y-auto bg-slate-900 p-4 text-white transition duration-200",
              isFlipped ? "opacity-100" : "opacity-0",
            ].join(" ")}
          >
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-200">
              Formula
            </p>
            <div className="mt-2 text-sm leading-6 text-slate-100">
              {formula}
            </div>
            <p className="mt-3 text-xs text-slate-300">
              Click again to return
            </p>
          </div>
        ) : null}
      </div>
    </button>
  )
}

export default StatCard
