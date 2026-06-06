import { FaArrowRight, FaEnvelope, FaLock, FaShieldAlt } from "react-icons/fa"

const Login = () => {
  return (
    <section className="grid w-full flex-1 items-center gap-8 py-8 lg:grid-cols-[1fr_420px] lg:py-14">
      <div className="max-w-2xl">
        <div className="mb-8 inline-flex items-center gap-2 rounded-md border border-[#c7e8f3] bg-white px-3 py-2 text-sm font-medium text-[#176b87] shadow-sm">
          <FaShieldAlt className="h-4 w-4" />
          Secure dashboard access
        </div>

        <h1 className="max-w-xl text-4xl font-bold leading-tight text-slate-950 sm:text-5xl">
          Sign in to manage every prime client workflow.
        </h1>

        <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">
          Review accounts, track client activity, and keep operations moving from one focused workspace.
        </p>

        <div className="mt-9 grid max-w-xl gap-4 sm:grid-cols-3">
          {["Protected records", "Fast approvals", "Live reporting"].map((item) => (
            <div key={item} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 h-1.5 w-10 rounded-full bg-[#64ccc5]" />
              <p className="text-sm font-semibold text-slate-800">{item}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="w-full rounded-lg border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70 sm:p-8">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#176b87]">Welcome back</p>
          <h2 className="mt-2 text-3xl font-bold text-slate-950">Login</h2>
          <p className="mt-2 text-sm text-slate-500">Use your registered email to continue.</p>
        </div>

        <form className="space-y-5">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Email address</span>
            <span className="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 transition focus-within:border-[#176b87] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#176b87]/10">
              <FaEnvelope className="h-4 w-4 text-slate-400" />
              <input
                className="w-full bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400"
                placeholder="name@company.com"
                type="email"
              />
            </span>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Password</span>
            <span className="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 focus-within:border-[#176b87] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#176b87]/10">
              <FaLock className="h-4 w-4 text-slate-400" />
              <input
                className="w-full bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400"
                placeholder="Enter password"
                type="password"
              />
            </span>
          </label>

          <div className="flex items-center justify-between gap-4 text-sm">
            <label className="flex items-center gap-2 text-slate-600">
              <input className="h-4 w-4 rounded border-slate-300 text-[#176b87] focus:ring-[#176b87]" type="checkbox" />
              Remember me
            </label>
            <a className="font-medium text-[#176b87] hover:text-[#0f4d63]" href="/">
              Forgot password?
            </a>
          </div>

          <button
            className="flex w-full items-center justify-center gap-2 rounded-md bg-[#176b87] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#176b87]/20 transition hover:bg-[#0f4d63] focus:outline-none focus:ring-4 focus:ring-[#176b87]/20"
            type="submit"
          >
            Sign in
            <FaArrowRight className="h-4 w-4" />
          </button>
        </form>

        <p className="mt-7 text-center text-sm text-slate-500">
          New to DC Prime?{" "}
          <a className="font-semibold text-[#176b87] hover:text-[#0f4d63]" href="/">
            Request access
          </a>
        </p>
      </div>
    </section>
  )
}

export default Login
