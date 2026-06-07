import type { ReactNode } from "react"

type EmptyStateProps = {
  action?: ReactNode
  description?: ReactNode
  icon?: ReactNode
  message?: ReactNode
  title?: ReactNode
}

const EmptyState = ({
  action,
  description,
  icon,
  message,
  title = "No records found",
}: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
      {icon ? (
        <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
          {icon}
        </div>
      ) : null}
      <h3 className="text-base font-bold text-slate-900">{title}</h3>
      {description || message ? (
        <p className="max-w-md text-sm text-slate-500">
          {description || message}
        </p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  )
}

export default EmptyState
