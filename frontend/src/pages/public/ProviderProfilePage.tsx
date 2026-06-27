import { useState, useEffect, useRef, useMemo } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useQuery, useQueries, useMutation } from '@tanstack/react-query'
import { Clock, ChevronLeft, CalendarDays, ArrowRight, UserCheck, Users, X, ShieldCheck, Loader2, CreditCard, CheckCircle, AlertCircle } from 'lucide-react'

function InstagramIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  )
}

function LinkedInIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  )
}
import { providersApi } from '@/api/endpoints/providers.api'
import { apiClient } from '@/api/client'
import { useAuthStore } from '@/store/auth.store'
import { useTenantStore } from '@/store/tenant.store'
import { useToast } from '@/components/ui/Toast'

// ── Date helpers ─────────────────────────────────────────────────────────────

function getNext14Days(): Date[] {
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i)
    return d
  })
}

function formatDateParam(d: Date) {
  return d.toISOString().split('T')[0]
}


// ── Avatar ────────────────────────────────────────────────────────────────────

function Avatar({ name, avatarUrl, size }: { name: string; avatarUrl?: string | null; size: number }) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  const px = `${size}px`
  return avatarUrl
    ? <img src={avatarUrl} alt={name} style={{ width: px, height: px }} className="rounded-2xl object-cover ring-4 ring-white shadow-lg" />
    : (
      <div
        className="rounded-2xl flex items-center justify-center font-bold text-white ring-4 ring-white shadow-lg flex-shrink-0"
        style={{ width: px, height: px, background: 'var(--color-primary)', fontSize: size > 80 ? '2rem' : '1rem' }}
      >
        {initials}
      </div>
    )
}

// ── Slot Picker ───────────────────────────────────────────────────────────────

function SlotPicker({
  providerId, serviceId, durationMinutes, onSelect, selectedSlotStart,
}: {
  providerId: string
  serviceId: string
  durationMinutes: number
  onSelect: (startUtc: string, label: string) => void
  selectedSlotStart: string | null
}) {
  const days = getNext14Days()
  const [activeDay, setActiveDay] = useState(days[0])

  const dayQueries = useQueries({
    queries: days.map((d) => ({
      queryKey: ['slots', providerId, serviceId, formatDateParam(d)],
      queryFn: () => providersApi.getAvailableSlots(providerId, serviceId, formatDateParam(d)),
      staleTime: 60_000,
    })),
  })

  const activeDateStr = formatDateParam(activeDay)
  const activeDayIndex = days.findIndex((d) => formatDateParam(d) === activeDateStr)
  const activeQuery = dayQueries[activeDayIndex]
  const slots = activeQuery?.data ?? []
  const isLoading = activeQuery?.isLoading ?? true

  const availabilityMap: Record<string, boolean | undefined> = {}
  days.forEach((d, i) => {
    const q = dayQueries[i]
    if (!q.isLoading) availabilityMap[formatDateParam(d)] = (q.data?.length ?? 0) > 0
  })

  // Build Monday-first calendar grid covering the 14-day range
  const toMonFirst = (day: number) => (day + 6) % 7
  const gridStart = new Date(days[0])
  gridStart.setDate(gridStart.getDate() - toMonFirst(days[0].getDay()))
  const gridEnd = new Date(days[days.length - 1])
  gridEnd.setDate(gridEnd.getDate() + (6 - toMonFirst(days[days.length - 1].getDay())))
  const gridCells: Date[] = []
  for (const cur = new Date(gridStart); cur <= gridEnd; cur.setDate(cur.getDate() + 1)) {
    gridCells.push(new Date(cur))
  }
  const daySet = new Set(days.map((d) => formatDateParam(d)))

  const monthLabel = (() => {
    const a = days[0], b = days[days.length - 1]
    if (a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear())
      return a.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })
    return `${a.toLocaleDateString('tr-TR', { month: 'long' })} – ${b.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}`
  })()

  return (
    <div>
      {/* Month label */}
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">{monthLabel}</p>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((h) => (
          <div key={h} className="text-center text-[10px] font-semibold text-gray-400 pb-1">{h}</div>
        ))}
        {gridCells.map((cell) => {
          const ds = formatDateParam(cell)
          const inRange = daySet.has(ds)
          if (!inRange) {
            return (
              <div key={ds} className="flex items-center justify-center h-9">
                <span className="text-xs text-gray-200">{cell.getDate()}</span>
              </div>
            )
          }
          const active = ds === activeDateStr
          const hasSlots = availabilityMap[ds]
          const loadingDay = availabilityMap[ds] === undefined
          const disabled = !loadingDay && hasSlots === false
          return (
            <button
              key={ds}
              disabled={disabled}
              onClick={() => { setActiveDay(cell); onSelect('', '') }}
              className={[
                'flex flex-col items-center justify-center h-9 rounded-xl text-xs font-semibold transition-all',
                active ? 'text-white shadow-sm' : disabled
                  ? 'text-gray-300 cursor-not-allowed opacity-40'
                  : 'text-gray-700 hover:bg-gray-100',
              ].join(' ')}
              style={active ? { background: 'var(--color-primary)' } : {}}
            >
              <span>{cell.getDate()}</span>
              {!disabled && !active && !loadingDay && (
                <span className="w-1 h-1 rounded-full mt-0.5" style={{ background: 'var(--color-primary)' }} />
              )}
            </button>
          )
        })}
      </div>

      {/* Time slots */}
      <div className="border-t border-gray-100 pt-4">
        {isLoading ? (
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 rounded-xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : slots.length === 0 ? (
          <div className="py-6 text-center">
            <CalendarDays size={24} className="text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Bu gün için müsait saat yok</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {slots.map((slot) => {
              const selected = slot.startUtc === selectedSlotStart
              const label = `${slot.startLocal} – ${slot.endLocal}`
              const full = slot.isFull
              return (
                <button
                  key={slot.startUtc}
                  onClick={() => !full && onSelect(slot.startUtc, label)}
                  disabled={full}
                  className={[
                    'py-2.5 px-1 rounded-xl text-xs font-semibold border transition-all flex flex-col items-center gap-0.5',
                    full ? 'text-gray-400 border-gray-100 bg-gray-50 cursor-not-allowed opacity-70'
                      : selected ? 'text-white border-transparent shadow-sm'
                      : 'text-gray-700 border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50',
                  ].join(' ')}
                  style={selected && !full ? { background: 'var(--color-primary)' } : {}}
                >
                  <span>{slot.startLocal}</span>
                  {slot.isGroup && slot.maxParticipants && (
                    <span
                      className="text-[9px] font-bold px-1 rounded"
                      style={full ? { background: '#fee2e2', color: '#dc2626' }
                        : selected ? { background: 'rgba(255,255,255,0.25)', color: '#fff' }
                        : { background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
                    >
                      {full ? 'DOLU' : `${slot.currentParticipants}/${slot.maxParticipants}`}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}
        <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
          <Clock size={11} /> Her ders {durationMinutes} dakika
        </p>
      </div>
    </div>
  )
}

// ── KuveytTürk kart tipi ─────────────────────────────────────────────────────

interface CardData {
  cardNumber: string
  cardHolderName: string
  cardExpireMonth: string
  cardExpireYear: string
  cardCvv: string
}

// ── KuveytTürk kart formu ─────────────────────────────────────────────────────

function KuveytTurkCardForm({
  price,
  onSubmit,
  onBack,
  isLoading,
}: {
  price: number
  onSubmit: (card: CardData) => void
  onBack: () => void
  isLoading: boolean
}) {
  const [card, setCard] = useState<CardData>({
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
    <div className="bg-gray-50 min-h-[60vh]">
      <div className="max-w-lg mx-auto px-4 py-8 space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-500">
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-primary-light)' }}>
              <CreditCard size={16} style={{ color: 'var(--color-primary)' }} />
            </div>
            <h2 className="text-base font-bold text-gray-900">Kart Bilgileri</h2>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Kart Numarası</label>
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
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Kart Üzerindeki İsim</label>
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
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Ay</label>
              <select value={card.cardExpireMonth} onChange={set('cardExpireMonth')} required className={inputCls} style={ringStyle}>
                <option value="">Ay</option>
                {Array.from({ length: 12 }, (_, i) => {
                  const m = String(i + 1).padStart(2, '0')
                  return <option key={m} value={m}>{m}</option>
                })}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Yıl</label>
              <select value={card.cardExpireYear} onChange={set('cardExpireYear')} required className={inputCls} style={ringStyle}>
                <option value="">Yıl</option>
                {Array.from({ length: 10 }, (_, i) => {
                  const y = String(new Date().getFullYear() + i).slice(2)
                  return <option key={y} value={y}>{y}</option>
                })}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">CVV</label>
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
      </div>
    </div>
  )
}

// ── KuveytTürk full-page redirect ────────────────────────────────────────────

function KuveytTurkRedirect({ formContent }: { formContent: string }) {
  const formRef = useRef<HTMLFormElement>(null)

  const parsed = useMemo(() => {
    const doc = new DOMParser().parseFromString(formContent, 'text/html')
    const src = doc.querySelector('form')
    if (!src) return null
    return {
      action: src.getAttribute('action') ?? '',
      method: src.getAttribute('method') ?? 'POST',
      fields: Array.from(src.querySelectorAll('input')).map((inp) => ({
        name: (inp as HTMLInputElement).name,
        value: (inp as HTMLInputElement).value,
      })),
    }
  }, [formContent])

  useEffect(() => {
    if (parsed) formRef.current?.submit()
  }, [parsed])

  if (!parsed) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white gap-5">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'var(--color-primary-light)' }}>
        <ShieldCheck size={28} style={{ color: 'var(--color-primary)' }} />
      </div>
      <p className="text-lg font-bold text-gray-900">Güvenli Ödeme Sayfasına Yönlendiriliyorsunuz</p>
      <p className="text-sm text-gray-500">KuveytTürk 3D Secure sayfası yükleniyor…</p>
      <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
      <form ref={formRef} method={parsed.method} action={parsed.action} style={{ display: 'none' }}>
        {parsed.fields.map((f, i) => (
          <input key={i} type="hidden" name={f.name} value={f.value} readOnly />
        ))}
      </form>
    </div>
  )
}

// ── PayTR modal ───────────────────────────────────────────────────────────────

function PayTrModal({ token, onClose }: { token: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl overflow-hidden w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} style={{ color: 'var(--color-primary)' }} />
            <span className="font-semibold text-gray-800">Güvenli Ödeme — PayTR</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <iframe
          src={`https://www.paytr.com/odeme/guvenli/${token}`}
          style={{ width: '100%', height: '580px', border: 'none', display: 'block' }}
          title="Ödeme"
        />
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ProviderProfilePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated } = useAuthStore()
  const { slug } = useTenantStore()
  const toast = useToast()

  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null)
  const [selectedSlotStart, setSelectedSlotStart] = useState<string | null>(null)
  const [selectedSlotLabel, setSelectedSlotLabel] = useState<string | null>(null)
  const [clientNotes, setClientNotes] = useState('')
  const [iframeToken, setIframeToken] = useState<string | null>(null)
  const [ktFormContent, setKtFormContent] = useState<string | null>(null)
  const [showCardForm, setShowCardForm] = useState(false)
  const [bookingSuccess, setBookingSuccess] = useState(false)
  const [duplicateWarning, setDuplicateWarning] = useState(false)

  const { data: provider, isLoading } = useQuery({
    queryKey: ['provider', id, slug],
    queryFn: () => providersApi.getById(id!),
    enabled: !!id && !!slug,
  })

  const selectedService = provider?.services.find(s => s.id === selectedServiceId)

  const payMutation = useMutation({
    mutationFn: (card: CardData) =>
      apiClient.post<{ iframeToken?: string; gatewayType: string; pendingKey: string; formContent?: string }>(
        '/payments/initialize', {
          serviceId: selectedServiceId,
          providerId: provider?.id,
          startUtc: isSelectedFixed ? selectedService!.scheduledStart : selectedSlotStart,
          clientNotes: clientNotes.trim() || undefined,
          cardNumber: card.cardNumber,
          cardHolderName: card.cardHolderName,
          cardExpireMonth: card.cardExpireMonth,
          cardExpireYear: card.cardExpireYear,
          cardCvv: card.cardCvv,
        }
      ).then(r => r.data),
    onSuccess: (data) => {
      setShowCardForm(false)
      if (data.gatewayType === 'KuveytTurk' && data.formContent) {
        setKtFormContent(data.formContent)
      } else if (data.iframeToken) {
        setIframeToken(data.iframeToken)
      }
    },
    onError: (err: any) => {
      const detail = err?.response?.data?.detail ?? ''
      const errors: string[] = err?.response?.data?.errors ?? []
      const firstError = errors[0] ?? ''
      const msg = detail || firstError || 'Ödeme başlatılamadı. Lütfen tekrar deneyin.'

      if (err?.response?.status === 409) {
        setShowCardForm(false)
        setDuplicateWarning(true)
      } else if (err?.response?.status === 400 && (msg.toLowerCase().includes('müsait') || msg.toLowerCase().includes('slot'))) {
        setShowCardForm(false)
        setSelectedSlotStart(null)
        setSelectedSlotLabel(null)
        toast.error('Seçilen saat doldu. Lütfen başka bir saat seçin.')
      } else {
        toast.error(msg)
      }
    },
  })

  const isSelectedFixed = !!selectedService?.scheduledStart
  const isSelectedFree = (selectedService?.price ?? 1) === 0

  const freeBookMutation = useMutation({
    mutationFn: () =>
      apiClient.post('/bookings', {
        serviceId: selectedServiceId,
        providerId: provider?.id,
        startUtc: isSelectedFixed ? selectedService!.scheduledStart : selectedSlotStart,
        clientNotes: clientNotes.trim() || undefined,
      }).then(r => r.data),
    onSuccess: () => setBookingSuccess(true),
    onError: (err: any) => {
      if (err?.response?.status === 409) {
        setDuplicateWarning(true)
      } else {
        const msg = err?.response?.data?.detail ?? err?.response?.data?.errors?.[0] ?? 'Rezervasyon oluşturulamadı.'
        toast.error(msg)
      }
    },
  })

  const handlePay = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } })
      return
    }
    if (!selectedServiceId || !provider) return
    if (!isSelectedFixed && !selectedSlotStart) return
    if (isSelectedFree) {
      freeBookMutation.mutate()
      return
    }
    setShowCardForm(true)
  }

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-48 bg-gray-100" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 space-y-4">
          <div className="h-32 bg-white rounded-2xl" />
          <div className="h-48 bg-white rounded-2xl" />
        </div>
      </div>
    )
  }

  if (!provider) {
    return (
      <div className="text-center py-24">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
          <UserCheck size={28} className="text-gray-400" />
        </div>
        <p className="font-semibold text-gray-700">Öğretmen bulunamadı</p>
      </div>
    )
  }

  const bookingPanelProps = {
    provider,
    selectedServiceId,
    setSelectedServiceId,
    selectedSlotStart,
    selectedSlotLabel,
    setSelectedSlotStart,
    setSelectedSlotLabel,
    selectedService,
    isAuthenticated,
    clientNotes,
    setClientNotes,
    isPayLoading: payMutation.isPending || freeBookMutation.isPending,
    handlePay,
    isSelectedFree,
    bookingSuccess,
    duplicateWarning,
    onResetBooking: () => {
      setBookingSuccess(false)
      setDuplicateWarning(false)
      setSelectedServiceId(null)
      setSelectedSlotStart(null)
      setSelectedSlotLabel(null)
      setClientNotes('')
    },
  }

  if (showCardForm && selectedService) {
    return (
      <KuveytTurkCardForm
        price={selectedService.price}
        isLoading={payMutation.isPending}
        onBack={() => setShowCardForm(false)}
        onSubmit={(card) => payMutation.mutate(card)}
      />
    )
  }

  return (
    <div>
      {ktFormContent && <KuveytTurkRedirect formContent={ktFormContent} />}
      {iframeToken && (
        <PayTrModal token={iframeToken} onClose={() => setIframeToken(null)} />
      )}

      {/* ── Hero Banner ── */}
      <div className="relative h-44 sm:h-52" style={{ background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark, #3730a3) 100%)' }}>
        <button
          onClick={() => navigate(-1)}
          className="absolute top-5 left-4 sm:left-6 flex items-center gap-1.5 text-white/80 hover:text-white text-sm font-medium transition-colors"
        >
          <ChevronLeft size={18} />
          Geri
        </button>
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 -translate-y-1/3 translate-x-1/4" style={{ background: 'white' }} />
        <div className="absolute bottom-0 left-1/3 w-32 h-32 rounded-full opacity-10 translate-y-1/2" style={{ background: 'white' }} />
      </div>

      {/* ── Content ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 lg:items-start">

          {/* ── Left column ── */}
          <div className="flex-1 min-w-0">
            {/* Profile card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 -mt-12 relative">
              <div className="flex items-end gap-5 mb-5">
                <Avatar name={provider.fullName} avatarUrl={provider.avatarUrl} size={96} />
                <div className="flex-1 min-w-0 pb-1">
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">{provider.fullName}</h1>
                </div>
                {provider.hourlyRate && (
                  <div className="hidden sm:block text-right flex-shrink-0 pb-1">
                    <p className="text-xs text-gray-400">başlangıç</p>
                    <p className="text-2xl font-extrabold text-gray-900">₺{provider.hourlyRate.toLocaleString('tr-TR')}</p>
                    <p className="text-xs text-gray-400">/ saat</p>
                  </div>
                )}
              </div>

              {/* Specializations */}
              {provider.specializations.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {provider.specializations.map((s) => (
                    <span
                      key={s}
                      className="text-xs px-3 py-1.5 rounded-full font-medium"
                      style={{ background: 'var(--color-primary-light, #ede9fe)', color: 'var(--color-primary)' }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}

              {/* Social links */}
              {(provider.instagramUrl || provider.linkedInUrl) && (
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                  {provider.instagramUrl && (
                    <a
                      href={provider.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 hover:border-pink-300 hover:text-pink-600 hover:bg-pink-50 transition-colors"
                    >
                      <InstagramIcon size={15} /> Instagram
                    </a>
                  )}
                  {provider.linkedInUrl && (
                    <a
                      href={provider.linkedInUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                      <LinkedInIcon size={15} /> LinkedIn
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Bio */}
            {provider.bio && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mt-4">
                <h2 className="font-semibold text-gray-900 mb-3">Hakkında</h2>
                <div
                  className="text-gray-600 text-sm leading-relaxed prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: provider.bio }}
                />
              </div>
            )}


            {/* Mobile booking panel */}
            <div className="lg:hidden mt-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <BookingPanel {...bookingPanelProps} />
            </div>
          </div>

          {/* ── Right column — sticky booking card ── */}
          <div className="hidden lg:block w-80 flex-shrink-0 -mt-12 sticky top-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              {provider.hourlyRate && (
                <div className="flex items-baseline gap-1 mb-5 pb-5 border-b border-gray-100">
                  <span className="text-3xl font-extrabold text-gray-900">₺{provider.hourlyRate.toLocaleString('tr-TR')}</span>
                  <span className="text-sm text-gray-400">/ saat başlangıç</span>
                </div>
              )}
              <BookingPanel {...bookingPanelProps} />
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

// ── Booking panel (shared between mobile + desktop) ───────────────────────────

function BookingPanel({
  provider, selectedServiceId, setSelectedServiceId,
  selectedSlotStart, selectedSlotLabel, setSelectedSlotStart, setSelectedSlotLabel,
  selectedService, isAuthenticated, clientNotes, setClientNotes, isPayLoading, handlePay,
  isSelectedFree, bookingSuccess, duplicateWarning, onResetBooking,
}: {
  provider: any
  selectedServiceId: string | null
  setSelectedServiceId: (id: string) => void
  selectedSlotStart: string | null
  selectedSlotLabel: string | null
  setSelectedSlotStart: (v: string | null) => void
  setSelectedSlotLabel: (v: string | null) => void
  selectedService: any
  isAuthenticated: boolean
  clientNotes: string
  setClientNotes: (v: string) => void
  isPayLoading: boolean
  handlePay: () => void
  isSelectedFree: boolean
  bookingSuccess: boolean
  duplicateWarning: boolean
  onResetBooking: () => void
}) {
  const isFixed = (service: any) => !!service?.scheduledStart
  const slotReady = !!selectedServiceId && (!!selectedSlotStart || isFixed(selectedService))

  const formatGroupSchedule = (service: any) => {
    if (!service?.scheduledStart) return { datePart: '', timePart: '', info: '' }
    const start = new Date(service.scheduledStart)
    const datePart = start.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    const startTime = start.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    if (service.scheduledEnd) {
      const end = new Date(service.scheduledEnd)
      const endTime = end.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
      const blockMinutes = Math.round((end.getTime() - start.getTime()) / 60000)
      const blockPerSession = Math.ceil(service.durationMinutes / 60) * 60
      const sessionCount = Math.floor(blockMinutes / blockPerSession)
      const breakMinutes = blockPerSession - service.durationMinutes
      const info = `${sessionCount} seans × ${service.durationMinutes} dk${breakMinutes > 0 ? ` (${breakMinutes} dk mola)` : ''}`
      return { datePart, timePart: `${startTime} – ${endTime}`, info }
    }
    return { datePart, timePart: startTime, info: `${service.durationMinutes} dk` }
  }

  if (bookingSuccess) {
    return (
      <div className="space-y-4 text-center py-6">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto" style={{ background: '#dcfce7' }}>
          <CheckCircle size={32} style={{ color: '#16a34a' }} />
        </div>
        <div>
          <p className="font-bold text-gray-900 text-base">Rezervasyonunuz Oluşturuldu!</p>
          <p className="text-sm text-gray-500 mt-1">Onay detayları e-posta adresinize gönderildi.</p>
        </div>
        <button
          onClick={onResetBooking}
          className="text-sm font-semibold px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
          style={{ color: 'var(--color-primary)' }}
        >
          Başka ders seç
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Service selection */}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-3">Ders Seç</p>
        <div className="space-y-2">
          {provider.services.map((service: any) => {
            const active = selectedServiceId === service.id
            return (
              <button
                key={service.id}
                onClick={() => {
                  setSelectedServiceId(service.id)
                  setSelectedSlotStart(null)
                  setSelectedSlotLabel(null)
                }}
                className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                  active ? 'border-transparent shadow-sm' : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
                style={active ? { borderColor: 'var(--color-primary)', background: 'var(--color-primary-light, #ede9fe)' } : {}}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-sm font-semibold" style={active ? { color: 'var(--color-primary)' } : { color: '#111827' }}>
                        {service.name}
                      </p>
                      {service.sessionType === 'Group' && (
                        <span
                          className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-md flex-shrink-0"
                          style={active
                            ? { background: 'var(--color-primary)', color: '#fff' }
                            : { background: 'var(--color-primary-light)', color: 'var(--color-primary)' }
                          }
                        >
                          <Users size={9} />
                          GRUP
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                      <Clock size={11} /> {service.durationMinutes} dk
                      {service.sessionType === 'Group' && service.maxParticipants && (
                        <> · Maks. {service.maxParticipants} kişi</>
                      )}
                      {service.scheduledStart && (
                        <> · {new Date(service.scheduledStart).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}{service.scheduledEnd ? `–${new Date(service.scheduledEnd).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}` : ''}{service.recurrenceWeeks ? ` · ${service.recurrenceWeeks} hafta` : ''}</>
                      )}
                    </p>
                  </div>
                  <span className="text-sm font-bold flex-shrink-0" style={{ color: Number(service.price) === 0 ? '#16a34a' : '#111827' }}>
                    {Number(service.price) === 0 ? 'Ücretsiz' : `₺${Number(service.price).toLocaleString('tr-TR')}`}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Slot picker or fixed group schedule */}
      {selectedService && (
        <div className="border-t border-gray-100 pt-4">
          {isFixed(selectedService) ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 space-y-2">
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Ders Takvimi</p>
              {(() => {
                const { timePart, info } = formatGroupSchedule(selectedService)
                const start = new Date(selectedService.scheduledStart)
                const weeks = selectedService.recurrenceWeeks ?? 1
                const now = new Date()
                const dates = Array.from({ length: weeks }, (_, i) => {
                  const d = new Date(start.getTime() + i * 7 * 24 * 60 * 60 * 1000)
                  return {
                    label: d.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
                    isPast: d < now,
                  }
                })
                return (
                  <>
                    <div className="space-y-1">
                      {dates.map(({ label, isPast }, i) => (
                        <div key={i} className={`flex items-center gap-2 ${isPast ? 'opacity-40' : ''}`}>
                          <span className="text-[10px] font-bold text-amber-600 w-4 flex-shrink-0 text-right">{i + 1}.</span>
                          <span className={`text-sm ${isPast ? 'line-through text-gray-500' : 'text-gray-800'}`}>{label}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-gray-700 font-semibold pt-1.5 border-t border-amber-100">
                      {timePart} <span className="text-xs font-normal text-gray-500">({info})</span>
                    </p>
                  </>
                )
              })()}
            </div>
          ) : (
            <>
              <p className="text-sm font-semibold text-gray-700 mb-3">Saat Seç</p>
              <SlotPicker
                providerId={provider.id}
                serviceId={selectedService.id}
                durationMinutes={selectedService.durationMinutes}
                selectedSlotStart={selectedSlotStart}
                onSelect={(start, label) => {
                  setSelectedSlotStart(start || null)
                  setSelectedSlotLabel(label || null)
                }}
              />
            </>
          )}
        </div>
      )}

      {/* Notes + pay button */}
      <div className={selectedService ? '' : 'pt-2'}>
        {selectedSlotLabel && !isFixed(selectedService) && (
          <div className="mb-3 px-3 py-2.5 rounded-xl text-xs text-center font-medium bg-gray-50 border border-gray-100 text-gray-700">
            {selectedSlotLabel}
          </div>
        )}

        {slotReady && (
          <textarea
            value={clientNotes}
            onChange={e => setClientNotes(e.target.value)}
            placeholder="Öğretmene not ekle (isteğe bağlı)"
            rows={2}
            className="w-full mb-3 px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:border-transparent placeholder-gray-400"
            style={{ '--tw-ring-color': 'var(--color-primary)' } as any}
          />
        )}

        {duplicateWarning && (
          <div className="mb-3 flex items-start gap-2.5 p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
            <AlertCircle size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 font-medium leading-relaxed">Bu derse zaten kayıtlısınız. Aynı derse tekrar rezervasyon yapamazsınız.</p>
          </div>
        )}

        <button
          disabled={!slotReady || isPayLoading}
          onClick={handlePay}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-white transition-opacity disabled:opacity-40 hover:opacity-90 text-sm"
          style={{ background: 'var(--color-primary)' }}
        >
          {isPayLoading ? (
            <><Loader2 size={16} className="animate-spin" /> İşleniyor...</>
          ) : !isAuthenticated ? (
            <><UserCheck size={16} /> Giriş yaparak rezervasyon yap</>
          ) : !selectedServiceId ? (
            'Ders seçin'
          ) : !slotReady ? (
            isFixed(selectedService) ? 'Ders seçin' : 'Saat seçin'
          ) : isSelectedFree ? (
            <><CheckCircle size={16} /> Ücretsiz Rezervasyon Yap</>
          ) : (
            <><ArrowRight size={16} /> {isFixed(selectedService) ? 'Katıl' : 'Ödemeye Geç'}</>
          )}
        </button>

        {slotReady && !isSelectedFree && (
          <p className="text-center text-xs text-gray-400 mt-2 flex items-center justify-center gap-1">
            <ShieldCheck size={11} /> Güvenli ödeme — KuveytTürk 3D Secure
          </p>
        )}
      </div>
    </div>
  )
}
