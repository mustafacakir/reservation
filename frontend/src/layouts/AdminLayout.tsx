import { Outlet, NavLink } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'

const navItems = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/bookings', label: 'All Bookings' },
]

export default function AdminLayout() {
  const { fullName, logout } = useAuthStore()
  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-700">
          <span className="font-bold">Admin Panel</span>
        </div>
        <nav className="flex-1 px-4 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-lg text-sm font-medium ${
                  isActive ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-700">
          <p className="text-sm text-gray-300 truncate">{fullName}</p>
          <button onClick={logout} className="text-xs text-gray-500 hover:text-gray-300 mt-1">Sign out</button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto bg-gray-50 p-6"><Outlet /></main>
    </div>
  )
}
