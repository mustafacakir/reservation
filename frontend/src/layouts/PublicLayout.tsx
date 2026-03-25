import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import Logo from '@/components/landing/Logo'

export default function PublicLayout() {
  const { isAuthenticated, role, logout, fullName } = useAuthStore()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const isFullBleed = pathname === '/' || pathname.startsWith('/login') || pathname.startsWith('/register')

  const dashboardPath = role === 'ServiceProvider' ? '/provider'
    : role === 'Admin' || role === 'SuperAdmin' ? '/admin' : '/client/browse'

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/">
            <Logo size="md" />
          </Link>
          <nav className="flex items-center gap-4">
            <Link to="/providers" className="text-sm text-gray-600 hover:text-gray-900">Öğretmenler</Link>
            {isAuthenticated ? (
              <>
                <button onClick={() => navigate(dashboardPath)}
                  className="text-sm text-gray-700 hover:text-gray-900">{fullName}</button>
                <button onClick={logout}
                  className="text-sm bg-gray-100 px-3 py-1.5 rounded-lg hover:bg-gray-200">
                  Çıkış
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm text-gray-600 hover:text-gray-900">Giriş Yap</Link>
                <Link
                  to="/register"
                  className="text-sm text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
                  style={{ background: 'var(--color-primary, #4f46e5)' }}
                >
                  Ücretsiz Başla
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1">
        {isFullBleed ? (
          <Outlet />
        ) : (
          <div className="max-w-7xl mx-auto px-6 sm:px-8 py-8">
            <Outlet />
          </div>
        )}
      </main>
    </div>
  )
}
