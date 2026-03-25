import { Link } from 'react-router-dom'
import Logo from './Logo'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 pt-16 pb-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div>
            <Logo size="md" className="text-white mb-3 block" />
            <p className="text-sm leading-relaxed text-gray-500">
              Türkiye'nin matematik öğrencileri ve öğretmenleri için güvenilir rezervasyon platformu.
            </p>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/providers" className="hover:text-white transition-colors">Öğretmenleri Keşfet</Link></li>
"              <li><Link to="/login" className="hover:text-white transition-colors">Giriş Yap</Link></li>
              <li><a href="#nasil-calisir" className="hover:text-white transition-colors">Nasıl Çalışır?</a></li>
            </ul>
          </div>

          {/* Destek */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Destek</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#sss" className="hover:text-white transition-colors">Sıkça Sorulan Sorular</a></li>
              <li><Link to="/kvkk" className="hover:text-white transition-colors">KVKK</Link></li>
              <li><Link to="/gizlilik" className="hover:text-white transition-colors">Gizlilik Politikası</Link></li>
              <li><Link to="/kullanim-kosullari" className="hover:text-white transition-colors">Kullanım Koşulları</Link></li>
            </ul>
          </div>

          {/* İletişim */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">İletişim</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <span>✉️</span>
                <a href="mailto:destek@sevdailematematik.com" className="hover:text-white transition-colors">
                  destek@sevdailematematik.com
                </a>
              </li>
              <li className="flex items-center gap-2">
                <span>📍</span>
                <span>İstanbul, Türkiye</span>
              </li>
              <li className="flex items-center gap-2">
                <span>🕐</span>
                <span>Pzt–Cum, 09:00–18:00</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600">
          <span>© {new Date().getFullYear()} sevdailematematik². Tüm hakları saklıdır.</span>
          <div className="flex items-center gap-4">
            <Link to="/gizlilik" className="hover:text-gray-400 transition-colors">Gizlilik Politikası</Link>
            <Link to="/kullanim-kosullari" className="hover:text-gray-400 transition-colors">Kullanım Koşulları</Link>
            <Link to="/kvkk" className="hover:text-gray-400 transition-colors">KVKK</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
