import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'

export default function PublicLayout() {
  const { isAuthenticated, role, logout, fullName } = useAuthStore()
  const navigate = useNavigate()

  const dashboardPath = role === 'ServiceProvider' ? '/provider'
    : role === 'Admin' || role === 'SuperAdmin' ? '/admin' : '/client/browse'

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-indigo-600">ReserveSaaS</Link>
          <nav className="flex items-center gap-4">
            <Link to="/providers" className="text-sm text-gray-600 hover:text-gray-900">Browse</Link>
            {isAuthenticated ? (
              <>
                <button onClick={() => navigate(dashboardPath)}
                  className="text-sm text-gray-700 hover:text-gray-900">{fullName}</button>
                <button onClick={logout}
                  className="text-sm bg-gray-100 px-3 py-1.5 rounded-lg hover:bg-gray-200">
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm text-gray-600 hover:text-gray-900">Sign in</Link>
                <Link to="/register"
                  className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
                  Get started
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
