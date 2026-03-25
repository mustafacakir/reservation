import { Outlet, NavLink } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'

const navItems = [
  { to: '/client/browse', label: 'Browse Providers' },
  { to: '/client/bookings', label: 'My Bookings' },
]

export default function ClientLayout() {
  const { fullName, logout } = useAuthStore()
  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <span className="font-bold text-indigo-600">ReserveSaaS</span>
        </div>
        <nav className="flex-1 px-4 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'
                }`}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-200">
          <p className="text-sm font-medium text-gray-700 truncate">{fullName}</p>
          <button onClick={logout} className="text-xs text-gray-500 hover:text-gray-700 mt-1">
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto bg-gray-50 p-6">
        <Outlet />
      </main>
    </div>
  )
}
