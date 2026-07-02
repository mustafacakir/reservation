import { useState, useEffect } from 'react'
import { Cookie, X } from 'lucide-react'
import { grantAnalyticsConsent } from '@/lib/analytics'

const STORAGE_KEY = 'cookie-consent'

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) setVisible(true)
  }, [])

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ accepted: true, date: new Date().toISOString() }))
    grantAnalyticsConsent()
    setVisible(false)
  }

  const reject = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ accepted: false, date: new Date().toISOString() }))
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl border border-gray-100 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-primary-light)' }}>
          <Cookie size={18} style={{ color: 'var(--color-primary)' }} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 mb-1">Çerez Politikası</p>
          <p className="text-xs text-gray-500 leading-relaxed">
            Sitemiz, temel işlevler için zorunlu çerezler kullanmaktadır. Deneyiminizi iyileştirmek amacıyla analitik
            çerezler de kullanılmaktadır.{' '}
            <a href="/gizlilik" className="underline font-medium" style={{ color: 'var(--color-primary)' }}>
              Gizlilik Politikası
            </a>{' '}
            ve{' '}
            <a href="/kvkk" className="underline font-medium" style={{ color: 'var(--color-primary)' }}>
              KVKK Aydınlatma Metni
            </a>
            'ni inceleyebilirsiniz.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
          <button
            onClick={reject}
            className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            Reddet
          </button>
          <button
            onClick={accept}
            className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: 'var(--color-primary)' }}
          >
            Kabul Et
          </button>
          <button
            onClick={reject}
            className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 transition-colors"
            aria-label="Kapat"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
