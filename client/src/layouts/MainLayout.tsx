import { Outlet } from "react-router-dom"

const MainLayout = () => {
  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-950">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#176b87] text-sm font-bold text-white shadow-sm">
            DC
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight text-slate-950">DC Prime</p>
            <p className="text-xs text-slate-500">Client portal</p>
          </div>
        </div>

        <a
          className="hidden rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-[#176b87] hover:text-[#176b87] sm:inline-flex"
          href="mailto:support@dcprime.com"
        >
          Contact support
        </a>
      </header>

      <main className="mx-auto flex w-full max-w-6xl px-5 pb-8 sm:px-8">
        <Outlet />
      </main>

      <footer className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 pb-6 text-xs text-slate-500 sm:px-8">
        <span>© 2026 DC Prime</span>
        <span className="hidden sm:inline">Secure access for approved users</span>
      </footer>
    </div>
  )
}

export default MainLayout
