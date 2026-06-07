import { useState } from "react"
import { NavLink, Outlet, useNavigate } from "react-router-dom"
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
  FiUserCheck,
  FiUsers,
  FiX,
} from "react-icons/fi"
import { useQueryClient } from "@tanstack/react-query"
import Button from "../components/ui/Button"
import { API_URL } from "../utils/api"
import useCurrentUser from "../utils/useCurrentUser"

type CurrentUserResponse = {
  user?: {
    email?: string
    full_name?: string
    role?: string
  }
}

type NavItem = {
  label: string
  to: string
  icon: IconType
}

type NavGroup = {
  title: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    title: "Overview",
    items: [{ label: "Dashboard", to: "/dashboard", icon: FiHome }],
  },
  {
    title: "Management",
    items: [
      { label: "Projects", to: "/projects", icon: FiMap },
      { label: "Listings", to: "/listings", icon: FiGrid },
      { label: "Clients", to: "/clients", icon: FiUsers },
      {
        label: "Accreditted Sellers",
        to: "/accreditted_sellers",
        icon: FiUserCheck,
      },
    ],
  },
  {
    title: "Finance",
    items: [
      { label: "Payments", to: "/payments", icon: FiCreditCard },
      { label: "Commissions", to: "/commissions", icon: FiDollarSign },
    ],
  },
  {
    title: "Compliance",
    items: [
      { label: "Documents", to: "/documents", icon: FiFileText },
      { label: "Audit Logs", to: "/audit-logs", icon: FiActivity },
    ],
  },
  {
    title: "Records",
    items: [
      { label: "Reports", to: "/reports", icon: FiBarChart2 },
      { label: "Employees", to: "/employees", icon: FiUsers },
      { label: "Attendance", to: "/attendance", icon: FiClock },
    ],
  },
  {
    title: "Administration",
    items: [{ label: "Settings", to: "/settings", icon: FiSettings }],
  },
]

const SystemLayout = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const { data } = useCurrentUser()
  const currentUser = (data as CurrentUserResponse | null)?.user

  const handleLogout = async () => {
    await fetch(`${API_URL}/logout`, {
      method: "POST",
      credentials: "include",
    })

    queryClient.clear()
    navigate("/")
  }

  const sidebar = (
    <aside className="flex h-full w-72 flex-col border-r border-slate-200 bg-white shadow-sm lg:w-64">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white shadow-sm">
            DC
          </div>

          <div>
            <p className="text-sm font-bold text-slate-900">D&C Prime</p>
            <p className="text-xs text-slate-500">Realty admin</p>
          </div>
        </div>

        <Button
          className="lg:hidden"
          icon={<FiX />}
          onClick={() => setIsSidebarOpen(false)}
          variant="ghost"
        />
      </div>

      <nav className="flex-1 overflow-y-auto p-3">
        {navGroups.map((group) => (
          <div key={group.title} className="mb-4">
            <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {group.title}
            </p>

            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon

                return (
                  <NavLink
                    className={({ isActive }) =>
                      [
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
                        isActive
                          ? "bg-blue-50 text-blue-700"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                      ].join(" ")
                    }
                    key={item.to}
                    onClick={() => setIsSidebarOpen(false)}
                    to={item.to}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-slate-200 p-4">
        <div className="mb-3 rounded-xl bg-slate-50 p-3">
          <p className="truncate text-sm font-semibold text-slate-900">
            {currentUser?.full_name || "Signed in user"}
          </p>

          <p className="truncate text-xs text-slate-500">
            {currentUser?.email || currentUser?.role || "Secure session"}
          </p>
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

            <div className="hidden lg:block">
              <p className="text-sm font-semibold text-slate-900">
                Internal admin system
              </p>
              <p className="text-xs text-slate-500">
                Connected to live MySQL data
              </p>
            </div>

            <div className="min-w-0 text-right">
              <p className="truncate text-sm font-semibold text-slate-900">
                {currentUser?.full_name || "D&C Prime"}
              </p>

              <p className="truncate text-xs text-slate-500">
                {currentUser?.role || "Authorized user"}
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