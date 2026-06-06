import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { useState } from "react"

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const loginMutation = useMutation({
    mutationKey: ['login'],
    mutationFn: async () => {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          password
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message)
      }

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['token'] })
      navigate('/dashboard')
    }
  })

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          loginMutation.mutate()
        }}
        className="flex flex-col gap-2"
      >
        <h1>Login</h1>

        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {loginMutation.isError && (
          <p className="text-red-500">
            {loginMutation.error.message}
          </p>
        )}

        <button
          className="border border-black px-4 py-1 hover:bg-gray-400"
          disabled={loginMutation.isPending}
        >
          {loginMutation.isPending ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}

export default Login