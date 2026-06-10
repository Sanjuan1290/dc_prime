import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Navigate, useLocation, useNavigate } from "react-router-dom"
import { FiAlertCircle, FiLock, FiMail } from "react-icons/fi"
import Alert from "../components/ui/Alert"
import Button from "../components/ui/Button"
import Input from "../components/ui/Input"
import { API_URL, getErrorMessage } from "../utils/api"
import useCurrentUser from "../utils/useCurrentUser"

type LoginLocationState = {
  from?: string
}

type CurrentUserResponse = {
  user?: {
    id?: number
    email?: string
    full_name?: string
    role?: string
  }
}

const Login = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const location = useLocation()

  const {
    data: currentUserData,
    isLoading: isCurrentUserLoading,
  } = useCurrentUser()

  const currentUser = (currentUserData as CurrentUserResponse | null)?.user
  const locationState = location.state as LoginLocationState | null
  const redirectTo = locationState?.from || "/dashboard"

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["token"] })
      navigate(redirectTo, { replace: true })
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Login failed")
    },
  })

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    loginMutation.mutate()
  }

  if (isCurrentUserLoading) {
    return (
      <div className="flex min-h-[calc(100vh-9rem)] w-full items-center justify-center py-8">
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 text-center shadow-sm">
          <p className="text-sm font-semibold text-slate-900">
            Checking session...
          </p>
        </div>
      </div>
    )
  }

  if (currentUser) {
    return <Navigate to="/dashboard" replace />
  }

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

          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm font-semibold">Secure staff access</p>
            <p className="mt-1 text-xs leading-5 text-slate-300">
              Login is required before opening the dashboard and system pages.
            </p>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
              Welcome back
            </p>

            <h2 className="mt-2 text-2xl font-bold text-slate-900">
              Sign in to your account
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Use your admin or staff account to continue.
            </p>
          </div>

          {error ? (
            <Alert variant="error">
              <span className="inline-flex items-center gap-2">
                <FiAlertCircle />
                {error}
              </span>
            </Alert>
          ) : null}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input
              icon={<FiMail />}
              label="Email"
              onChange={(event) => {
                setError("")
                setEmail(event.target.value)
              }}
              placeholder="admin@gmail.com"
              type="email"
              value={email}
            />

            <Input
              icon={<FiLock />}
              label="Password"
              onChange={(event) => {
                setError("")
                setPassword(event.target.value)
              }}
              placeholder="Enter your password"
              type="password"
              value={password}
            />

            <Button
              className="w-full justify-center"
              disabled={loginMutation.isPending}
              type="submit"
            >
              {loginMutation.isPending ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </div>
      </section>
    </div>
  )
}

export default Login