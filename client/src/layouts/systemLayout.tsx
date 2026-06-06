import { NavLink, Outlet } from "react-router-dom"
import type { IconType } from "react-icons"
import {
  FiBarChart2,
  FiBriefcase,
  FiClock,
  FiCreditCard,
  FiFileText,
  FiGrid,
  FiHome,
  FiPercent,
  FiSettings,
  FiUserPlus,
  FiUsers
} from "react-icons/fi"

type NavItem = {
  label: string
  to: string
  icon: IconType
  badge?: string
}

type NavGroup = {
  title: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", to: "/dashboard", icon: FiGrid }
    ]
  },
  {
    title: "Management",
    items: [
      { label: "Projects", to: "/projects", icon: FiBriefcase },
      { label: "Listings", to: "/listings", icon: FiHome, badge: "100" }
    ]
  },
  {
    title: "People",
    items: [
      { label: "Attendance", to: "/attendance", icon: FiClock },
      { label: "Clients", to: "/clients", icon: FiUsers, badge: "75" },
      { label: "Accreditted Sellers", to: "/accreditted_sellers", icon: FiUsers, badge: "25" },
      { label: "Employees", to: "/employees", icon: FiUsers, badge: "8" }
    ]
  },
  {
    title: "Finance",
    items: [
      { label: "Payments", to: "/payments", icon: FiCreditCard },
      { label: "Commissions", to: "/commissions", icon: FiPercent }
    ]
  },
  {
    title: "Compliance",
    items: [
      { label: "Documents", to: "/documents", icon: FiFileText }
    ]
  },
  {
    title: "Insights",
    items: [
      { label: "Reports", to: "/reports", icon: FiBarChart2 }
    ]
  },
  {
    title: "Admin",
    items: [
      { label: "User management", to: "/user-management", icon: FiUserPlus },
      { label: "Audit logs", to: "/audit-logs", icon: FiBarChart2 },
      { label: "Settings", to: "/settings", icon: FiSettings },
    ]
  }
]

const SystemLayout = () => {
  return (
    <div className="min-h-screen bg-[#f5f6fb] text-slate-950 lg:flex">
      <aside className="bg-[#181628] text-slate-300 shadow-xl shadow-slate-950/20 lg:sticky lg:top-0 lg:h-screen lg:w-56 lg:shrink-0">
        <div className="border-b border-white/10 px-3 pb-4 pt-5">
          <div className="mb-4 h-0.5 w-20 rounded-full bg-[#d6b548]" />
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#d6b548] text-xs font-extrabold text-white shadow-lg shadow-black/20">
              DC
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-bold leading-tight text-white">D&C Prime</p>
              <p className="truncate text-xs text-slate-400">Realty Admin</p>
            </div>
          </div>
        </div>

        <nav className="flex gap-3 overflow-x-auto px-2 py-4 lg:block lg:h-[calc(100vh-88px)] lg:overflow-y-auto lg:overflow-x-hidden">
          {navGroups.map((group) => (
            <div className="min-w-48 border-white/10 lg:min-w-0 lg:border-b lg:py-4 first:lg:pt-0 last:lg:border-b-0" key={group.title}>
              <p className="px-2 pb-2 text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">
                {group.title}
              </p>

              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon

                  return (
                    <NavLink
                      className={({ isActive }) =>
                        [
                          "flex h-10 items-center gap-3 rounded-md px-3 text-sm font-bold transition",
                          isActive
                            ? "bg-[#3b394e] text-white shadow-sm"
                            : "text-slate-300 hover:bg-white/5 hover:text-white"
                        ].join(" ")
                      }
                      key={item.label}
                      to={item.to}
                    >
                      <Icon className="h-4 w-4 shrink-0 text-slate-400" />
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                      {item.badge ? (
                        <span className="rounded-full bg-[#5a586e] px-2 py-0.5 text-[10px] font-black leading-none text-white">
                          {item.badge}
                        </span>
                      ) : null}
                    </NavLink>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      <main className="min-w-0 flex-1 px-5 py-6 sm:px-8 lg:px-10">
        <Outlet />
      </main>
    </div>
  )
}

export default SystemLayout
