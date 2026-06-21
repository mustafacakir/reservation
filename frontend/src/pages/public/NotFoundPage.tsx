import { Link, useNavigate } from 'react-router-dom'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#fafafa' }}>
      <div className="text-center max-w-md w-full">
        {/* Big 404 */}
        <div className="relative inline-block mb-6">
          <p
            className="text-[120px] font-black leading-none select-none"
            style={{ color: 'var(--color-primary-light, #ede9fe)' }}
          >
            404
          </p>
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ color: 'var(--color-primary)' }}
          >
            <p className="text-[120px] font-black leading-none opacity-20 select-none">404</p>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Sayfa Bulunamadı</h1>
        <p className="text-sm text-gray-500 mb-8 leading-relaxed">
          Aradığınız sayfa taşınmış, silinmiş veya hiç var olmamış olabilir.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
            style={{ background: 'var(--color-primary)' }}
          >
            Ana Sayfaya Dön
          </Link>
          <button
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Geri Git
          </button>
        </div>
      </div>
    </div>
  )
}
