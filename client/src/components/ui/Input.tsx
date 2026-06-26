import type { InputHTMLAttributes, ReactNode } from "react"

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  icon?: ReactNode
  label?: string
}

const Input = ({ className = "", icon, label, ...props }: InputProps) => {
  return (
    <label className="block">
      {label ? (
        <span className="mb-1.5 block text-sm font-semibold text-slate-700">
          {label}
        </span>
      ) : null}
      <span className="relative block">
        {icon ? (
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
            {icon}
          </span>
        ) : null}
        <input
          className={[
            "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100",
            icon ? "pl-9" : "",
            className,
          ].join(" ")}
          {...props}
        />
      </span>
    </label>
  )
}

export default Input

