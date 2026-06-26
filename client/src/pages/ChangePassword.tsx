import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { FiLock } from "react-icons/fi"
import Alert from "../components/ui/Alert"
import Button from "../components/ui/Button"
import Input from "../components/ui/Input"
import PageHeader from "../components/ui/PageHeader"
import { API_URL, getErrorMessage } from "../utils/api"

const ChangePassword = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [message, setMessage] = useState("")

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_URL}/change-password`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
          confirm_password: confirmPassword,
        }),
      })

      if (!res.ok) throw new Error(await getErrorMessage(res))
      return res.json()
    },
    onSuccess: async () => {
      setMessage("Password changed successfully")
      await queryClient.invalidateQueries({ queryKey: ["token"] })
      navigate("/dashboard", { replace: true })
    },
  })

  return (
    <div className="mx-auto max-w-xl p-6">
      <PageHeader icon={<FiLock />} title="Change Password" subtitle="Your account is using a temporary password. Create your own password to continue." />

      {message ? <Alert variant="success" title={message} /> : null}
      {mutation.error ? <Alert variant="error" title={mutation.error instanceof Error ? mutation.error.message : "Failed to change password"} /> : null}

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="space-y-4">
          <Input label="Temporary / Current Password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          <Input label="New Password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          <Input label="Confirm New Password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          <Button className="w-full" disabled={mutation.isPending} onClick={() => mutation.mutate()} variant="primary">
            {mutation.isPending ? "Saving..." : "Change Password"}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ChangePassword

