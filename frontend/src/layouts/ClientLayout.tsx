import { useState } from 'react'
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import Logo from '@/components/landing/Logo'
import { CalendarDays, LogOut, Menu, X, UserCog, GraduationCap } from 'lucide-react'

const navItems = [
  { to: '/client/bookings', label: 'Derslerim', Icon: CalendarDays },
  { to: '/client/account',  label: 'Hesabım',   Icon: UserCog },
]

const actionItems = [
  { to: '/providers', label: 'Ders Al', Icon: GraduationCap },
]

export default function ClientLayout() {
  const { fullName, logout } = useAuthStore()
  const navigate = useNavigate()
  const initials = fullName?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() ?? '?'
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/login') }

  const SidebarContent = () => (
    <>
      <div className="h-16 flex items-center justify-between px-5 border-b border-gray-100 flex-shrink-0">
        <Link to="/" onClick={() => setSidebarOpen(false)}><Logo size="sm" /></Link>
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive ? 'text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`
            }
            style={({ isActive }) => isActive ? { background: 'var(--color-primary)' } : {}}
          >
            {({ isActive }) => (
              <>
                <Icon size={15} className={isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}

        <div className="mt-3 pt-3 border-t border-gray-50">
          {actionItems.map(({ to, label, Icon }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className="group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{ color: 'var(--color-primary)' }}
            >
              <Icon size={15} />
              <span>{label}</span>
            </Link>
          ))}
        </div>
      </nav>

      <div className="p-3 border-t border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
            style={{ background: 'var(--color-primary)' }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-800 truncate">{fullName}</p>
            <p className="text-[10px] text-gray-400">Öğrenci</p>
          </div>
          <button onClick={handleLogout} title="Çıkış Yap" className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </>
  )

  return (
    <div className="min-h-screen flex bg-gray-50">

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-56 bg-white border-r border-gray-100 flex-col fixed top-0 bottom-0 left-0 z-30">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/40" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`lg:hidden fixed top-0 bottom-0 left-0 z-50 w-64 flex flex-col bg-white border-r border-gray-100 transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 h-14 bg-white border-b border-gray-100 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors">
            <Menu size={20} />
          </button>
          <Link to="/"><Logo size="sm" /></Link>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ background: 'var(--color-primary)' }}>
            {initials}
          </div>
          <button onClick={handleLogout} className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 lg:ml-56 pt-14 lg:pt-0 min-w-0">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          <Outlet />
        </div>
      </main>

    </div>
  )
}
