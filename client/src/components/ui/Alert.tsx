import type { ReactNode } from "react"

type AlertVariant = "error" | "info" | "success" | "warning"

type AlertProps = {
  children?: ReactNode
  className?: string
  message?: ReactNode
  title?: ReactNode
  type?: AlertVariant
  variant?: AlertVariant
}

const variantClasses: Record<AlertVariant, string> = {
  error: "border-red-200 bg-red-50 text-red-700",
  info: "border-blue-200 bg-blue-50 text-blue-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
}

const Alert = ({
  children,
  className = "",
  message,
  title,
  type,
  variant = "info",
}: AlertProps) => {
  const tone = type || variant
  const content = title || message || children

  if (!content) return null

  return (
    <div
      className={[
        "mb-4 rounded-lg border px-4 py-3 text-sm font-medium",
        variantClasses[tone],
        className,
      ].join(" ")}
    >
      {content}
    </div>
  )
}

export default Alert

