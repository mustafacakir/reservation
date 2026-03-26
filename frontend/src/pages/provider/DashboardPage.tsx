import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Sun, CalendarDays, Clock, CheckCircle, MessageSquare, Banknote } from 'lucide-react'
import { bookingsApi } from '@/api/endpoints/bookings.api'
import { useAuthStore } from '@/store/auth.store'
import type { Booking } from '@/types/booking.types'

type Filter = 'upcoming' | 'pending' | 'completed' | 'all'

const FILTER_LABELS: Record<Filter, string> = {
  upcoming: 'Yaklaşan',
  pending: 'Bekleyen',
  completed: 'Tamamlanan',
  all: 'Tümü',
}

const WEEKDAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi']
const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']

function formatDate(utc: string) {
  const d = new Date(utc)
  const pad = (n: number) => String(n).padStart(2, '0')
  return {
    full: `${WEEKDAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  }
}

function isToday(utc: string) {
  const d = new Date(utc)
  const now = new Date()
  return d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
}

function isTomorrow(utc: string) {
  const d = new Date(utc)
  const t = new Date()
  t.setDate(t.getDate() + 1)
  return d.getFullYear() === t.getFullYear() &&
    d.getMonth() === t.getMonth() &&
    d.getDate() === t.getDate()
}

function dayLabel(utc: string) {
  if (isToday(utc)) return 'Bugün'
  if (isTomorrow(utc)) return 'Yarın'
  return formatDate(utc).full
}

function effectiveStatus(b: Booking): Booking['status'] {
  if ((b.status === 'Confirmed' || b.status === 'Pending') && new Date(b.endUtc) < new Date()) {
    return 'Completed'
  }
  return b.status
}

function ClientAvatar({ name }: { name: string }) {
  const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
      style={{ background: 'var(--color-primary)' }}
    >
      {initials}
    </div>
  )
}


function BookingRow({ b }: { b: Booking }) {
  const { time } = formatDate(b.startUtc)
  const today = isToday(b.startUtc)
  const status = effectiveStatus(b)

  return (
    <div className={`bg-white rounded-2xl border shadow-sm p-4 transition-all hover:shadow-md ${today && status !== 'Completed' ? 'border-[var(--color-primary)]' : 'border-gray-100'}`}>
      <div className="flex items-start gap-3">
        <ClientAvatar name={b.clientName ?? b.providerName} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-gray-900 text-sm">{b.serviceName}</p>
              {b.clientName && <p className="text-xs text-gray-500 mt-0.5">{b.clientName}</p>}
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <CalendarDays size={12} />{dayLabel(b.startUtc)}
                </span>
                <span className="text-gray-300">·</span>
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Clock size={12} />{time}
                </span>
                <span className="text-gray-300">·</span>
                <span className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                  <Banknote size={12} />₺{Number(b.price).toLocaleString('tr-TR')}
                </span>
              </div>
            </div>
            {today && status !== 'Completed' && (
              <span className="flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full text-white" style={{ background: 'var(--color-primary)' }}>
                Bugün
              </span>
            )}
            {status === 'Completed' && (
              <span className="flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">
                Tamamlandı
              </span>
            )}
          </div>

          {b.clientNotes && (
            <div className="mt-2.5 flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
              <MessageSquare size={13} className="text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 leading-relaxed">{b.clientNotes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ProviderDashboard() {
  const fullName = useAuthStore((s) => s.fullName)
  const firstName = fullName?.split(' ')[0] ?? ''
  const [filter, setFilter] = useState<Filter>('upcoming')

  const { data } = useQuery({
    queryKey: ['providerBookings'],
    queryFn: () => bookingsApi.getMyBookings(1, 100),
  })

  const all = data?.items ?? []
  const now = new Date()

  const upcoming = all.filter(
    (b) => effectiveStatus(b) !== 'Completed' && effectiveStatus(b) !== 'Cancelled' &&
      (isToday(b.startUtc) || new Date(b.startUtc) > now)
  ).sort((a, b) => new Date(a.startUtc).getTime() - new Date(b.startUtc).getTime())

  const todayCount = all.filter((b) => isToday(b.startUtc) && effectiveStatus(b) !== 'Cancelled').length
  const pendingCount = all.filter((b) => effectiveStatus(b) === 'Pending').length
  const completedCount = all.filter((b) => effectiveStatus(b) === 'Completed').length

  const filtered = filter === 'upcoming' ? upcoming
    : filter === 'pending' ? all.filter((b) => effectiveStatus(b) === 'Pending')
    : filter === 'completed' ? all.filter((b) => effectiveStatus(b) === 'Completed')
    : all

  const stats = [
    { label: 'Bugünkü Ders', value: todayCount, Icon: Sun, highlight: todayCount > 0 },
    { label: 'Yaklaşan', value: upcoming.length, Icon: CalendarDays, highlight: false },
    { label: 'Bekleyen', value: pendingCount, Icon: Clock, highlight: pendingCount > 0 },
    { label: 'Tamamlanan', value: completedCount, Icon: CheckCircle, highlight: false },
  ]

  return (
    <div className="max-w-3xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {firstName ? `Hoş geldin, ${firstName} 👋` : 'Genel Bakış'}
        </h1>
        <p className="text-sm text-gray-500 mt-1">Yaklaşan dersleriniz ve öğrenci notları</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-gray-100 bg-white shadow-sm p-4 transition-all"
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
              style={{ background: s.highlight ? 'var(--color-primary)' : 'var(--color-primary-light, #ede9fe)' }}
            >
              <s.Icon
                size={18}
                style={{ color: s.highlight ? '#fff' : 'var(--color-primary)' }}
              />
            </div>
            <p className="text-3xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Bookings */}
      <div>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h2 className="font-semibold text-gray-800">Dersler</h2>
          <div className="flex gap-1.5 flex-wrap">
            {(Object.keys(FILTER_LABELS) as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                  filter === f
                    ? 'text-white shadow-sm'
                    : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
                style={filter === f ? { background: 'var(--color-primary)' } : {}}
              >
                {FILTER_LABELS[f]}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-14 text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--color-primary-light, #ede9fe)' }}>
              <CalendarDays size={24} style={{ color: 'var(--color-primary)' }} />
            </div>
            <p className="text-sm font-medium text-gray-600 mb-1">Ders bulunamadı</p>
            <p className="text-xs text-gray-400">Müsaitliğinizi güncelleyerek yeni rezervasyon alabilirsiniz.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((b: Booking) => (
              <BookingRow key={b.id} b={b} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
