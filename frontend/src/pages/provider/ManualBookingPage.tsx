import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Users, User, CalendarDays, Clock, ChevronLeft, ChevronRight, BookOpen, Banknote, Link, Copy, Check, Mail } from 'lucide-react'
import { apiClient } from '@/api/client'
import { providersApi } from '@/api/endpoints/providers.api'
import { useToast } from '@/components/ui/Toast'
import type { ServiceItem } from '@/types/provider.types'
import type { AvailableSlot, WeeklySlot } from '@/types/availability.types'

interface TimeRange { startTime: string; endTime: string }
interface DateSlot { date: string; ranges: TimeRange[] }

// ── Date helpers ──────────────────────────────────────────────────────────────

function toDateParam(d: Date) {
  return d.toISOString().split('T')[0]
}

function toDateStr(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function getMonthCells(year: number, month: number): (number | null)[] {
  const startDow = (new Date(year, month, 1).getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  return [...Array(startDow).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
}

const WEEKDAYS = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt']
const MONTH_NAMES = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']
const MONTHS   = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']
const DAY_LABELS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']

function fmtUtc(utc: string) {
  const d = new Date(utc)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${WEEKDAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]} · ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// ── Slot picker ───────────────────────────────────────────────────────────────

function SlotPicker({
  providerId, serviceId, durationMinutes, selectedStart, onSelect,
}: {
  providerId: string
  serviceId: string
  durationMinutes: number
  selectedStart: string | null
  onSelect: (startUtc: string, label: string) => void
}) {
  const today = new Date()
  const todayStr = toDateParam(today)
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [activeDay, setActiveDay] = useState<string | null>(null)

  const { data: slots = [], isLoading, isFetching } = useQuery<AvailableSlot[]>({
    queryKey: ['slots', providerId, serviceId, activeDay],
    queryFn: () => providersApi.getAvailableSlots(providerId, serviceId, activeDay!),
    enabled: !!activeDay,
    staleTime: 0,
  })

  const monthFrom = toDateStr(year, month, 1)
  const monthTo = toDateStr(year, month, new Date(year, month + 1, 0).getDate())

  const { data: monthDateSlots = [] } = useQuery<DateSlot[]>({
    queryKey: ['myDateSlots', monthFrom, monthTo],
    queryFn: () => apiClient.get<DateSlot[]>(`/availability/me/dates?from=${monthFrom}&to=${monthTo}`).then(r => r.data),
  })

  const { data: weeklySlots = [] } = useQuery<WeeklySlot[]>({
    queryKey: ['myAvailability'],
    queryFn: () => apiClient.get<WeeklySlot[]>('/availability/me/weekly').then(r => r.data),
  })

  const dateAvailSet = new Set(monthDateSlots.map(ds => ds.date))
  const weeklyDowSet = new Set(weeklySlots.map(s => s.dayOfWeek))

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1) }
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1) }
  const cells = getMonthCells(year, month)

  return (
    <div className="space-y-3">
      {/* Month nav */}
      <div className="flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
          disabled={year === today.getFullYear() && month === today.getMonth()}
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-bold text-gray-800">{MONTH_NAMES[month]} {year}</span>
        <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500">
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7">
        {DAY_LABELS.map(d => (
          <div key={d} className="text-center text-[9px] font-semibold text-gray-400 uppercase py-1">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />
          const dateStr = toDateStr(year, month, day)
          const isPast = dateStr < todayStr
          const isActive = activeDay === dateStr
          const isToday = dateStr === todayStr
          const dow = new Date(year, month, day).getDay()
          const hasAvail = !isPast && (dateAvailSet.has(dateStr) || weeklyDowSet.has(dow))

          return (
            <button
              key={i}
              disabled={isPast}
              onClick={() => { setActiveDay(dateStr); onSelect('', '') }}
              className={[
                'flex flex-col items-center justify-center rounded-lg py-1.5 text-xs font-medium transition-all min-h-[36px]',
                isPast ? 'text-gray-200 cursor-not-allowed' : 'cursor-pointer hover:opacity-80',
                isActive ? 'text-white shadow-sm' : hasAvail ? '' : 'text-gray-400',
              ].join(' ')}
              style={
                isActive ? { background: 'var(--color-primary)' }
                : hasAvail ? { background: 'var(--color-primary-light)', color: 'var(--color-primary)' }
                : {}
              }
            >
              <span className={`text-sm font-bold ${isToday && !isActive ? 'underline decoration-dotted' : ''}`}>
                {day}
              </span>
            </button>
          )
        })}
      </div>

      {/* Slot list */}
      {activeDay && (
        <div className="pt-2 border-t border-gray-50">
          <p className="text-xs font-semibold text-gray-500 mb-2">
            {new Date(activeDay + 'T12:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' })}
          </p>
          {isLoading || isFetching ? (
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-12 rounded-xl bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : slots.length === 0 ? (
            <div className="py-6 text-center">
              <CalendarDays size={24} className="text-gray-200 mx-auto mb-2" />
              <p className="text-xs text-gray-400">Bu gün müsait saat yok</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {slots.map((slot) => {
                const selected = slot.startUtc === selectedStart
                const full = slot.isFull
                return (
                  <button
                    key={slot.startUtc}
                    disabled={full}
                    onClick={() => !full && onSelect(slot.startUtc, `${slot.startLocal} – ${slot.endLocal}`)}
                    className={[
                      'py-2.5 px-1 rounded-xl text-xs font-semibold border transition-all flex flex-col items-center gap-1',
                      full ? 'text-gray-300 border-gray-100 bg-gray-50 cursor-not-allowed'
                        : selected ? 'text-white border-transparent shadow-sm'
                        : 'text-gray-700 border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50',
                    ].join(' ')}
                    style={selected && !full ? { background: 'var(--color-primary)' } : {}}
                  >
                    <span>{slot.startLocal}</span>
                    {slot.isGroup && slot.maxParticipants && (
                      <span
                        className="flex items-center gap-0.5 text-[9px] font-bold px-1 py-0.5 rounded"
                        style={full
                          ? { background: '#fee2e2', color: '#dc2626' }
                          : selected
                            ? { background: 'rgba(255,255,255,0.25)', color: '#fff' }
                            : { background: 'var(--color-primary-light)', color: 'var(--color-primary)' }
                        }
                      >
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
      )}
    </div>
  )
}

// ── Step indicator ────────────────────────────────────────────────────────────

function Step({ n, label, done, active }: { n: number; label: string; done: boolean; active: boolean }) {
  return (
    <div className={`flex items-center gap-2 text-sm font-medium ${active ? 'text-gray-900' : done ? 'text-gray-400' : 'text-gray-300'}`}>
      <span
        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
        style={done || active ? { background: 'var(--color-primary)', color: '#fff' } : { background: '#f3f4f6', color: '#9ca3af' }}
      >
        {done ? '✓' : n}
      </span>
      {label}
    </div>
  )
}

// ── Input helpers ─────────────────────────────────────────────────────────────

const inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent bg-white'
const inputStyle = { '--tw-ring-color': 'var(--color-primary)' } as React.CSSProperties

// ── Payment link success card ─────────────────────────────────────────────────

function PaymentLinkSuccess({
  token,
  studentName,
  studentEmail,
  onNew,
}: {
  token: string
  studentName: string
  studentEmail: string
  onNew: () => void
}) {
  const [copied, setCopied] = useState(false)
  const link = `${window.location.origin}/odeme/${token}`

  const handleCopy = async () => {
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5 max-w-lg">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'var(--color-primary-light)' }}>
          <Link size={18} style={{ color: 'var(--color-primary)' }} />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900">Ödeme linki oluşturuldu</p>
          <p className="text-xs text-gray-500">{studentName} bu linki kullanarak ödeme yapabilir</p>
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-2">
        <p className="text-xs text-gray-600 flex-1 truncate font-mono">{link}</p>
        <button
          onClick={handleCopy}
          className="flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
          style={copied
            ? { background: '#d1fae5', color: '#059669' }
            : { background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
        >
          {copied ? <><Check size={12} /> Kopyalandı</> : <><Copy size={12} /> Kopyala</>}
        </button>
      </div>

      {studentEmail && (
        <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-xl">
          <Mail size={13} className="text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700">
            Ödeme linki <strong>{studentEmail}</strong> adresine gönderildi.
            Öğrenci ödemeyi tamamladığında rezervasyon otomatik onaylanacak.
          </p>
        </div>
      )}

      {!studentEmail && (
        <p className="text-xs text-gray-400">
          Öğrenci ödemeyi tamamladığında rezervasyon otomatik onaylanır.
        </p>
      )}

      <button
        onClick={onNew}
        className="text-sm font-semibold underline"
        style={{ color: 'var(--color-primary)' }}
      >
        Yeni rezervasyon ekle
      </button>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ManualBookingPage() {
  const [serviceId, setServiceId] = useState('')
  const [selectedStart, setSelectedStart] = useState<string | null>(null)
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [notes, setNotes] = useState('')
  const [generatePaymentLink, setGeneratePaymentLink] = useState(false)
  const [studentEmail, setStudentEmail] = useState('')
  const [paymentLinkToken, setPaymentLinkToken] = useState<string | null>(null)

  const qc = useQueryClient()
  const toast = useToast()

  const { data: services = [] } = useQuery<ServiceItem[]>({
    queryKey: ['myServices'],
    queryFn: () => apiClient.get('/services/me').then((r) => r.data),
  })

  const { data: myProfile } = useQuery({
    queryKey: ['myProfile'],
    queryFn: () => apiClient.get('/providers/me').then((r) => r.data as { providerId: string }),
  })

  const selectedService = services.find((s) => s.id === serviceId)
  const providerId = myProfile?.providerId

  // Fixed-time services (scheduledStart set) don't need a slot picker
  const isFixed = !!selectedService?.scheduledStart
  const effectiveStart = isFixed ? selectedService!.scheduledStart! : selectedStart
  const effectiveLabel = isFixed ? fmtUtc(selectedService!.scheduledStart!) : selectedLabel

  const mutation = useMutation({
    mutationFn: () =>
      apiClient.post('/bookings/manual', {
        serviceId,
        startUtc: effectiveStart,
        studentName: `${firstName.trim()} ${lastName.trim()}`.trim(),
        notes: notes || null,
        generatePaymentLink,
        studentEmail: generatePaymentLink && studentEmail.trim() ? studentEmail.trim() : null,
      }),
    onSuccess: (res) => {
      const token: string | null = res.data?.paymentLinkToken ?? null
      if (token) {
        setPaymentLinkToken(token)
      } else {
        toast.success(
          'Rezervasyon eklendi',
          `${firstName.trim()} ${lastName.trim()} · ${effectiveLabel}`,
        )
        resetForm()
      }
      qc.invalidateQueries({ queryKey: ['slots'], refetchType: 'all' })
      qc.invalidateQueries({ queryKey: ['providerBookings'] })
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message as string | undefined
      toast.error('Rezervasyon eklenemedi', msg ?? 'Lütfen tekrar deneyin.')
    },
  })

  function resetForm() {
    setFirstName('')
    setLastName('')
    setNotes('')
    setGeneratePaymentLink(false)
    setStudentEmail('')
    setPaymentLinkToken(null)
    setSelectedStart(null)
    setSelectedLabel(null)
  }

  const step1Done = !!serviceId
  const step2Done = isFixed ? true : !!selectedStart
  const step3Active = step1Done && step2Done
  const canSubmit = step1Done && step2Done && firstName.trim() && lastName.trim()

  // Show payment link success state
  if (paymentLinkToken) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Rezervasyon Ekle</h1>
          <p className="text-sm text-gray-500 mt-0.5">Ödeme linki oluşturuldu.</p>
        </div>
        <PaymentLinkSuccess
          token={paymentLinkToken}
          studentName={`${firstName.trim()} ${lastName.trim()}`.trim()}
          studentEmail={studentEmail.trim()}
          onNew={() => { resetForm(); setServiceId('') }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Rezervasyon Ekle</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Telefon veya mesaj ile aldığınız randevuyu sisteme ekleyin.
          </p>
        </div>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-3 flex-wrap">
        <Step n={1} label="Ders seç" done={step1Done} active={!step1Done} />
        <ChevronRight size={14} className="text-gray-200 flex-shrink-0" />
        <Step n={2} label="Tarih & saat" done={step2Done} active={step1Done && !step2Done} />
        <ChevronRight size={14} className="text-gray-200 flex-shrink-0" />
        <Step n={3} label="Öğrenci bilgisi" done={false} active={step3Active} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

        {/* Left column: service + student */}
        <div className="space-y-4">

          {/* Service select */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--color-primary-light)' }}>
                <BookOpen size={14} style={{ color: 'var(--color-primary)' }} />
              </div>
              <h2 className="text-sm font-semibold text-gray-800">Ders Seç</h2>
            </div>

            <div className="p-4 space-y-2">
              {services.length === 0 ? (
                <p className="text-xs text-amber-600 py-2">
                  Henüz ders eklenmemiş. Önce Derslerim sayfasından ders ekleyin.
                </p>
              ) : (
                services.map((s) => {
                  const active = serviceId === s.id
                  const Icon = s.sessionType === 'Group' ? Users : User
                  return (
                    <button
                      key={s.id}
                      onClick={() => {
                        setServiceId(s.id)
                        setSelectedStart(null)
                        setSelectedLabel(null)
                        setGeneratePaymentLink(false)
                      }}
                      className={`w-full text-left p-3.5 rounded-xl border-2 transition-all flex items-center gap-3 ${
                        active ? '' : 'border-gray-100 hover:border-gray-200 bg-white'
                      }`}
                      style={active ? { borderColor: 'var(--color-primary)', background: 'var(--color-primary-light)' } : {}}
                    >
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={active ? { background: 'var(--color-primary)' } : { background: '#f3f4f6' }}
                      >
                        <Icon size={15} style={active ? { color: '#fff' } : { color: '#9ca3af' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={active ? { color: 'var(--color-primary)' } : { color: '#111827' }}>
                          {s.name}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {s.durationMinutes} dk
                          {s.sessionType === 'Group' && s.maxParticipants && ` · Maks. ${s.maxParticipants} kişi`}
                          {s.scheduledStart && ` · ${fmtUtc(s.scheduledStart)}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-sm font-bold text-gray-900 flex-shrink-0">
                        <Banknote size={13} className="text-gray-400" />
                        {Number(s.price) === 0 ? <span className="text-green-600">Ücretsiz</span> : `₺${Number(s.price).toLocaleString('tr-TR')}`}
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>

          {/* Student info */}
          <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${step3Active ? 'border-gray-100' : 'border-gray-100 opacity-50 pointer-events-none'}`}>
            <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--color-primary-light)' }}>
                <User size={14} style={{ color: 'var(--color-primary)' }} />
              </div>
              <h2 className="text-sm font-semibold text-gray-800">Öğrenci Bilgisi</h2>
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Ad *</label>
                  <input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Ali"
                    className={inputCls}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Soyad *</label>
                  <input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Yılmaz"
                    className={inputCls}
                    style={inputStyle}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                  Not <span className="font-normal text-gray-400">(isteğe bağlı)</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Konu, seviye veya özel not…"
                  rows={2}
                  className={`${inputCls} resize-none`}
                  style={inputStyle}
                />
              </div>

              {/* Payment link toggle — only when service has a price */}
              {selectedService && Number(selectedService.price) > 0 && (
                <div className="pt-1 space-y-2">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <div
                      onClick={() => setGeneratePaymentLink((v) => !v)}
                      className={`w-10 h-5 rounded-full transition-colors flex-shrink-0 relative cursor-pointer ${generatePaymentLink ? '' : 'bg-gray-200'}`}
                      style={generatePaymentLink ? { background: 'var(--color-primary)' } : {}}
                    >
                      <span
                        className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform"
                        style={{ transform: generatePaymentLink ? 'translateX(20px)' : 'translateX(2px)' }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                      <Link size={12} className="text-gray-400" />
                      Ödeme linkiyle ödesin
                    </span>
                  </label>

                  {generatePaymentLink && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                        <span className="flex items-center gap-1"><Mail size={11} /> Öğrencinin e-postası <span className="font-normal text-gray-400">(ödeme linki bu adrese gönderilir)</span></span>
                      </label>
                      <input
                        type="email"
                        value={studentEmail}
                        onChange={(e) => setStudentEmail(e.target.value)}
                        placeholder="ogrenci@ornek.com"
                        className={inputCls}
                        style={inputStyle}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !canSubmit}
            className="w-full py-3.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40 transition-opacity hover:opacity-90 shadow-sm flex items-center justify-center gap-2"
            style={{ background: 'var(--color-primary)' }}
          >
            {mutation.isPending ? 'Kaydediliyor…' : generatePaymentLink ? <><Link size={15} /> Ödeme Linki Oluştur</> : 'Rezervasyonu Kaydet'}
          </button>
        </div>

        {/* Right column: calendar / fixed time */}
        <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${step1Done ? 'border-gray-100' : 'border-gray-100 opacity-40 pointer-events-none'}`}>
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--color-primary-light)' }}>
                <CalendarDays size={14} style={{ color: 'var(--color-primary)' }} />
              </div>
              <h2 className="text-sm font-semibold text-gray-800">Tarih ve Saat</h2>
            </div>
            {effectiveLabel && (
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
              >
                {effectiveLabel}
              </span>
            )}
          </div>

          <div className="p-4">
            {step1Done && selectedService ? (
              isFixed ? (
                <div className="py-6 text-center space-y-2">
                  <CalendarDays size={28} className="mx-auto" style={{ color: 'var(--color-primary)' }} />
                  <p className="text-sm font-semibold text-gray-800">{fmtUtc(selectedService.scheduledStart!)}</p>
                  <p className="text-xs text-gray-400">Bu ders sabit tarihe sahip</p>
                </div>
              ) : providerId ? (
                <SlotPicker
                  providerId={providerId}
                  serviceId={serviceId}
                  durationMinutes={selectedService.durationMinutes}
                  selectedStart={selectedStart}
                  onSelect={(start, label) => {
                    setSelectedStart(start || null)
                    setSelectedLabel(label || null)
                  }}
                />
              ) : null
            ) : (
              <div className="py-12 text-center">
                <CalendarDays size={32} className="text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-gray-400">Önce bir ders seçin</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
