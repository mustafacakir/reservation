import { useSearchParams, useNavigate } from 'react-router-dom'
import { CheckCircle, XCircle, CalendarDays, Home } from 'lucide-react'

export default function PaymentResultPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()

  const success = params.get('success') === 'true'
  const bookingId = params.get('bookingId')
  const error = params.get('error')

  if (success) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="max-w-md w-full mx-auto px-6 py-12 text-center space-y-6">
          {/* Icon */}
          <div className="relative mx-auto w-fit">
            <div className="w-24 h-24 rounded-full flex items-center justify-center" style={{ background: 'var(--color-primary-light)' }}>
              <CheckCircle size={48} style={{ color: 'var(--color-primary)' }} />
            </div>
            <div className="absolute -right-1 -bottom-1 w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
              <CheckCircle size={16} className="text-white" />
            </div>
          </div>

          {/* Text */}
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">Ödeme Başarılı!</h1>
            <p className="text-gray-500 mt-2 text-sm leading-relaxed">
              Rezervasyonunuz oluşturuldu ve onaylandı.<br />Öğretmeniniz en kısa sürede sizinle iletişime geçecek.
            </p>
          </div>

          {bookingId && (
            <p className="text-xs text-gray-400 bg-gray-50 rounded-xl px-4 py-2 inline-block">
              Rezervasyon No: <span className="font-mono font-semibold">{bookingId.slice(0, 8).toUpperCase()}</span>
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-center pt-2">
            <button
              onClick={() => navigate('/client/bookings')}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
              style={{ background: 'var(--color-primary)' }}
            >
              <CalendarDays size={15} /> Derslerimi Gör
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <Home size={15} /> Ana Sayfa
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="max-w-md w-full mx-auto px-6 py-12 text-center space-y-6">
        {/* Icon */}
        <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto bg-red-50">
          <XCircle size={48} className="text-red-500" />
        </div>

        {/* Text */}
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Ödeme Başarısız</h1>
          <p className="text-gray-500 mt-2 text-sm leading-relaxed">
            {error ? decodeURIComponent(error) : 'Ödeme işlemi tamamlanamadı. Lütfen tekrar deneyin.'}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-center pt-2">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
            style={{ background: 'var(--color-primary)' }}
          >
            Tekrar Dene
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <Home size={15} /> Ana Sayfa
          </button>
        </div>
      </div>
    </div>
  )
}
