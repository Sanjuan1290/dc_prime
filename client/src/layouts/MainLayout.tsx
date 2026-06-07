import { Outlet } from "react-router-dom"

const MainLayout = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white shadow-sm">
            DC
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight text-slate-950">
              D&C Prime
            </p>
            <p className="text-xs text-slate-500">Internal system</p>
          </div>
        </div>

        <a
          className="hidden rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-blue-500 hover:text-blue-600 sm:inline-flex"
          href="mailto:support@dcprime.com"
        >
          Contact support
        </a>
      </header>

      <main className="mx-auto flex w-full max-w-6xl px-5 pb-8 sm:px-8">
        <Outlet />
      </main>

      <footer className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 pb-6 text-xs text-slate-500 sm:px-8">
        <span>© 2026 D&C Prime</span>
        <span className="hidden sm:inline">Secure access for approved users</span>
      </footer>
    </div>
  )
}

export default MainLayout
