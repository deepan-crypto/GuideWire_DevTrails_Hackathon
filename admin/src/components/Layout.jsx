import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { Search, Users, FileText, Activity, DollarSign, Server, Bell, ChevronDown, LayoutDashboard } from 'lucide-react'

function GuidewireLogo() {
  return (
    <svg width="28" height="28" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="8" fill="white" fillOpacity="0.15" />
      <path d="M12 14h16v2H14v8h10v-4h-6v-2h8v8H12V14z" fill="white" />
      <circle cx="30" cy="14" r="3" fill="#4FC3F7" />
    </svg>
  )
}

const navItems = [
  { to: '/policy-center', icon: FileText, label: 'PolicyCenter', sublabel: 'Policy Search' },
  { to: '/claim-center', icon: Activity, label: 'ClaimCenter', sublabel: 'Claims Desktop' },
  { to: '/billing-center', icon: DollarSign, label: 'BillingCenter', sublabel: 'Account Management' },
]

function Sidebar() {
  const location = useLocation()

  return (
    <aside className="w-[220px] min-h-screen bg-white border-r border-gw-border flex flex-col shrink-0">
      {/* Logo area */}
      <div className="h-[52px] flex items-center px-4 border-b border-gw-border bg-gw-blue">
        <GuidewireLogo />
        <div className="flex flex-col ml-2">
          <span className="text-white font-bold text-[15px] leading-tight tracking-tight">Guidewire</span>
          <span className="text-blue-200 text-[9px] leading-tight tracking-wider uppercase">InsuranceSuite</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2">
        <div className="px-3 py-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-gw-text-muted">Desktops</span>
        </div>
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.to
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-4 py-2.5 mx-2 rounded text-[12.5px] font-medium transition-all duration-150 group ${
                isActive
                  ? 'bg-gw-blue text-white shadow-sm'
                  : 'text-gw-text hover:bg-gw-sidebar-active hover:text-gw-blue'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-gw-text-muted group-hover:text-gw-blue'}`} />
              <div className="flex flex-col">
                <span className="leading-tight">{item.label}</span>
                <span className={`text-[10px] leading-tight ${isActive ? 'text-blue-100' : 'text-gw-text-muted'}`}>{item.sublabel}</span>
              </div>
            </NavLink>
          )
        })}

        <div className="px-3 py-2 mt-4">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-gw-text-muted">Administration</span>
        </div>
        {[
          { to: '/user-management', icon: Users, label: 'User Management' },
          { to: '/analytics', icon: LayoutDashboard, label: 'Analytics' },
        ].map(item => {
          const Icon = item.icon
          const isActive = location.pathname === item.to
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-4 py-2.5 mx-2 rounded text-[12.5px] font-medium transition-all duration-150 group ${
                isActive
                  ? 'bg-gw-blue text-white shadow-sm'
                  : 'text-gw-text hover:bg-gw-sidebar-active hover:text-gw-blue'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-gw-text-muted group-hover:text-gw-blue'}`} />
              <span>{item.label}</span>
            </NavLink>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-gw-border px-4 py-3">
        <div className="text-[10px] text-gw-text-muted">
          <div className="flex items-center gap-1.5 mb-1">
            <Server className="w-3 h-3" />
            <span>v2026.03 — Build 4821</span>
          </div>
          <div className="text-[9px] opacity-60">© Guidewire Software</div>
        </div>
      </div>
    </aside>
  )
}

function Header() {
  return (
    <header className="h-[52px] bg-gw-header flex items-center justify-between px-5 border-b border-[#001F3F] shrink-0">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-[12px]">
          <span className="text-blue-300 font-medium">Environment:</span>
          <span className="bg-green-600/20 text-green-300 px-2 py-0.5 rounded text-[11px] font-semibold border border-green-500/30">
            ● PRODUCTION
          </span>
        </div>
        <div className="h-4 w-px bg-blue-800"></div>
        <div className="flex items-center gap-2 text-[12px]">
          <span className="text-blue-300 font-medium">Region:</span>
          <span className="text-white/80">AP-South-1 (Mumbai)</span>
        </div>
        <div className="h-4 w-px bg-blue-800"></div>
        <div className="flex items-center gap-2 text-[12px]">
          <span className="text-blue-300 font-medium">Tenant:</span>
          <span className="text-white/80">RiskWire Micro-Insurance</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Search bar */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-blue-400" />
          <input
            type="text"
            placeholder="Search policies, claims, accounts..."
            className="bg-white/10 border border-blue-700/50 rounded text-[11.5px] text-white placeholder:text-blue-400/60 pl-8 pr-3 py-1.5 w-[260px] focus:outline-none focus:border-blue-400/60 focus:bg-white/15 transition-colors"
          />
        </div>

        {/* Notifications */}
        <button className="relative text-blue-300 hover:text-white transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[8px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center">3</span>
        </button>

        <div className="h-4 w-px bg-blue-800"></div>

        {/* User */}
        <div className="flex items-center gap-2 cursor-pointer group">
          <div className="w-7 h-7 rounded-full bg-gw-blue text-white flex items-center justify-center text-[11px] font-semibold border-2 border-blue-400/40">
            CM
          </div>
          <div className="flex flex-col">
            <span className="text-white text-[12px] font-medium leading-tight group-hover:text-blue-200 transition-colors">Claims Manager</span>
            <span className="text-blue-400/70 text-[10px] leading-tight">Admin Role</span>
          </div>
          <ChevronDown className="w-3 h-3 text-blue-400/70" />
        </div>
      </div>
    </header>
  )
}

export default function Layout() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-5 bg-gw-bg">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
