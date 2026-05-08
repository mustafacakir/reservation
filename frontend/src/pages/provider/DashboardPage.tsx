import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  CalendarDays, Clock, CheckCircle, Sun, MessageSquare, Banknote,
  X, Check, ChevronRight, CalendarPlus, Pencil,
} from 'lucide-react'
import { bookingsApi } from '@/api/endpoints/bookings.api'
import { apiClient } from '@/api/client'
import { useAuthStore } from '@/store/auth.store'
import type { Booking } from '@/types/booking.types'
import type { WeeklySlot } from '@/types/availability.types'

// ── Constants ──────────────────────────────────────────────────────────────────

const DAY_SHORT  = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt']
const DAY_FULL   = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi']
const MONTHS     = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']
const MONTHS_FULL = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']

type Filter = 'upcoming' | 'pending' | 'completed' | 'all'
const FILTER_LABELS: Record<Filter, string> = {
  upcoming: 'Yaklaşan', pending: 'Bekleyen', completed: 'Tamamlanan', all: 'Tümü',
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const pad = (n: number) => String(n).padStart(2, '0')

function fmtTime(utc: string) {
  const d = new Date(utc)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function fmtDateShort(utc: string) {
  const d = new Date(utc)
  return `${DAY_SHORT[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`
}

function isToday(utc: string) {
  const d = new Date(utc), n = new Date()
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate()
}

function isTomorrow(utc: string) {
  const d = new Date(utc), t = new Date()
  t.setDate(t.getDate() + 1)
  return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate()
}

function dayLabel(utc: string) {
  if (isToday(utc)) return 'Bugün'
  if (isTomorrow(utc)) return 'Yarın'
  return fmtDateShort(utc)
}

function effectiveStatus(b: Booking): Booking['status'] {
  if ((b.status === 'Confirmed' || b.status === 'Pending') && new Date(b.endUtc) < new Date()) return 'Completed'
  return b.status
}

// ── Weekly Schedule ────────────────────────────────────────────────────────────

function WeeklySchedule({ slots, isLoading }: { slots: WeeklySlot[]; isLoading: boolean }) {
  const today = new Date()
  const todayDow = today.getDay()

  // Get this week's date for each day-of-week (Sun=0 … Sat=6)
  const weekDates: Record<number, Date> = {}
  for (let dow = 0; dow < 7; dow++) {
    const d = new Date(today)
    d.setDate(today.getDate() + (dow - todayDow))
    weekDates[dow] = d
  }

  const byDay: Record<number, WeeklySlot[]> = Object.fromEntries(
    Array.from({ length: 7 }, (_, i) => [i, []])
  )
  slots.forEach((s) => byDay[s.dayOfWeek].push(s))
  const activeCount = Object.values(byDay).filter((r) => r.length > 0).length

  const totalHours = slots.reduce((sum, s) => {
    const [sh, sm] = s.startTime.split(':').map(Number)
    const [eh, em] = s.endTime.split(':').map(Number)
    return sum + (eh * 60 + em - (sh * 60 + sm)) / 60
  }, 0)

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--color-primary-light)' }}>
            <CalendarDays size={15} style={{ color: 'var(--color-primary)' }} />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 text-sm leading-none">Haftalık Program</h2>
            {!isLoading && activeCount > 0 && (
              <p className="text-xs text-gray-400 mt-0.5">{activeCount} gün · {Math.round(totalHours)} saat/hafta</p>
            )}
          </div>
        </div>
        <Link
          to="/provider/availability"
          className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors hover:bg-gray-50"
          style={{ color: 'var(--color-primary)', borderColor: 'var(--color-primary-light)' }}
        >
          <Pencil size={11} /> Düzenle
        </Link>
      </div>

      <div className="p-4">
        {isLoading ? (
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-24 rounded-xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : activeCount === 0 ? (
          <div className="py-8 text-center">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: 'var(--color-primary-light)' }}>
              <CalendarPlus size={20} style={{ color: 'var(--color-primary)' }} />
            </div>
            <p className="text-sm font-medium text-gray-700 mb-1">Müsaitlik saati ayarlanmamış</p>
            <p className="text-xs text-gray-400 mb-4">Öğrenciler sizi bulmak için saatlerinizi belirlemeniz gerekiyor.</p>
            <Link
              to="/provider/availability"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'var(--color-primary)' }}
            >
              <CalendarPlus size={14} /> Saatleri Ayarla
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1.5">
            {[0, 1, 2, 3, 4, 5, 6].map((dow) => {
              const ranges = byDay[dow]
              const active = ranges.length > 0
              const isNow = dow === todayDow
              return (
                <div
                  key={dow}
                  className="rounded-xl flex flex-col items-center text-center py-3 px-1 relative"
                  style={{
                    background: active ? 'var(--color-primary-light)' : '#f9fafb',
                    boxShadow: isNow && active ? '0 0 0 2px var(--color-primary)' : undefined,
                  }}
                >
                  {isNow && active && (
                    <span
                      className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
                      style={{ background: 'var(--color-primary)' }}
                    />
                  )}
                  <p
                    className="text-[10px] font-bold leading-none"
                    style={{ color: active ? 'var(--color-primary)' : '#d1d5db' }}
                  >
                    {DAY_SHORT[dow]}
                  </p>
                  <p
                    className="text-sm font-bold leading-none mt-1 mb-2"
                    style={{ color: active ? 'var(--color-primary)' : isNow ? '#6b7280' : '#d1d5db' }}
                  >
                    {weekDates[dow].getDate()}
                  </p>

                  {active ? (
                    <div className="w-full space-y-2">
                      {ranges.map((r, i) => (
                        <div key={i} className="text-center">
                          <p className="text-[9px] font-bold leading-none" style={{ color: 'var(--color-primary)' }}>
                            {r.startTime.slice(0, 5)}
                          </p>
                          <div className="my-0.5 flex justify-center">
                            <div className="w-px h-3" style={{ background: 'var(--color-primary)', opacity: 0.3 }} />
                          </div>
                          <p className="text-[9px] font-bold leading-none" style={{ color: 'var(--color-primary)' }}>
                            {r.endTime.slice(0, 5)}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[9px] text-gray-300">—</p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Today Panel ────────────────────────────────────────────────────────────────

function TodayPanel({ bookings }: { bookings: Booking[] }) {
  const now = new Date()
  const today = bookings
    .filter((b) => isToday(b.startUtc) && effectiveStatus(b) !== 'Cancelled')
    .sort((a, b) => new Date(a.startUtc).getTime() - new Date(b.startUtc).getTime())

  const nextIdx = today.findIndex((b) => new Date(b.startUtc) > now)

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: today.length > 0 ? 'var(--color-primary)' : 'var(--color-primary-light)' }}>
            <Sun size={15} style={{ color: today.length > 0 ? '#fff' : 'var(--color-primary)' }} />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 text-sm leading-none">Bugün</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {today.length > 0 ? `${today.length} ders planlandı` : 'Ders yok'}
            </p>
          </div>
        </div>
      </div>

      <div className="px-5">
        {today.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-gray-400">Bugün için planlanmış ders yok.</p>
          </div>
        ) : (
          today.map((b, idx) => {
            const status = effectiveStatus(b)
            const isNext = idx === nextIdx
            const isDone = status === 'Completed' || (new Date(b.startUtc) < now && !isNext)
            return (
              <div key={b.id} className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
                <div className="w-10 flex-shrink-0 text-right pt-0.5">
                  <p className="text-xs font-bold text-gray-900">{fmtTime(b.startUtc)}</p>
                </div>

                <div className="flex flex-col items-center pt-1.5 flex-shrink-0">
                  <div
                    className={`w-2.5 h-2.5 rounded-full border-2 ${isDone ? 'bg-gray-300 border-gray-300' : ''}`}
                    style={isNext
                      ? { background: 'var(--color-primary)', borderColor: 'var(--color-primary)' }
                      : isDone
                        ? {}
                        : { background: '#fff', borderColor: 'var(--color-primary)' }
                    }
                  />
                  {idx < today.length - 1 && (
                    <div className="w-px flex-1 min-h-[20px] mt-1 bg-gray-100" />
                  )}
                </div>

                <div className="flex-1 min-w-0 pb-1">
                  <p className={`text-sm font-semibold leading-snug truncate ${isDone ? 'text-gray-400' : 'text-gray-900'}`}>
                    {b.serviceName}
                  </p>
                  {b.clientName && (
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{b.clientName}</p>
                  )}
                  {isNext && (
                    <span className="inline-block mt-1 text-[9px] font-bold px-1.5 py-0.5 rounded text-white" style={{ background: 'var(--color-primary)' }}>
                      SIRADAKI
                    </span>
                  )}
                </div>

                {status === 'Completed' && <Check size={13} className="text-gray-300 flex-shrink-0 mt-1" />}
                {status === 'Pending' && <span className="text-[9px] font-bold text-amber-500 flex-shrink-0 mt-1">BEKL.</span>}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

// ── Booking Card ───────────────────────────────────────────────────────────────

function BookingCard({ b }: { b: Booking }) {
  const qc = useQueryClient()
  const today = isToday(b.startUtc)
  const status = effectiveStatus(b)
  const canCancel = status === 'Pending' || status === 'Confirmed'
  const [confirming, setConfirming] = useState(false)

  const cancelMutation = useMutation({
    mutationFn: () => bookingsApi.cancel(b.id),
    onSuccess: () => { setConfirming(false); qc.invalidateQueries({ queryKey: ['providerBookings'] }) },
    onError: () => setConfirming(false),
  })

  return (
    <div className={`bg-white rounded-2xl border transition-shadow hover:shadow-md ${
      today && status !== 'Completed' ? 'border-[var(--color-primary)] shadow-sm' : 'border-gray-100 shadow-sm'
    }`}>
      {today && status !== 'Completed' && (
        <div className="px-4 py-1.5 rounded-t-2xl text-[10px] font-bold tracking-wider uppercase text-white" style={{ background: 'var(--color-primary)' }}>
          Bugün
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
            style={{ background: 'var(--color-primary)' }}
          >
            {(b.clientName ?? b.providerName).split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-gray-900 text-sm leading-snug">{b.serviceName}</p>
                {b.clientName && <p className="text-xs text-gray-500 mt-0.5">{b.clientName}</p>}
              </div>
              {status === 'Completed' && (
                <span className="flex-shrink-0 flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">
                  <Check size={10} /> Tamamlandı
                </span>
              )}
              {status === 'Cancelled' && (
                <span className="flex-shrink-0 flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-500">
                  <X size={10} /> İptal
                </span>
              )}
              {status === 'Pending' && (
                <span className="flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">
                  Beklemede
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <CalendarDays size={11} />{dayLabel(b.startUtc)}
              </span>
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <Clock size={11} />{fmtTime(b.startUtc)}
              </span>
              <span className="flex items-center gap-1 text-xs font-semibold text-gray-600">
                <Banknote size={11} />₺{Number(b.price).toLocaleString('tr-TR')}
              </span>
            </div>

            {b.clientNotes && (
              <div className="mt-2.5 flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                <MessageSquare size={12} className="text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 leading-relaxed">{b.clientNotes}</p>
              </div>
            )}

            {canCancel && (
              <div className="mt-3 flex items-center gap-2">
                {confirming ? (
                  <>
                    <span className="text-xs text-gray-500">Emin misiniz?</span>
                    <button
                      onClick={() => cancelMutation.mutate()}
                      disabled={cancelMutation.isPending}
                      className="text-xs font-semibold text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg disabled:opacity-50 transition-colors"
                    >
                      {cancelMutation.isPending ? '…' : 'İptal Et'}
                    </button>
                    <button
                      onClick={() => setConfirming(false)}
                      className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg border border-gray-200 transition-colors"
                    >
                      Vazgeç
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setConfirming(true)}
                    className="text-xs text-red-400 hover:text-red-600 font-medium border border-red-100 hover:border-red-200 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    İptal Et
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function ProviderDashboard() {
  const fullName = useAuthStore((s) => s.fullName)
  const firstName = fullName?.split(' ')[0] ?? ''
  const [filter, setFilter] = useState<Filter>('upcoming')

  const now = new Date()
  const todayStr = `${DAY_FULL[now.getDay()]}, ${now.getDate()} ${MONTHS_FULL[now.getMonth()]} ${now.getFullYear()}`

  const { data: bookingData, isLoading: bookingsLoading } = useQuery({
    queryKey: ['providerBookings'],
    queryFn: () => bookingsApi.getMyBookings(1, 200),
  })

  const { data: availSlots = [], isLoading: availLoading } = useQuery<WeeklySlot[]>({
    queryKey: ['myAvailability'],
    queryFn: () => apiClient.get<WeeklySlot[]>('/availability/me/weekly').then((r) => r.data),
  })

  const all = bookingData?.items ?? []

  const upcoming = all
    .filter((b) => effectiveStatus(b) !== 'Completed' && effectiveStatus(b) !== 'Cancelled' &&
      (isToday(b.startUtc) || new Date(b.startUtc) > now))
    .sort((a, b) => new Date(a.startUtc).getTime() - new Date(b.startUtc).getTime())

  const todayCount     = all.filter((b) => isToday(b.startUtc) && effectiveStatus(b) !== 'Cancelled').length
  const pendingCount   = all.filter((b) => effectiveStatus(b) === 'Pending').length
  const completedCount = all.filter((b) => effectiveStatus(b) === 'Completed').length

  const filtered =
    filter === 'upcoming'  ? upcoming :
    filter === 'pending'   ? all.filter((b) => effectiveStatus(b) === 'Pending') :
    filter === 'completed' ? all.filter((b) => effectiveStatus(b) === 'Completed') :
    all

  const stats = [
    { label: 'Bugün',      value: todayCount,     Icon: Sun,          active: todayCount > 0 },
    { label: 'Yaklaşan',   value: upcoming.length, Icon: CalendarDays, active: false },
    { label: 'Bekleyen',   value: pendingCount,    Icon: Clock,        active: pendingCount > 0 },
    { label: 'Tamamlanan', value: completedCount,  Icon: CheckCircle,  active: false },
  ]

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {firstName ? `Merhaba, ${firstName}` : 'Genel Bakış'}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">{todayStr}</p>
        </div>
        <Link
          to="/provider/rezervasyon-ekle"
          className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
          style={{ background: 'var(--color-primary)' }}
        >
          <CalendarPlus size={14} /> Rezervasyon Ekle
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {stats.map(({ label, value, Icon, active }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 sm:p-4 flex flex-col">
            <div
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center mb-2 sm:mb-3"
              style={{ background: active ? 'var(--color-primary)' : 'var(--color-primary-light)' }}
            >
              <Icon size={13} style={{ color: active ? '#fff' : 'var(--color-primary)' }} />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 leading-none">{value}</p>
            <p className="text-[10px] sm:text-xs text-gray-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Weekly Schedule — main feature */}
      <WeeklySchedule slots={availSlots} isLoading={availLoading} />

      {/* Today's timeline + quick CTA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TodayPanel bookings={all} />

        {/* Quick links */}
        <div className="grid grid-cols-1 gap-2">
          <Link
            to="/provider/availability"
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4 hover:shadow-md transition-shadow group"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--color-primary-light)' }}>
              <Clock size={18} style={{ color: 'var(--color-primary)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">Müsaitlik Saatleri</p>
              <p className="text-xs text-gray-400 mt-0.5">Açık gün ve saatlerinizi düzenleyin</p>
            </div>
            <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
          </Link>

          <Link
            to="/provider/rezervasyon-ekle"
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4 hover:shadow-md transition-shadow group"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--color-primary-light)' }}>
              <CalendarPlus size={18} style={{ color: 'var(--color-primary)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">Manuel Rezervasyon</p>
              <p className="text-xs text-gray-400 mt-0.5">Telefon rezervasyonunu sisteme ekleyin</p>
            </div>
            <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
          </Link>

          <Link
            to="/provider/services"
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4 hover:shadow-md transition-shadow group"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--color-primary-light)' }}>
              <CalendarDays size={18} style={{ color: 'var(--color-primary)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">Derslerim</p>
              <p className="text-xs text-gray-400 mt-0.5">Ders türlerini ve ücretleri yönetin</p>
            </div>
            <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
          </Link>
        </div>
      </div>

      {/* Booking list with filter */}
      <div>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="font-semibold text-gray-900">Dersler</h2>
          <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
            {(Object.keys(FILTER_LABELS) as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                  filter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {FILTER_LABELS[f]}
                {f === 'pending' && pendingCount > 0 && (
                  <span className="ml-1 text-[10px] font-bold px-1 rounded-full text-white" style={{ background: 'var(--color-primary)' }}>
                    {pendingCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {bookingsLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-white rounded-2xl border border-gray-100 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-14 text-center">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: 'var(--color-primary-light)' }}>
              <CalendarDays size={20} style={{ color: 'var(--color-primary)' }} />
            </div>
            <p className="text-sm font-medium text-gray-600">Ders bulunamadı</p>
            <p className="text-xs text-gray-400 mt-1">
              {filter === 'upcoming' ? 'Yaklaşan ders yok. Müsaitliğinizi güncelleyin.' : 'Bu filtrede ders yok.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((b) => <BookingCard key={b.id} b={b} />)}
          </div>
        )}
      </div>

    </div>
  )
}
