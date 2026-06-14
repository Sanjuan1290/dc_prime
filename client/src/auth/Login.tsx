import { useEffect, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useLocation, useNavigate } from "react-router-dom"
import { FiAlertCircle, FiLock, FiMail } from "react-icons/fi"
import Alert from "../components/ui/Alert"
import Button from "../components/ui/Button"
import Input from "../components/ui/Input"
import { API_URL, getErrorMessage } from "../utils/api"
import useCurrentUser from "../utils/useCurrentUser"

const Login = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const location = useLocation()
  const { data: currentUserData, isLoading: isCheckingSession } = useCurrentUser()
  const redirectPath = (location.state as { from?: string } | null)?.from || "/dashboard"

  useEffect(() => {
    if (currentUserData?.user) {
      navigate(redirectPath, { replace: true })
    }
  }, [currentUserData, navigate, redirectPath])

  const loginMutation = useMutation({
    mutationKey: ["login"],
    mutationFn: async () => {
      const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      })

      if (!res.ok) {
        throw new Error(await getErrorMessage(res))
      }

      return res.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["token"] })
      if (data?.user?.must_change_password) {
        navigate("/change-password", { replace: true })
        return
      }
      navigate(redirectPath, { replace: true })
    },
  })

  return (
    <div className="flex min-h-[calc(100vh-9rem)] w-full items-center justify-center py-8">
      <section className="grid w-full max-w-5xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl md:grid-cols-[1fr_1.1fr]">
        <div className="hidden bg-slate-900 p-8 text-white md:flex md:flex-col md:justify-between">
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold">
              DC
            </div>
            <h1 className="mt-8 text-3xl font-bold leading-tight">
              D&C Prime Realty internal system
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Manage projects, listings, clients, collections, payroll, and
              operational reports from one secure workspace.
            </p>
          </div>
          <p className="text-xs text-slate-400">
            Secure access for approved users only
          </p>
        </div>

        <div className="p-6 sm:p-10">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">
              Welcome back
            </p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">
              Sign in
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Use your D&C Prime account credentials to continue.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              loginMutation.mutate()
            }}
            className="space-y-4"
          >
            <div className="relative">
              <FiMail className="pointer-events-none absolute left-3 top-10 h-4 w-4 text-slate-400" />
              <Input
                className="pl-9"
                label="Email"
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@gmail.com"
                type="email"
                value={email}
              />
            </div>

            <div className="relative">
              <FiLock className="pointer-events-none absolute left-3 top-10 h-4 w-4 text-slate-400" />
              <Input
                className="pl-9"
                label="Password"
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                type="password"
                value={password}
              />
            </div>

            {loginMutation.isError ? (
              <Alert type="error">{loginMutation.error.message}</Alert>
            ) : null}

            <Button
              className="w-full"
              disabled={loginMutation.isPending || isCheckingSession}
              icon={<FiAlertCircle className="hidden" />}
              type="submit"
              variant="primary"
            >
              {loginMutation.isPending ? "Signing in..." : isCheckingSession ? "Checking session..." : "Sign in"}
            </Button>
          </form>
        </div>
      </section>
    </div>
  )
}

export default Login
