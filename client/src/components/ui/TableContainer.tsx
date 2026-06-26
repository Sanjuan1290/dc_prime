import type { ReactNode } from "react"

type TableContainerProps = {
  children: ReactNode
}

const TableContainer = ({ children }: TableContainerProps) => {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">{children}</div>
    </div>
  )
}

export default TableContainer

