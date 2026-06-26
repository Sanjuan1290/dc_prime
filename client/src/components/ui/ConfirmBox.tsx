import type { ReactNode } from "react"
import { FiAlertCircle } from "react-icons/fi"
import Button from "./Button"

type ConfirmBoxProps = {
  cancelLabel?: string
  confirmLabel?: string
  message: ReactNode
  onCancel: () => void
  onConfirm: () => void
  title?: string
}

const ConfirmBox = ({
  cancelLabel = "Cancel",
  confirmLabel = "Confirm",
  message,
  onCancel,
  onConfirm,
  title = "Confirm action",
}: ConfirmBoxProps) => {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
      <div className="flex gap-3">
        <FiAlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <h3 className="font-semibold">{title}</h3>
          <div className="mt-1 text-sm">{message}</div>
          <div className="mt-4 flex gap-2">
            <Button onClick={onCancel} variant="secondary">
              {cancelLabel}
            </Button>
            <Button onClick={onConfirm} variant="danger">
              {confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConfirmBox

