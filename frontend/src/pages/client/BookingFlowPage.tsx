import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { providersApi } from '@/api/endpoints/providers.api'
import { apiClient } from '@/api/client'

export default function BookingFlowPage() {
  const { providerId, serviceId } = useParams<{ providerId: string; serviceId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const [clientNotes, setClientNotes] = useState('')
  const [checkoutFormContent, setCheckoutFormContent] = useState<string | null>(null)
  const paymentContainerRef = useRef<HTMLDivElement>(null)

  const { slotStart, slotLabel } = (location.state as { slotStart?: string; slotLabel?: string }) ?? {}

  const { data: provider, isLoading } = useQuery({
    queryKey: ['provider', providerId],
    queryFn: () => providersApi.getById(providerId!),
    enabled: !!providerId,
  })

  const service = provider?.services.find((s) => s.id === serviceId)

  const initPaymentMutation = useMutation({
    mutationFn: () =>
      apiClient.post('/payments/initialize', {
        serviceId,
        providerId,
        startUtc: slotStart,
        clientNotes: clientNotes || null,
      }).then((r) => r.data as { checkoutFormContent: string; token: string }),
    onSuccess: (data) => {
      setCheckoutFormContent(data.checkoutFormContent)
    },
  })

  // Inject iyzico scripts when checkoutFormContent is set
  useEffect(() => {
    if (!checkoutFormContent) return

    const parser = new DOMParser()
    const doc = parser.parseFromString(checkoutFormContent, 'text/html')
    const scripts = Array.from(doc.querySelectorAll('script'))

    // Execute scripts sequentially (inline first, then external src)
    const executeNext = (index: number) => {
      if (index >= scripts.length) return
      const old = scripts[index]
      const el = document.createElement('script')
      if (old.src) {
        el.src = old.src
        el.onload = () => executeNext(index + 1)
        el.onerror = () => executeNext(index + 1)
      } else {
        el.textContent = old.textContent
        setTimeout(() => executeNext(index + 1), 0)
      }
      document.body.appendChild(el)
    }

    executeNext(0)
  }, [checkoutFormContent])

  if (!slotStart || !slotLabel) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500 mb-4">Saat seçimi bulunamadı.</p>
        <button
          onClick={() => navigate(`/providers/${providerId}`)}
          className="text-sm font-medium hover:underline"
          style={{ color: 'var(--color-primary)' }}
        >
          Öğretmen sayfasına dön
        </button>
      </div>
    )
  }

  // Show iyzico payment form (full screen takeover)
  if (checkoutFormContent) {
    return (
      <div className="max-w-xl mx-auto px-4 py-8 text-center space-y-4">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto"
          style={{ background: 'var(--color-primary-light)' }}
        >
          💳
        </div>
        <h2 className="text-xl font-bold text-gray-900">Ödeme Sayfasına Yönlendiriliyorsunuz</h2>
        <p className="text-sm text-gray-500">iyzico güvenli ödeme formu yükleniyor…</p>
        <div ref={paymentContainerRef} id="iyzipay-checkout-form" className="responsive" />
        <button
          onClick={() => setCheckoutFormContent(null)}
          className="text-sm text-gray-400 hover:text-gray-600 underline mt-4 block mx-auto"
        >
          Geri dön
        </button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12 space-y-4 animate-pulse">
        <div className="h-8 bg-gray-100 rounded-xl w-1/2" />
        <div className="h-40 bg-gray-100 rounded-2xl" />
        <div className="h-32 bg-gray-100 rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Rezervasyonu Onayla</h1>

      {/* Summary card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--color-primary-light)' }}
          >
            <span className="text-2xl">📅</span>
          </div>
          <div>
            <p className="font-semibold text-gray-900">{slotLabel}</p>
            <p className="text-sm text-gray-500">{provider?.fullName}</p>
          </div>
        </div>

        {service && (
          <div className="border-t border-gray-100 pt-4 flex items-start justify-between gap-3">
            <div>
              <p className="font-medium text-gray-900">{service.name}</p>
              <p className="text-sm text-gray-500 mt-0.5">{service.durationMinutes} dakika</p>
            </div>
            <p className="font-bold text-gray-900 flex-shrink-0">₺{service.price.toLocaleString('tr-TR')}</p>
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Öğretmene not (isteğe bağlı)
        </label>
        <textarea
          value={clientNotes}
          onChange={(e) => setClientNotes(e.target.value)}
          placeholder="Önceki bilginizi, odaklanmak istediğiniz konuları yazabilirsiniz…"
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:border-transparent"
          style={{ '--tw-ring-color': 'var(--color-primary)' } as React.CSSProperties}
          rows={3}
        />
      </div>

      {/* Payment info */}
      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
        <span className="text-2xl">🔒</span>
        <div>
          <p className="text-sm font-medium text-gray-700">Güvenli Ödeme — iyzico</p>
          <p className="text-xs text-gray-400">Kart bilgileriniz iyzico tarafından şifreli olarak işlenir.</p>
        </div>
      </div>

      {/* Error */}
      {initPaymentMutation.isError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          Ödeme başlatılamadı. Lütfen tekrar deneyin.
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={() => navigate(-1)}
          className="flex-1 py-3 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 hover:border-gray-400 transition-colors bg-white"
        >
          Geri
        </button>
        <button
          onClick={() => initPaymentMutation.mutate()}
          disabled={initPaymentMutation.isPending}
          className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ background: 'var(--color-primary)' }}
        >
          {initPaymentMutation.isPending ? 'Hazırlanıyor…' : 'Ödemeye Geç →'}
        </button>
      </div>
    </div>
  )
}
