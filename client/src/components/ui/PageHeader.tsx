import type { ReactNode } from "react"

type PageHeaderProps = {
  actions?: ReactNode
  icon?: ReactNode
  subtitle?: string
  title: string
}

const PageHeader = ({ actions, icon, subtitle, title }: PageHeaderProps) => {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        {icon ? (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-blue-600 shadow-sm">
            {icon}
          </div>
        ) : null}
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold text-slate-900 sm:text-3xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          ) : null}
        </div>
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </div>
  )
}

export default PageHeader
