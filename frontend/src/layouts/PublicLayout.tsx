import { useState } from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import { useTenantStore } from '@/store/tenant.store'
import { getSectorConfig } from '@/config/sectors'
import Logo from '@/components/landing/Logo'
import { Menu, X, ChevronDown } from 'lucide-react'

export default function PublicLayout() {
  const { isAuthenticated, role, logout, fullName } = useAuthStore()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const { sector } = useTenantStore()
  const sectorCfg = getSectorConfig(sector)

  const isFullBleed = pathname === '/' || pathname.startsWith('/login') || pathname.startsWith('/register')

  const dashboardPath = role === 'ServiceProvider' ? '/provider'
    : role === 'Admin' || role === 'SuperAdmin' ? '/admin' : '/client/profile'

  const initials = fullName?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() ?? '?'

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white/95 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex-shrink-0"><Logo size="md" /></Link>

          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-2">
            {isAuthenticated ? (
              <>
                {role === 'Client' ? (
                  <Link
                    to="/client/profile"
                    className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Profilim
                  </Link>
                ) : null}
                <div className="flex items-center gap-2 pl-2 border-l border-gray-100">
                  <button
                    onClick={() => navigate(dashboardPath)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                      style={{ background: 'var(--color-primary)' }}
                    >
                      {initials}
                    </div>
                    <span className="text-sm font-medium text-gray-700 max-w-[120px] truncate">{fullName}</span>
                    <ChevronDown size={13} className="text-gray-400" />
                  </button>
                  <button
                    onClick={logout}
                    className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Çıkış
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                  Giriş Yap
                </Link>
                <Link
                  to="/register"
                  className="text-sm font-semibold text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity shadow-sm"
                  style={{ background: 'var(--color-primary)' }}
                >
                  Ücretsiz Başla
                </Link>
              </>
            )}
          </nav>

          {/* Mobile toggle */}
          <button
            className="sm:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="sm:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1 shadow-lg">
            {isAuthenticated ? (
              <>
                <div className="flex items-center gap-3 px-2 py-2 mb-2">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                    style={{ background: 'var(--color-primary)' }}
                  >
                    {initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{fullName}</p>
                    <p className="text-xs text-gray-400 capitalize">{role === 'ServiceProvider' ? sectorCfg.providerLabel : sectorCfg.clientLabel}</p>
                  </div>
                </div>
                {role === 'Client' && (
                  <Link to="/client/profile" onClick={() => setMenuOpen(false)} className="block px-2 py-2.5 text-sm text-gray-700 rounded-lg hover:bg-gray-50">Profilim</Link>
                )}
                <button
                  onClick={() => { navigate(dashboardPath); setMenuOpen(false) }}
                  className="block w-full text-left px-2 py-2.5 text-sm text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Panel
                </button>
                <div className="border-t border-gray-100 pt-2 mt-2">
                  <button
                    onClick={() => { logout(); setMenuOpen(false) }}
                    className="block w-full text-left px-2 py-2.5 text-sm text-red-500 rounded-lg hover:bg-red-50"
                  >
                    Çıkış Yap
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMenuOpen(false)} className="block px-2 py-2.5 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50">
                  Giriş Yap
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMenuOpen(false)}
                  className="block px-2 py-2.5 text-sm font-semibold text-white text-center rounded-xl"
                  style={{ background: 'var(--color-primary)' }}
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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Outlet />
          </div>
        )}
      </main>
    </div>
  )
}
