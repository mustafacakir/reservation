import { Outlet, NavLink, Link } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import Logo from '@/components/landing/Logo'

const navItems = [
  { to: '/client/browse', label: 'Öğretmenler', icon: '👩‍🏫' },
  { to: '/client/bookings', label: 'Rezervasyonlarım', icon: '📅' },
]

export default function ClientLayout() {
  const { fullName, logout } = useAuthStore()
  const initials = fullName?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() ?? '?'

  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside className="w-60 bg-white border-r border-gray-100 flex flex-col shadow-sm">
        {/* Logo */}
        <div className="h-16 flex items-center px-5 border-b border-gray-100">
          <Link to="/">
            <Logo size="sm" />
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50'
                }`
              }
              style={({ isActive }) => isActive ? { background: 'var(--color-primary)' } : {}}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-gray-100 flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
            style={{ background: 'var(--color-primary)' }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">{fullName}</p>
            <button onClick={logout} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
              Çıkış Yap
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto px-6 pt-8 pb-6">
        <Outlet />
      </main>
    </div>
  )
}
