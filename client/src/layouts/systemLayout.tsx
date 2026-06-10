import { useMemo, useState } from "react"
import {
  Navigate,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom"
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
import { formatText } from "../utils/formatters"

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
}

type NavGroup = {
  title: string
  tone: NavTone
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    title: "Overview",
    tone: "blue",
    items: [{ label: "Dashboard", to: "/dashboard", icon: FiHome }],
  },
  {
    title: "Management",
    tone: "emerald",
    items: [
      { label: "Projects", to: "/projects", icon: FiMap },
      { label: "Listings", to: "/listings", icon: FiGrid },
      { label: "Clients", to: "/clients", icon: FiUsers },
      {
        label: "Accredited Sellers",
        to: "/accreditted_sellers",
        icon: FiUserCheck,
      },
    ],
  },
  {
    title: "Finance",
    tone: "amber",
    items: [
      { label: "Payments", to: "/payments", icon: FiCreditCard },
      { label: "Commissions", to: "/commissions", icon: FiDollarSign },
      { label: "Cash Advances", to: "/cash-advances", icon: FiActivity },
    ],
  },
  {
    title: "Compliance",
    tone: "purple",
    items: [
      { label: "Documents", to: "/documents", icon: FiFileText },
      { label: "Audit Logs", to: "/audit-logs", icon: FiShield },
    ],
  },
  {
    title: "Records",
    tone: "rose",
    items: [
      { label: "Reports", to: "/reports", icon: FiBarChart2 },
      { label: "Employees", to: "/employees", icon: FiUsers },
      { label: "Attendance", to: "/attendance", icon: FiClock },
    ],
  },
  {
    title: "Administration",
    tone: "slate",
    items: [{ label: "Settings", to: "/settings", icon: FiSettings }],
  },
]

const toneClasses: Record<
  NavTone,
  {
    active: string
    activeIcon: string
    dot: string
    group: string
    sectionCard: string
  }
> = {
  blue: {
    active: "bg-blue-50 text-blue-700 ring-1 ring-blue-100",
    activeIcon: "bg-blue-600 text-white",
    dot: "bg-blue-600",
    group: "text-blue-700",
    sectionCard: "border-blue-100 bg-blue-50 text-blue-700",
  },
  emerald: {
    active: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
    activeIcon: "bg-emerald-600 text-white",
    dot: "bg-emerald-600",
    group: "text-emerald-700",
    sectionCard: "border-emerald-100 bg-emerald-50 text-emerald-700",
  },
  amber: {
    active: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
    activeIcon: "bg-amber-500 text-white",
    dot: "bg-amber-500",
    group: "text-amber-700",
    sectionCard: "border-amber-100 bg-amber-50 text-amber-700",
  },
  purple: {
    active: "bg-purple-50 text-purple-700 ring-1 ring-purple-100",
    activeIcon: "bg-purple-600 text-white",
    dot: "bg-purple-600",
    group: "text-purple-700",
    sectionCard: "border-purple-100 bg-purple-50 text-purple-700",
  },
  rose: {
    active: "bg-rose-50 text-rose-700 ring-1 ring-rose-100",
    activeIcon: "bg-rose-600 text-white",
    dot: "bg-rose-600",
    group: "text-rose-700",
    sectionCard: "border-rose-100 bg-rose-50 text-rose-700",
  },
  slate: {
    active: "bg-slate-100 text-slate-900 ring-1 ring-slate-200",
    activeIcon: "bg-slate-900 text-white",
    dot: "bg-slate-900",
    group: "text-slate-700",
    sectionCard: "border-slate-200 bg-slate-100 text-slate-800",
  },
}

const getActiveItem = (pathname: string) => {
  for (const group of navGroups) {
    const item = group.items.find((navItem) => {
      if (navItem.to === "/dashboard") {
        return pathname === "/dashboard"
      }

      return pathname === navItem.to || pathname.startsWith(`${navItem.to}/`)
    })

    if (item) {
      return {
        group,
        item,
      }
    }
  }

  return {
    group: navGroups[0],
    item: navGroups[0].items[0],
  }
}

const SystemLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()

  const {
    data: currentUserData,
    isLoading: isCurrentUserLoading,
  } = useCurrentUser()

  const currentUser = (currentUserData as CurrentUserResponse | null)?.user

  const activeNav = useMemo(
    () => getActiveItem(location.pathname),
    [location.pathname]
  )

  if (isCurrentUserLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 text-center shadow-sm">
          <p className="text-sm font-semibold text-slate-900">
            Checking session...
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Please wait while we verify your login.
          </p>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />
  }

  const handleLogout = async () => {
    await fetch(`${API_URL}/logout`, {
      method: "POST",
      credentials: "include",
    })

    queryClient.clear()
    navigate("/", { replace: true })
  }

  const renderNav = () => (
    <nav className="space-y-5">
      {navGroups.map((group) => {
        const tone = toneClasses[group.tone]

        return (
          <div key={group.title}>
            <p
              className={`mb-2 px-3 text-[11px] font-bold uppercase tracking-[0.18em] ${tone.group}`}
            >
              {group.title}
            </p>

            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setIsSidebarOpen(false)}
                    className={({ isActive }) =>
                      [
                        "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
                        isActive
                          ? tone.active
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                      ].join(" ")
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span
                          className={[
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition",
                            isActive
                              ? tone.activeIcon
                              : "bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-slate-700",
                          ].join(" ")}
                        >
                          <Icon className="h-4 w-4" />
                        </span>

                        <span className="min-w-0 flex-1 truncate">
                          {item.label}
                        </span>

                        {isActive ? (
                          <span
                            className={`h-2 w-2 rounded-full ${tone.dot}`}
                          />
                        ) : null}
                      </>
                    )}
                  </NavLink>
                )
              })}
            </div>
          </div>
        )
      })}
    </nav>
  )

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="lg:hidden">
        {isSidebarOpen ? (
          <button
            aria-label="Close sidebar overlay"
            className="fixed inset-0 z-40 bg-slate-950/40"
            onClick={() => setIsSidebarOpen(false)}
            type="button"
          />
        ) : null}

        <aside
          className={[
            "fixed inset-y-0 left-0 z-50 flex w-80 max-w-[85vw] flex-col border-r border-slate-200 bg-white transition-transform duration-200",
            isSidebarOpen ? "translate-x-0" : "-translate-x-full",
          ].join(" ")}
        >
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <p className="text-sm font-bold text-slate-900">
                D&C Prime Realty
              </p>
              <p className="text-xs text-slate-500">Management System</p>
            </div>

            <button
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              onClick={() => setIsSidebarOpen(false)}
              type="button"
            >
              <FiX className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-5">{renderNav()}</div>
        </aside>
      </div>

      <aside className="fixed inset-y-0 left-0 hidden w-72 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="border-b border-slate-200 px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white">
              DC
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-900">
                D&C Prime Realty
              </p>
              <p className="truncate text-xs text-slate-500">
                Management System
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5">{renderNav()}</div>

        <div className="border-t border-slate-200 p-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <p className="truncate text-sm font-bold text-slate-900">
              {currentUser.full_name || "User"}
            </p>
            <p className="mt-0.5 truncate text-xs text-slate-500">
              {currentUser.email || "-"}
            </p>
            <span className="mt-2 inline-flex rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700">
              {formatText(currentUser.role)}
            </span>
          </div>

          <Button
            className="mt-3 w-full justify-center"
            onClick={handleLogout}
            variant="secondary"
          >
            <FiLogOut className="mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <button
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 lg:hidden"
                onClick={() => setIsSidebarOpen(true)}
                type="button"
              >
                <FiMenu className="h-5 w-5" />
              </button>

              <div className="min-w-0">
                <div
                  className={[
                    "inline-flex rounded-full border px-2.5 py-1 text-xs font-bold",
                    toneClasses[activeNav.group.tone].sectionCard,
                  ].join(" ")}
                >
                  {activeNav.group.title}
                </div>

                <h1 className="mt-1 truncate text-lg font-bold text-slate-900 sm:text-xl">
                  {activeNav.item.label}
                </h1>
              </div>
            </div>

            <div className="hidden items-center gap-3 sm:flex">
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-900">
                  {currentUser.full_name || "User"}
                </p>
                <p className="text-xs text-slate-500">
                  {formatText(currentUser.role)}
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default SystemLayout