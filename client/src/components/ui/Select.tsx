import type { SelectHTMLAttributes } from "react"

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string
}

const Select = ({ children, className = "", label, ...props }: SelectProps) => {
  return (
    <label className="block">
      {label ? (
        <span className="mb-1.5 block text-sm font-semibold text-slate-700">
          {label}
        </span>
      ) : null}
      <select
        className={[
          "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100",
          className,
        ].join(" ")}
        {...props}
      >
        {children}
      </select>
    </label>
  )
}

export default Select

