import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useQuery, useQueries, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, CalendarDays, Clock, Users, CreditCard, ShieldCheck, CheckCircle } from 'lucide-react'
import { providersApi } from '@/api/endpoints/providers.api'
import { apiClient } from '@/api/client'
import { useToast } from '@/components/ui/Toast'
import type { AvailableSlot } from '@/types/availability.types'

// ── Helpers ───────────────────────────────────────────────────────────────────

function getNext14Days(): Date[] {
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i); return d
  })
}
function toParam(d: Date) { return d.toISOString().split('T')[0] }

const WD  = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt']
const MON = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']

function fmtDate(utc: string) {
  const d = new Date(utc)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${WD[d.getDay()]} ${d.getDate()} ${MON[d.getMonth()]} · ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// ── Slot picker ───────────────────────────────────────────────────────────────

function SlotPicker({ providerId, serviceId, durationMinutes, selectedSlotStart, onSelect }: {
  providerId: string; serviceId: string; durationMinutes: number
  selectedSlotStart: string | null; onSelect: (start: string, label: string) => void
}) {
  const days = getNext14Days()
  const [activeDay, setActiveDay] = useState(days[0])

  const dayQueries = useQueries({
    queries: days.map((d) => ({
      queryKey: ['slots', providerId, serviceId, toParam(d)],
      queryFn: () => providersApi.getAvailableSlots(providerId, serviceId, toParam(d)),
      staleTime: 60_000,
    })),
  })

  const activeDateStr = toParam(activeDay)
  const activeIdx = days.findIndex((d) => toParam(d) === activeDateStr)
  const slots: AvailableSlot[] = dayQueries[activeIdx]?.data ?? []
  const loading = dayQueries[activeIdx]?.isLoading ?? true

  const avail: Record<string, boolean | undefined> = {}
  days.forEach((d, i) => {
    const q = dayQueries[i]
    if (!q.isLoading) avail[toParam(d)] = (q.data?.length ?? 0) > 0
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
  const daySet = new Set(days.map((d) => toParam(d)))

  const monthLabel = (() => {
    const a = days[0], b = days[days.length - 1]
    const af = a.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })
    if (a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()) return af
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
          const ds = toParam(cell)
          const inRange = daySet.has(ds)
          if (!inRange) {
            return (
              <div key={ds} className="flex items-center justify-center h-9">
                <span className="text-xs text-gray-200">{cell.getDate()}</span>
              </div>
            )
          }
          const active = ds === activeDateStr
          const hasSlots = avail[ds]
          const loadingDay = avail[ds] === undefined
          const disabled = !loadingDay && hasSlots === false
          return (
            <button
              key={ds}
              disabled={disabled}
              onClick={() => { setActiveDay(cell); onSelect('', '') }}
              className={['flex flex-col items-center justify-center h-9 rounded-xl text-xs font-semibold transition-all',
                active ? 'text-white shadow-sm' : disabled
                  ? 'text-gray-300 cursor-not-allowed opacity-40'
                  : 'text-gray-700 hover:bg-gray-100'].join(' ')}
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

      {/* Slots */}
      <div className="border-t border-gray-100 pt-4">
        {loading ? (
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-12 rounded-xl bg-gray-100 animate-pulse" />)}
          </div>
        ) : slots.length === 0 ? (
          <div className="py-10 text-center">
            <CalendarDays size={28} className="text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Bu gün müsait saat yok</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {slots.map((slot) => {
              const selected = slot.startUtc === selectedSlotStart
              const full = slot.isFull
              return (
                <button
                  key={slot.startUtc}
                  disabled={full}
                  onClick={() => !full && onSelect(slot.startUtc, `${slot.startLocal} – ${slot.endLocal}`)}
                  className={['py-3 rounded-xl text-xs font-semibold border transition-all flex flex-col items-center gap-1',
                    full ? 'text-gray-300 border-gray-100 bg-gray-50 cursor-not-allowed'
                      : selected ? 'text-white border-transparent shadow-sm'
                      : 'text-gray-700 border-gray-200 bg-white hover:border-gray-300'].join(' ')}
                  style={selected && !full ? { background: 'var(--color-primary)' } : {}}
                >
                  <span className="text-sm">{slot.startLocal}</span>
                  {slot.isGroup && slot.maxParticipants && (
                    <span className="flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-md"
                      style={full ? { background: '#fee2e2', color: '#dc2626' }
                        : selected ? { background: 'rgba(255,255,255,0.25)', color: '#fff' }
                        : { background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
                      {full ? 'DOLU' : <><Users size={8} /> {slot.currentParticipants}/{slot.maxParticipants}</>}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}
        <p className="text-xs text-gray-400 mt-3 flex items-center gap-1.5">
          <Clock size={11} /> Her ders {durationMinutes} dakika
        </p>
      </div>
    </div>
  )
}

// ── Step badge ────────────────────────────────────────────────────────────────

function StepDot({ n, done, active }: { n: number; done: boolean; active: boolean }) {
  return (
    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${active || done ? 'text-white' : 'text-gray-300'}`}
      style={active || done ? { background: 'var(--color-primary)' } : { background: '#f3f4f6' }}>
      {done ? <CheckCircle size={13} /> : n}
    </div>
  )
}

// ── PayTR iframe view ─────────────────────────────────────────────────────────

function PayTrCheckout({ iframeToken, onBack }: { iframeToken: string; onBack: () => void }) {
  return (
    <div className="max-w-lg mx-auto py-6 space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-500">
          <ChevronLeft size={20} />
        </button>
        <div>
          <h2 className="text-base font-bold text-gray-900">Güvenli Ödeme</h2>
          <p className="text-xs text-gray-400 flex items-center gap-1">
            <ShieldCheck size={11} /> PayTR ile şifreli ödeme
          </p>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <iframe
          src={`https://www.paytr.com/odeme/guvenli/${iframeToken}`}
          id="paytriframe"
          frameBorder="0"
          scrolling="no"
          style={{ width: '100%', height: '600px' }}
          title="PayTR Ödeme"
          allow="payment"
        />
      </div>
    </div>
  )
}

// ── KuveytTürk types ─────────────────────────────────────────────────────────

interface CardData {
  cardNumber: string
  cardHolderName: string
  cardExpireMonth: string
  cardExpireYear: string
  cardCvv: string
}

// ── KuveytTürk 3D Secure redirect (renders bank's htmlContent) ────────────────

function KuveytTurkCheckout({ formContent }: { formContent: string }) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return
    containerRef.current.innerHTML = formContent
    const form = containerRef.current.querySelector('form')
    if (!form) return

    const set = (name: string, value: string) => {
      const el = form.querySelector<HTMLInputElement>(`input[name="${name}"]`)
      if (el) el.value = value
    }
    set('browserColorDepth', String(screen.colorDepth))
    set('browserScreenHeight', String(screen.height))
    set('browserScreenWidth', String(screen.width))
    set('browserTZ', String(new Date().getTimezoneOffset()))
    set('browserJavascriptEnabled', 'true')
    set('browserJavaEnabled', 'false')
    set('browserLanguage', navigator.language)

    form.submit()
  }, [formContent])

  return (
    <>
      <div className="max-w-lg mx-auto py-20 text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto" style={{ background: 'var(--color-primary-light)' }}>
          <ShieldCheck size={26} style={{ color: 'var(--color-primary)' }} />
        </div>
        <h2 className="text-xl font-bold text-gray-900">3D Secure Sayfasına Yönlendiriliyorsunuz</h2>
        <p className="text-sm text-gray-500">Lütfen bekleyin…</p>
        <div className="flex justify-center">
          <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
        </div>
      </div>
      <div ref={containerRef} style={{ display: 'none' }} />
    </>
  )
}

// ── KuveytTürk kart bilgisi formu ─────────────────────────────────────────────

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
    onSubmit({
      ...card,
      cardNumber: card.cardNumber.replace(/\s/g, ''),
    })
  }

  const inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent'
  const ringStyle = { '--tw-ring-color': 'var(--color-primary)' } as React.CSSProperties

  return (
    <div className="max-w-lg mx-auto space-y-4">
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
  )
}

// ── iyzico form view (legacy) ─────────────────────────────────────────────────

function IyzicoCheckout({ formContent, onBack }: { formContent: string; onBack: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(formContent, 'text/html')
    const scripts = Array.from(doc.querySelectorAll('script'))
    const run = (i: number) => {
      if (i >= scripts.length) return
      const el = document.createElement('script')
      if (scripts[i].src) { el.src = scripts[i].src; el.onload = () => run(i + 1); el.onerror = () => run(i + 1) }
      else { el.textContent = scripts[i].textContent; setTimeout(() => run(i + 1), 0) }
      document.body.appendChild(el)
    }
    run(0)
  }, [formContent])

  return (
    <div className="max-w-lg mx-auto py-12 text-center space-y-5">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto" style={{ background: 'var(--color-primary-light)' }}>
        <CreditCard size={26} style={{ color: 'var(--color-primary)' }} />
      </div>
      <h2 className="text-xl font-bold text-gray-900">Ödeme Sayfasına Yönlendiriliyorsunuz</h2>
      <p className="text-sm text-gray-500">iyzico güvenli ödeme formu yükleniyor…</p>
      <div ref={containerRef} id="iyzipay-checkout-form" className="responsive" />
      <button onClick={onBack} className="text-sm text-gray-400 hover:text-gray-600 underline">
        Geri dön
      </button>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

type PaymentState =
  | { type: 'none' }
  | { type: 'paytr'; iframeToken: string }
  | { type: 'kuveytturk-card-form' }
  | { type: 'kuveytturk'; formContent: string }
  | { type: 'iyzico'; formContent: string }

export default function BookingFlowPage() {
  const { providerId, serviceId } = useParams<{ providerId: string; serviceId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const qc = useQueryClient()
  const toast = useToast()
  const [clientNotes, setClientNotes] = useState('')
  const [paymentState, setPaymentState] = useState<PaymentState>({ type: 'none' })

  const pre = (location.state as { slotStart?: string; slotLabel?: string }) ?? {}
  const [selectedSlotStart, setSelectedSlotStart] = useState<string | null>(pre.slotStart ?? null)
  const [selectedSlotLabel, setSelectedSlotLabel] = useState<string | null>(pre.slotLabel ?? null)

  const { data: provider, isLoading } = useQuery({
    queryKey: ['provider', providerId],
    queryFn: () => providersApi.getById(providerId!),
    enabled: !!providerId,
  })

  const service = provider?.services.find((s) => s.id === serviceId)

  const initPaymentMutation = useMutation({
    mutationFn: (card: CardData) =>
      apiClient
        .post('/payments/initialize', {
          serviceId,
          providerId,
          startUtc: selectedSlotStart,
          clientNotes: clientNotes || null,
          cardNumber: card.cardNumber,
          cardHolderName: card.cardHolderName,
          cardExpireMonth: card.cardExpireMonth,
          cardExpireYear: card.cardExpireYear,
          cardCvv: card.cardCvv,
        })
        .then((r) => r.data as { gatewayType: string; iframeToken?: string; formContent?: string }),
    onSuccess: (data) => {
      if (data.gatewayType === 'PayTr' && data.iframeToken) {
        setPaymentState({ type: 'paytr', iframeToken: data.iframeToken })
      } else if (data.gatewayType === 'KuveytTurk' && data.formContent) {
        setPaymentState({ type: 'kuveytturk', formContent: data.formContent })
      } else if (data.formContent) {
        setPaymentState({ type: 'iyzico', formContent: data.formContent })
      }
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      const isSlotTaken = msg?.toLowerCase().includes('not available') || msg?.toLowerCase().includes('slot')
      if (isSlotTaken) {
        setSelectedSlotStart(null)
        setSelectedSlotLabel(null)
        qc.invalidateQueries({ queryKey: ['slots', providerId] })
        toast.error('Saat müsait değil', 'Bu saat dolu, lütfen başka bir saat seçin.')
      } else {
        toast.error('Ödeme başlatılamadı', msg ?? 'Lütfen tekrar deneyin.')
      }
    },
  })

  if (paymentState.type === 'paytr') {
    return <PayTrCheckout iframeToken={paymentState.iframeToken} onBack={() => setPaymentState({ type: 'none' })} />
  }

  if (paymentState.type === 'kuveytturk-card-form') {
    return (
      <KuveytTurkCardForm
        price={service?.price ?? 0}
        isLoading={initPaymentMutation.isPending}
        onBack={() => setPaymentState({ type: 'none' })}
        onSubmit={(card) => initPaymentMutation.mutate(card)}
      />
    )
  }

  if (paymentState.type === 'kuveytturk') {
    return <KuveytTurkCheckout formContent={paymentState.formContent} />
  }

  if (paymentState.type === 'iyzico') {
    return <IyzicoCheckout formContent={paymentState.formContent} onBack={() => setPaymentState({ type: 'none' })} />
  }

  if (isLoading || !provider) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 animate-pulse">
        <div className="h-8 bg-gray-100 rounded-xl w-1/3" />
        <div className="h-16 bg-white rounded-2xl border border-gray-100" />
        <div className="h-72 bg-white rounded-2xl border border-gray-100" />
      </div>
    )
  }

  const step1Done = !!selectedSlotStart
  const initials = provider.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="max-w-2xl mx-auto space-y-4">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-500 flex-shrink-0">
          <ChevronLeft size={20} />
        </button>
        <div className="flex items-center gap-3 min-w-0">
          {provider.avatarUrl
            ? <img src={provider.avatarUrl} alt={provider.fullName} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
            : <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ background: 'var(--color-primary)' }}>{initials}</div>
          }
          <div className="min-w-0">
            <h1 className="text-base font-bold text-gray-900 leading-tight truncate">Rezervasyon</h1>
            <p className="text-sm text-gray-400 truncate">{provider.fullName}</p>
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-2 px-1">
        <StepDot n={1} done={step1Done} active={!step1Done} />
        <span className={`text-xs font-medium ${step1Done ? 'text-gray-400' : 'text-gray-700'}`}>Saat Seç</span>
        <div className="flex-1 h-px bg-gray-200" />
        <StepDot n={2} done={false} active={step1Done} />
        <span className={`text-xs font-medium ${step1Done ? 'text-gray-700' : 'text-gray-300'}`}>Not & Ödeme</span>
      </div>

      {/* Service card */}
      {service && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-bold text-gray-900 truncate">{service.name}</p>
            <p className="text-sm text-gray-400 mt-0.5 flex items-center gap-1.5">
              <Clock size={12} /> {service.durationMinutes} dakika
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="font-extrabold text-xl text-gray-900">₺{Number(service.price).toLocaleString('tr-TR')}</p>
          </div>
        </div>
      )}

      {/* Calendar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
          <CalendarDays size={15} style={{ color: 'var(--color-primary)' }} />
          <h2 className="text-sm font-semibold text-gray-800">Tarih ve Saat Seç</h2>
          {selectedSlotLabel && (
            <span className="ml-auto text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
              {selectedSlotLabel}
            </span>
          )}
        </div>
        <div className="p-5">
          {service ? (
            <SlotPicker
              providerId={providerId!}
              serviceId={serviceId!}
              durationMinutes={service.durationMinutes}
              selectedSlotStart={selectedSlotStart}
              onSelect={(start, label) => { setSelectedSlotStart(start || null); setSelectedSlotLabel(label || null) }}
            />
          ) : (
            <p className="text-sm text-gray-400 py-6 text-center">Hizmet bulunamadı.</p>
          )}
        </div>
      </div>

      {/* Notes + payment — only when slot selected */}
      {step1Done && (
        <>
          {/* Selected slot confirmation */}
          <div className="flex items-center gap-3 p-4 rounded-2xl border"
            style={{ background: 'var(--color-primary-light)', borderColor: 'var(--color-primary)' }}>
            <CheckCircle size={18} style={{ color: 'var(--color-primary)' }} className="flex-shrink-0" />
            <div>
              <p className="text-xs font-medium" style={{ color: 'var(--color-primary)' }}>Seçilen saat</p>
              <p className="text-sm font-bold text-gray-900">{fmtDate(selectedSlotStart!)}</p>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">
              Öğretmene not <span className="font-normal text-gray-400 text-xs">(isteğe bağlı)</span>
            </label>
            <textarea
              value={clientNotes}
              onChange={(e) => setClientNotes(e.target.value)}
              placeholder="Odaklanmak istediğiniz konuları, önceki bilginizi yazabilirsiniz…"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:border-transparent"
              style={{ '--tw-ring-color': 'var(--color-primary)' } as React.CSSProperties}
              rows={3}
            />
          </div>

          {/* Payment trust badge */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--color-primary-light)' }}>
              <ShieldCheck size={16} style={{ color: 'var(--color-primary)' }} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700">Güvenli Ödeme — KuveytTürk 3D Secure</p>
              <p className="text-xs text-gray-400">Kart bilgileriniz 3D Secure ve SSL ile güvence altındadır.</p>
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={() => setPaymentState({ type: 'kuveytturk-card-form' })}
            className="w-full py-4 rounded-2xl text-sm font-bold text-white transition-opacity hover:opacity-90 shadow-md"
            style={{ background: 'var(--color-primary)' }}
          >
            {`Ödemeye Geç → ₺${Number(service?.price ?? 0).toLocaleString('tr-TR')}`}
          </button>
        </>
      )}

      {!step1Done && (
        <p className="text-center text-sm text-gray-400 pb-4">Devam etmek için yukarıdan bir saat seçin.</p>
      )}
    </div>
  )
}
