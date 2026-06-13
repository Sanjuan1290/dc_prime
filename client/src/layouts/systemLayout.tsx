import { useMemo, useState } from "react"
import { Navigate, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom"
import type { IconType } from "react-icons"
import {
  FiActivity,
  FiBarChart2,
  FiClock,
  FiCreditCard,
  FiDollarSign,
  FiFileText,
  FiGrid,
  FiHome,
  FiLogOut,
  FiMap,
  FiMenu,
  FiSettings,
  FiShield,
  FiUserCheck,
  FiUsers,
  FiX,
} from "react-icons/fi"
import { useQueryClient } from "@tanstack/react-query"
import Button from "../components/ui/Button"
import { API_URL } from "../utils/api"
import useCurrentUser from "../utils/useCurrentUser"

const getRoleLabel = (role?: string) => {
  if (!role) return "Authorized user"

  return role
    .replaceAll("_", " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(" ")
}

type CurrentUserResponse = {
  user?: {
    email?: string
    full_name?: string
    role?: string
  }
}

type NavTone = "blue" | "emerald" | "amber" | "purple" | "rose" | "slate"

type NavItem = {
  label: string
  to: string
  icon: IconType
  tone: NavTone
}

type NavGroup = {
  title: string
  description: string
  tone: NavTone
  items: NavItem[]
}

const toneClasses: Record<
  NavTone,
  {
    active: string
    icon: string
    pill: string
    strip: string
  }
> = {
  blue: {
    active: "border-blue-200 bg-blue-50 text-blue-700 shadow-blue-100",
    icon: "bg-blue-100 text-blue-700",
    pill: "bg-blue-100 text-blue-700",
    strip: "bg-blue-500",
  },
  emerald: {
    active: "border-emerald-200 bg-emerald-50 text-emerald-700 shadow-emerald-100",
    icon: "bg-emerald-100 text-emerald-700",
    pill: "bg-emerald-100 text-emerald-700",
    strip: "bg-emerald-500",
  },
  amber: {
    active: "border-amber-200 bg-amber-50 text-amber-700 shadow-amber-100",
    icon: "bg-amber-100 text-amber-700",
    pill: "bg-amber-100 text-amber-700",
    strip: "bg-amber-500",
  },
  purple: {
    active: "border-purple-200 bg-purple-50 text-purple-700 shadow-purple-100",
    icon: "bg-purple-100 text-purple-700",
    pill: "bg-purple-100 text-purple-700",
    strip: "bg-purple-500",
  },
  rose: {
    active: "border-rose-200 bg-rose-50 text-rose-700 shadow-rose-100",
    icon: "bg-rose-100 text-rose-700",
    pill: "bg-rose-100 text-rose-700",
    strip: "bg-rose-500",
  },
  slate: {
    active: "border-slate-200 bg-slate-100 text-slate-900 shadow-slate-100",
    icon: "bg-slate-200 text-slate-700",
    pill: "bg-slate-200 text-slate-700",
    strip: "bg-slate-500",
  },
}

const navGroups: NavGroup[] = [
  {
    title: "Overview",
    description: "Main summary",
    tone: "blue",
    items: [{ label: "Dashboard", to: "/dashboard", icon: FiHome, tone: "blue" }],
  },
  {
    title: "Management",
    description: "Projects, units, and buyers",
    tone: "emerald",
    items: [
      { label: "Projects", to: "/projects", icon: FiMap, tone: "emerald" },
      { label: "Listings", to: "/listings", icon: FiGrid, tone: "emerald" },
      { label: "Clients", to: "/clients", icon: FiUsers, tone: "emerald" },
      {
        label: "Accredited Sellers",
        to: "/accreditted_sellers",
        icon: FiUserCheck,
        tone: "emerald",
      },
    ],
  },
  {
    title: "Finance",
    description: "Payments and payouts",
    tone: "amber",
    items: [
      { label: "Payments", to: "/payments", icon: FiCreditCard, tone: "amber" },
      { label: "Commissions", to: "/commissions", icon: FiDollarSign, tone: "amber" },
      { label: "Cash Advances", to: "/cash-advances", icon: FiDollarSign, tone: "amber" },
    ],
  },
  {
    title: "Compliance",
    description: "Documents and audit trail",
    tone: "purple",
    items: [
      { label: "Documents", to: "/documents", icon: FiFileText, tone: "purple" },
      { label: "Audit Logs", to: "/audit-logs", icon: FiActivity, tone: "purple" },
    ],
  },
  {
    title: "Records",
    description: "Reports and staff records",
    tone: "rose",
    items: [
      { label: "Reports", to: "/reports", icon: FiBarChart2, tone: "rose" },
      { label: "Employees", to: "/employees", icon: FiUsers, tone: "rose" },
      { label: "Attendance", to: "/attendance", icon: FiClock, tone: "rose" },
    ],
  },
  {
    title: "Administration",
    description: "System controls",
    tone: "slate",
    items: [
      { label: "Settings", to: "/settings", icon: FiSettings, tone: "slate" },
      { label: "Users", to: "/users", icon: FiShield, tone: "slate" },
    ],
  },
]


const roleAllowedPaths: Record<string, string[]> = {
  super_admin: ["/dashboard", "/projects", "/listings", "/clients", "/client", "/accreditted_sellers", "/payments", "/commissions", "/cash-advances", "/documents", "/audit-logs", "/reports", "/employees", "/attendance", "/settings", "/users"],
  admin: ["/dashboard", "/projects", "/listings", "/clients", "/client", "/accreditted_sellers", "/payments", "/commissions", "/cash-advances", "/documents", "/audit-logs", "/reports", "/employees", "/attendance", "/settings"],
  treasury: ["/dashboard", "/payments", "/reports"],
  broker_network_manager: ["/dashboard", "/commissions", "/cash-advances"],
  broker: ["/dashboard", "/commissions", "/cash-advances"],
  manager: ["/dashboard", "/commissions", "/cash-advances"],
  agent: ["/dashboard", "/commissions", "/cash-advances"],
  client: ["/dashboard"],
}

const canAccessPath = (role: string | undefined, path: string) => {
  if (!role) return false
  const allowed = roleAllowedPaths[role] || roleAllowedPaths.agent
  return allowed.some((allowedPath) => path === allowedPath || path.startsWith(`${allowedPath}/`))
}

const SystemLayout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const { data, isLoading } = useCurrentUser()
  const currentUser = (data as CurrentUserResponse | null)?.user

  const visibleNavGroups = useMemo(() => {
    return navGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => canAccessPath(currentUser?.role, item.to)),
      }))
      .filter((group) => group.items.length > 0)
  }, [currentUser?.role])

  const activeItem = useMemo(() => {
    return visibleNavGroups
      .flatMap((group) => group.items.map((item) => ({ ...item, groupTitle: group.title })))
      .find((item) => location.pathname === item.to || location.pathname.startsWith(`${item.to}/`))
  }, [location.pathname, visibleNavGroups])

  const handleLogout = async () => {
    await fetch(`${API_URL}/logout`, {
      method: "POST",
      credentials: "include",
    })

    queryClient.clear()
    navigate("/")
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 text-center shadow-sm">
          <p className="text-sm font-semibold text-slate-900">Checking session...</p>
          <p className="mt-1 text-xs text-slate-500">Please wait while we verify your login.</p>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />
  }

  if (!canAccessPath(currentUser.role, location.pathname)) {
    return <Navigate to="/dashboard" replace />
  }

  const sidebar = (
    <aside className="flex h-full w-72 flex-col border-r border-slate-200 bg-white shadow-sm lg:w-64">
      <div className="border-b border-slate-200 bg-gradient-to-br from-blue-50 via-white to-emerald-50 px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/logo2.png"
              alt="D&C Prime logo"
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white bg-white object-cover shadow-sm"
            />

            <div>
              <p className="text-sm font-bold text-slate-900">D&C Prime</p>
              <p className="text-xs text-slate-500">Realty management</p>
            </div>
          </div>

          <Button
            className="lg:hidden"
            icon={<FiX />}
            onClick={() => setIsSidebarOpen(false)}
            variant="ghost"
          />
        </div>

        <div className="mt-4 rounded-2xl border border-white/80 bg-white/80 p-3 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Current section
          </p>
          <div className="mt-2 flex items-center gap-2">
            {activeItem ? (
              <span className={`h-2.5 w-2.5 rounded-full ${toneClasses[activeItem.tone].strip}`} />
            ) : null}
            <p className="truncate text-sm font-bold text-slate-900">
              {activeItem?.label || "Dashboard"}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-3">
        {visibleNavGroups.map((group) => (
          <div key={group.title} className="mb-4">
            <div className="mb-2 flex items-center justify-between gap-2 px-3">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {group.title}
                </p>
                <p className="truncate text-[11px] text-slate-400">{group.description}</p>
              </div>
              <span className={`h-2 w-2 shrink-0 rounded-full ${toneClasses[group.tone].strip}`} />
            </div>

            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon
                const tone = toneClasses[item.tone]

                return (
                  <NavLink
                    className={({ isActive }) =>
                      [
                        "group relative flex items-center gap-3 rounded-xl border px-2.5 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-blue-100",
                        isActive
                          ? `${tone.active} shadow-sm`
                          : "border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-900",
                      ].join(" ")
                    }
                    key={item.to}
                    onClick={() => setIsSidebarOpen(false)}
                    to={item.to}
                  >
                    {({ isActive }) => (
                      <>
                        <span
                          className={[
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition",
                            isActive ? tone.icon : "bg-slate-100 text-slate-500 group-hover:bg-white",
                          ].join(" ")}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="truncate">{item.label}</span>
                        {isActive ? (
                          <span className={`ml-auto h-2 w-2 shrink-0 rounded-full ${tone.strip}`} />
                        ) : null}
                      </>
                    )}
                  </NavLink>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-slate-200 bg-slate-50/70 p-4">
        <div className="mb-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">
                {currentUser?.full_name || "Signed in user"}
              </p>

              <p className="truncate text-xs text-slate-500">
                {currentUser?.email || "Secure session"}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-blue-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-blue-700">
              {getRoleLabel(currentUser?.role)}
            </span>
          </div>
        </div>

        <Button
          className="w-full"
          icon={<FiLogOut />}
          onClick={handleLogout}
          variant="secondary"
        >
          Logout
        </Button>
      </div>
    </aside>
  )

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:block">
        {sidebar}
      </div>

      {isSidebarOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Close sidebar"
            className="absolute inset-0 bg-slate-950/50"
            onClick={() => setIsSidebarOpen(false)}
            type="button"
          />

          <div className="relative h-full">{sidebar}</div>
        </div>
      ) : null}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-3">
            <Button
              className="lg:hidden"
              icon={<FiMenu />}
              onClick={() => setIsSidebarOpen(true)}
              variant="secondary"
            >
              Menu
            </Button>

            <div className="hidden min-w-0 lg:block">
              <div className="flex items-center gap-2">
                {activeItem ? (
                  <span className={`h-2.5 w-2.5 rounded-full ${toneClasses[activeItem.tone].strip}`} />
                ) : null}
                <p className="truncate text-sm font-semibold text-slate-900">
                  {activeItem?.label || "Internal admin system"}
                </p>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                {activeItem?.groupTitle || "Connected to live MySQL data"}
              </p>
            </div>

            <div className="min-w-0 text-right">
              <p className="truncate text-sm font-semibold text-slate-900">
                {currentUser?.full_name || "D&C Prime"}
              </p>

              <p className="truncate text-xs text-slate-500">
                {getRoleLabel(currentUser?.role)}
              </p>
            </div>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default SystemLayout
