import { useState } from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import Logo from '@/components/landing/Logo'
import { Menu, X } from 'lucide-react'

export default function PublicLayout() {
  const { isAuthenticated, role, logout, fullName } = useAuthStore()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const isFullBleed = pathname === '/' || pathname.startsWith('/login') || pathname.startsWith('/register')

  const dashboardPath = role === 'ServiceProvider' ? '/provider'
    : role === 'Admin' || role === 'SuperAdmin' ? '/admin' : '/client/browse'

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/"><Logo size="md" /></Link>

          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-4">
            <Link to="/providers" className="text-sm text-gray-600 hover:text-gray-900">Öğretmenler</Link>
            {isAuthenticated ? (
              <>
                <button onClick={() => navigate(dashboardPath)} className="text-sm text-gray-700 hover:text-gray-900">
                  {fullName}
                </button>
                <button onClick={logout} className="text-sm bg-gray-100 px-3 py-1.5 rounded-lg hover:bg-gray-200">
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

          {/* Mobile nav toggle */}
          <button
            className="sm:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile dropdown menu */}
        {menuOpen && (
          <div className="sm:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-2">
            <Link
              to="/providers"
              className="block py-2 text-sm text-gray-700 font-medium"
              onClick={() => setMenuOpen(false)}
            >
              Öğretmenler
            </Link>
            {isAuthenticated ? (
              <>
                <button
                  onClick={() => { navigate(dashboardPath); setMenuOpen(false) }}
                  className="block w-full text-left py-2 text-sm text-gray-700 font-medium"
                >
                  {fullName} — Panel
                </button>
                <button
                  onClick={() => { logout(); setMenuOpen(false) }}
                  className="block w-full text-left py-2 text-sm text-red-500 font-medium"
                >
                  Çıkış Yap
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="block py-2 text-sm text-gray-700 font-medium"
                  onClick={() => setMenuOpen(false)}
                >
                  Giriş Yap
                </Link>
                <Link
                  to="/register"
                  className="block py-2 text-sm font-semibold text-white text-center rounded-xl"
                  style={{ background: 'var(--color-primary, #4f46e5)' }}
                  onClick={() => setMenuOpen(false)}
                >
                  Ücretsiz Başla
                </Link>
              </>
            )}
          </div>
        )}
      </header>

      <main className="flex-1">
        {isFullBleed ? (
          <Outlet />
        ) : (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <Outlet />
          </div>
        )}
      </main>
    </div>
  )
}
