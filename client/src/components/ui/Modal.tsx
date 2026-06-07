import type { ReactNode } from "react"
import { FiX } from "react-icons/fi"
import Button from "./Button"

type ModalProps = {
  children: ReactNode
  footer?: ReactNode
  onClose: () => void
  size?: "md" | "lg" | "xl"
  title: string
}

const sizeClasses = {
  md: "max-w-2xl",
  lg: "max-w-4xl",
  xl: "max-w-6xl",
}

const Modal = ({ children, footer, onClose, size = "md", title }: ModalProps) => {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/50 p-4">
      <div
        className={[
          "max-h-[92vh] w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl",
          sizeClasses[size],
        ].join(" ")}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-5 py-4">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <Button
            aria-label="Close modal"
            icon={<FiX />}
            onClick={onClose}
            variant="ghost"
          />
        </div>
        <div className="max-h-[calc(92vh-8rem)] overflow-y-auto px-5 py-4">
          {children}
        </div>
        {footer ? (
          <div className="border-t border-slate-200 bg-slate-50 px-5 py-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default Modal
