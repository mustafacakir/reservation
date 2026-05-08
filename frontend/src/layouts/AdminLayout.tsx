import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import {
  LayoutDashboard, Users, CalendarDays, LogOut, Menu, Shield,
} from 'lucide-react'

const navItems = [
  { to: '/admin',          label: 'Genel Bakış',  Icon: LayoutDashboard, end: true },
  { to: '/admin/users',    label: 'Kullanıcılar', Icon: Users },
  { to: '/admin/bookings', label: 'Rezervasyonlar', Icon: CalendarDays },
]

export default function AdminLayout() {
  const { fullName, logout } = useAuthStore()
  const navigate = useNavigate()
  const initials = fullName?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() ?? 'A'
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/login') }

  const SidebarContent = () => (
    <>
      <div className="h-16 flex items-center gap-3 px-5 border-b border-white/10 flex-shrink-0">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/15 flex-shrink-0">
          <Shield size={15} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-white leading-none">Admin Panel</p>
          <p className="text-[10px] text-white/40 mt-0.5">Yönetim Konsolu</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, label, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-white/15 text-white'
                  : 'text-white/50 hover:text-white hover:bg-white/8'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={15} className={isActive ? 'text-white' : 'text-white/40 group-hover:text-white/70'} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-white/10 flex-shrink-0">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold bg-white/15 text-white flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white/80 truncate">{fullName}</p>
            <p className="text-[10px] text-white/40">Yönetici</p>
          </div>
          <button
            onClick={handleLogout}
            title="Çıkış Yap"
            className="p-1.5 rounded-lg text-white/30 hover:text-red-300 hover:bg-white/10 transition-colors"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </>
  )

  return (
    <div className="min-h-screen flex bg-gray-50">

      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex w-56 flex-col fixed top-0 bottom-0 left-0 z-30"
        style={{ background: '#0f172a' }}
      >
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`lg:hidden fixed top-0 bottom-0 left-0 z-50 w-56 flex flex-col transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ background: '#0f172a' }}
      >
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <div
        className="lg:hidden fixed top-0 left-0 right-0 z-30 h-14 flex items-center justify-between px-4 border-b border-white/10"
        style={{ background: '#0f172a' }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Menu size={18} />
          </button>
          <div className="flex items-center gap-2">
            <Shield size={14} className="text-white/60" />
            <span className="text-sm font-bold text-white">Admin</span>
          </div>
        </div>
        <button onClick={handleLogout} className="p-1.5 rounded-lg text-white/40 hover:text-red-300 transition-colors">
          <LogOut size={16} />
        </button>
      </div>

      {/* Main content */}
      <main className="flex-1 lg:ml-56 pt-14 lg:pt-0 min-w-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          <Outlet />
        </div>
      </main>

    </div>
  )
}
