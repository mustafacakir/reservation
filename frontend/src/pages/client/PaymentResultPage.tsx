import { useSearchParams, useNavigate } from 'react-router-dom'

export default function PaymentResultPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()

  const success = params.get('success') === 'true'
  const bookingId = params.get('bookingId')
  const error = params.get('error')

  if (success) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center space-y-5">
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center text-5xl mx-auto"
          style={{ background: 'var(--color-primary-light)' }}
        >
          ✅
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Ödeme Başarılı!</h1>
        <p className="text-gray-500 text-sm">
          Rezervasyonunuz oluşturuldu ve onaylandı. Öğretmeniniz en kısa sürede sizinle iletişime geçecek.
        </p>
        {bookingId && (
          <p className="text-xs text-gray-400">Rezervasyon ID: {bookingId}</p>
        )}
        <div className="flex gap-3 justify-center pt-2">
          <button
            onClick={() => navigate('/client/bookings')}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'var(--color-primary)' }}
          >
            Rezervasyonlarımı Gör
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 bg-white"
          >
            Ana Sayfa
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center space-y-5">
      <div className="w-24 h-24 rounded-full flex items-center justify-center text-5xl mx-auto bg-red-50">
        ❌
      </div>
      <h1 className="text-2xl font-bold text-gray-900">Ödeme Başarısız</h1>
      <p className="text-gray-500 text-sm">
        {error ? decodeURIComponent(error) : 'Ödeme işlemi tamamlanamadı. Lütfen tekrar deneyin.'}
      </p>
      <div className="flex gap-3 justify-center pt-2">
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: 'var(--color-primary)' }}
        >
          Tekrar Dene
        </button>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 bg-white"
        >
          Ana Sayfa
        </button>
      </div>
    </div>
  )
}
