import { useState, useEffect } from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import { useTenantStore } from '@/store/tenant.store'
import { getSectorConfig } from '@/config/sectors'
import Logo from '@/components/landing/Logo'
import { Menu, X, ChevronDown, MapPin } from 'lucide-react'

export default function PublicLayout() {
  const { isAuthenticated, role, logout, fullName } = useAuthStore()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const { sector } = useTenantStore()
  const sectorCfg = getSectorConfig(sector)

  const isFullBleed = pathname === '/' || pathname.startsWith('/login') || pathname.startsWith('/register')

  useEffect(() => { window.scrollTo(0, 0) }, [pathname])

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

      {!isFullBleed && (
        <footer className="bg-gray-900 text-gray-400 py-10 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-8 mb-8">
              <div>
                <Logo size="md" className="text-white mb-3 block" />
                <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
                  {sectorCfg.heroSubtitle}
                </p>
              </div>
              <div className="flex gap-12">
                <div>
                  <h4 className="text-white font-semibold text-sm mb-3">Yasal</h4>
                  <ul className="space-y-2 text-sm">
                    <li><Link to="/kvkk" className="hover:text-white transition-colors">KVKK</Link></li>
                    <li><Link to="/gizlilik" className="hover:text-white transition-colors">Gizlilik Politikası</Link></li>
                    <li><Link to="/kullanim-kosullari" className="hover:text-white transition-colors">Kullanım Koşulları</Link></li>
                    <li><Link to="/iptal-iade" className="hover:text-white transition-colors">İptal ve İade</Link></li>
                    <li><Link to="/mesafeli-satis-sozlesmesi" className="hover:text-white transition-colors">Mesafeli Satış Sözleşmesi</Link></li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-white font-semibold text-sm mb-3">İletişim</h4>
                  <ul className="space-y-2 text-sm">
                    <li><Link to="/iletisim" className="hover:text-white transition-colors">İletişim Sayfası</Link></li>
                    <li><a href="mailto:destek@sevdailematematik.com" className="hover:text-white transition-colors">destek@sevdailematematik.com</a></li>
                    <li><a href="tel:+905415740545" className="hover:text-white transition-colors">0541 574 05 45</a></li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
              <span>© {new Date().getFullYear()} · Tüm hakları saklıdır.</span>
              <a href="https://pekinteknoloji.com" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors font-medium">
                Bu site Pekin Teknoloji tarafından hazırlanmıştır.
              </a>
              <span className="flex items-center gap-1.5"><MapPin size={11} /> Yeni Selanik Pasajı No:3/6, Beyoğlu / İstanbul</span>
            </div>
          </div>
        </footer>
      )}
    </div>
  )
}
