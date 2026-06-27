import { useState, useEffect, useRef } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import { CalendarDays, User, ShieldCheck, CheckCircle, BookOpen } from 'lucide-react'

// ── Helpers ───────────────────────────────────────────────────────────────────

const WD  = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt']
const MON = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']

function fmtUtc(utc: string) {
  const d = new Date(utc)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${WD[d.getDay()]} ${d.getDate()} ${MON[d.getMonth()]} · ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// ── KuveytTürk 3DS auto-submit ────────────────────────────────────────────────

function KuveytTurkRedirect({ formContent }: { formContent: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!ref.current) return
    ref.current.innerHTML = formContent
    ref.current.querySelector('form')?.submit()
  }, [formContent])
  return (
    <div className="py-20 text-center space-y-5">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto" style={{ background: 'var(--color-primary-light)' }}>
        <ShieldCheck size={26} style={{ color: 'var(--color-primary)' }} />
      </div>
      <h2 className="text-xl font-bold text-gray-900">3D Secure Sayfasına Yönlendiriliyorsunuz</h2>
      <p className="text-sm text-gray-500">Lütfen bekleyin…</p>
      <div className="flex justify-center">
        <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
      </div>
      <div ref={ref} style={{ display: 'none' }} />
    </div>
  )
}

// ── Card form ─────────────────────────────────────────────────────────────────

interface CardData {
  email: string
  firstName: string
  lastName: string
  cardNumber: string
  cardHolderName: string
  cardExpireMonth: string
  cardExpireYear: string
  cardCvv: string
}

function CardForm({
  price,
  onSubmit,
  isLoading,
}: {
  price: number
  onSubmit: (card: CardData) => void
  isLoading: boolean
}) {
  const [card, setCard] = useState<CardData>({
    email: '',
    firstName: '',
    lastName: '',
    cardNumber: '',
    cardHolderName: '',
    cardExpireMonth: '',
    cardExpireYear: '',
    cardCvv: '',
  })

  const set = (field: keyof CardData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setCard((prev) => ({ ...prev, [field]: e.target.value }))

  const formatCardNumber = (val: string) =>
    val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ ...card, cardNumber: card.cardNumber.replace(/\s/g, '') })
  }

  const inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent'
  const ringStyle = { '--tw-ring-color': 'var(--color-primary)' } as React.CSSProperties

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Student info */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Bilgileriniz</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Ad *</label>
            <input value={card.firstName} onChange={set('firstName')} placeholder="Ali" required className={inputCls} style={ringStyle} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Soyad *</label>
            <input value={card.lastName} onChange={set('lastName')} placeholder="Yılmaz" required className={inputCls} style={ringStyle} />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">E-posta <span className="font-normal text-gray-400">(onay maili)</span></label>
          <input type="email" value={card.email} onChange={set('email')} placeholder="ornek@email.com" className={inputCls} style={ringStyle} />
        </div>
      </div>

      {/* Card info */}
      <div className="space-y-3 pt-2">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Kart Bilgileri</h3>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Kart Numarası *</label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="0000 0000 0000 0000"
            value={card.cardNumber}
            onChange={(e) => setCard((prev) => ({ ...prev, cardNumber: formatCardNumber(e.target.value) }))}
            required
            className={inputCls}
            style={ringStyle}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Kart Üzerindeki İsim *</label>
          <input
            type="text"
            placeholder="AD SOYAD"
            value={card.cardHolderName}
            onChange={set('cardHolderName')}
            required
            className={`${inputCls} uppercase`}
            style={ringStyle}
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Ay *</label>
            <select value={card.cardExpireMonth} onChange={set('cardExpireMonth')} required className={inputCls} style={ringStyle}>
              <option value="">Ay</option>
              {Array.from({ length: 12 }, (_, i) => {
                const m = String(i + 1).padStart(2, '0')
                return <option key={m} value={m}>{m}</option>
              })}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Yıl *</label>
            <select value={card.cardExpireYear} onChange={set('cardExpireYear')} required className={inputCls} style={ringStyle}>
              <option value="">Yıl</option>
              {Array.from({ length: 10 }, (_, i) => {
                const y = String(new Date().getFullYear() + i).slice(2)
                return <option key={y} value={y}>{y}</option>
              })}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">CVV *</label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="•••"
              maxLength={4}
              value={card.cardCvv}
              onChange={(e) => setCard((prev) => ({ ...prev, cardCvv: e.target.value.replace(/\D/g, '') }))}
              required
              className={inputCls}
              style={ringStyle}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
        <ShieldCheck size={14} style={{ color: 'var(--color-primary)' }} className="flex-shrink-0" />
        <p className="text-xs text-gray-500">KuveytTürk 3D Secure ile güvenli ödeme</p>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3.5 rounded-2xl text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50 shadow-md"
        style={{ background: 'var(--color-primary)' }}
      >
        {isLoading ? 'İşleniyor…' : `Ödemeyi Tamamla → ₺${Number(price).toLocaleString('tr-TR')}`}
      </button>
    </form>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

interface BookingSummary {
  bookingId: string
  status: string
  serviceName: string
  providerName: string
  startUtc: string
  endUtc: string
  price: number
  currency: string
  clientNotes: string | null
}

export default function PaymentLinkPage() {
  const { token } = useParams<{ token: string }>()
  const [searchParams] = useSearchParams()
  const paid = searchParams.get('paid') === 'true'
  const [formContent, setFormContent] = useState<string | null>(null)

  const { data: summary, isLoading, isError } = useQuery<BookingSummary>({
    queryKey: ['paymentLink', token],
    queryFn: () => apiClient.get(`/pay/${token}`).then((r) => r.data),
    enabled: !!token,
    retry: false,
  })

  const initMutation = useMutation({
    mutationFn: (card: any) =>
      apiClient.post(`/pay/${token}/initialize`, {
        email: card.email || null,
        firstName: card.firstName || null,
        lastName: card.lastName || null,
        cardNumber: card.cardNumber,
        cardHolderName: card.cardHolderName,
        cardExpireMonth: card.cardExpireMonth,
        cardExpireYear: card.cardExpireYear,
        cardCvv: card.cardCvv,
      }),
    onSuccess: (res) => {
      if (res.data?.formContent) setFormContent(res.data.formContent)
    },
  })

  // 3DS redirect in progress
  if (formContent) return <KuveytTurkRedirect formContent={formContent} />

  // Paid success state
  if (paid) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#f9fafb' }}>
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto" style={{ background: '#d1fae5' }}>
            <CheckCircle size={30} style={{ color: '#059669' }} />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Ödeme Alındı!</h1>
          {summary && (
            <div className="text-left bg-gray-50 rounded-xl p-4 space-y-2">
              <p className="text-sm font-semibold text-gray-800">{summary.serviceName}</p>
              <p className="text-xs text-gray-500 flex items-center gap-1.5">
                <User size={11} /> {summary.providerName}
              </p>
              <p className="text-xs text-gray-500 flex items-center gap-1.5">
                <CalendarDays size={11} /> {fmtUtc(summary.startUtc)}
              </p>
            </div>
          )}
          <p className="text-sm text-gray-500">
            Rezervasyonunuz onaylandı. Eğer bir e-posta adresi girdiyseniz onay maili gönderilecektir.
          </p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f9fafb' }}>
        <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  if (isError || !summary) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#f9fafb' }}>
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center space-y-4">
          <p className="text-lg font-bold text-gray-900">Link Bulunamadı</p>
          <p className="text-sm text-gray-500">Bu ödeme linki geçersiz veya süresi dolmuş.</p>
        </div>
      </div>
    )
  }

  if (summary.status === 'Confirmed' || summary.status === 'Completed') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#f9fafb' }}>
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto" style={{ background: '#d1fae5' }}>
            <CheckCircle size={30} style={{ color: '#059669' }} />
          </div>
          <p className="text-lg font-bold text-gray-900">Bu Rezervasyon Zaten Onaylandı</p>
          <p className="text-sm text-gray-500">Ödeme daha önce alınmış.</p>
        </div>
      </div>
    )
  }

  const initError = (initMutation.error as any)?.response?.data?.message as string | undefined

  return (
    <div className="min-h-screen py-8 px-4" style={{ background: '#f9fafb' }}>
      <div className="max-w-md mx-auto space-y-5">

        {/* Header */}
        <div className="text-center space-y-1">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Ödeme</p>
          <h1 className="text-xl font-bold text-gray-900">{summary.serviceName}</h1>
        </div>

        {/* Summary card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--color-primary-light)' }}>
              <BookOpen size={15} style={{ color: 'var(--color-primary)' }} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{summary.serviceName}</p>
              <p className="text-xs text-gray-400 flex items-center gap-1"><User size={10} /> {summary.providerName}</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-lg font-bold text-gray-900">₺{Number(summary.price).toLocaleString('tr-TR')}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 pt-1 border-t border-gray-50">
            <CalendarDays size={11} style={{ color: 'var(--color-primary)' }} />
            {fmtUtc(summary.startUtc)}
          </div>
          {summary.clientNotes && (
            <p className="text-xs text-gray-400 border-t border-gray-50 pt-1">{summary.clientNotes}</p>
          )}
        </div>

        {/* Payment form */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          {initError && (
            <div className="mb-4 p-3 bg-red-50 rounded-xl text-xs text-red-600 font-medium">{initError}</div>
          )}
          <CardForm
            price={summary.price}
            onSubmit={(card) => initMutation.mutate(card)}
            isLoading={initMutation.isPending}
          />
        </div>

        <p className="text-center text-xs text-gray-400">
          Ödemeniz KuveytTürk 3D Secure ile korunmaktadır.
        </p>
      </div>
    </div>
  )
}
