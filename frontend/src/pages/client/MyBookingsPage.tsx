import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CalendarDays, Clock, Banknote, ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { bookingsApi } from '@/api/endpoints/bookings.api'
import { useAuthStore } from '@/store/auth.store'
import type { Booking, BookingStatus } from '@/types/booking.types'

const STATUS_CFG: Record<BookingStatus, { label: string; color: string; bg: string; bar: string }> = {
  Pending:   { label: 'Beklemede',  color: 'text-amber-700',   bg: 'bg-amber-100',   bar: 'bg-amber-400' },
  Confirmed: { label: 'Onaylandı', color: 'text-emerald-700', bg: 'bg-emerald-100', bar: 'bg-emerald-400' },
  Cancelled: { label: 'İptal',     color: 'text-red-600',     bg: 'bg-red-100',     bar: 'bg-red-400' },
  Completed: { label: 'Tamamlandı',color: 'text-blue-700',    bg: 'bg-blue-100',    bar: 'bg-blue-400' },
  NoShow:    { label: 'Gelmedi',   color: 'text-gray-500',    bg: 'bg-gray-100',    bar: 'bg-gray-300' },
}

type Filter = 'all' | 'upcoming' | 'completed' | 'cancelled'
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all',       label: 'Tümü' },
  { key: 'upcoming',  label: 'Yaklaşan' },
  { key: 'completed', label: 'Tamamlanan' },
  { key: 'cancelled', label: 'İptal' },
]

const DAYS  = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi']
const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']

function fmtFull(utc: string) {
  const d = new Date(utc)
  const pad = (n: number) => String(n).padStart(2, '0')
  return { day: `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`, time: `${pad(d.getHours())}:${pad(d.getMinutes())}` }
}

function BookingCard({ booking }: { booking: Booking }) {
  const qc = useQueryClient()
  const [confirming, setConfirming] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const cfg = STATUS_CFG[booking.status]
  const { day, time } = fmtFull(booking.startUtc)
  const canCancel = false // ileride acilacak
  const withinWindow = new Date(booking.startUtc) <= new Date(Date.now() + 24 * 60 * 60 * 1000)
  const initials = booking.providerName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()

  const cancelMutation = useMutation({
    mutationFn: () => bookingsApi.cancel(booking.id, cancelReason.trim() || undefined),
    onSuccess: () => { setConfirming(false); setCancelReason(''); qc.invalidateQueries({ queryKey: ['myBookings'] }) },
    onError: () => setConfirming(false),
  })

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
      <div className={`h-1 ${cfg.bar}`} />
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
            style={{ background: 'var(--color-primary)' }}
          >
            {initials}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div className="min-w-0">
                <p className="font-bold text-gray-900 leading-snug">{booking.serviceName}</p>
                <p className="text-sm text-gray-500 mt-0.5">{booking.providerName}</p>
              </div>
              <span className={`flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color}`}>
                {cfg.label}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <CalendarDays size={12} className="text-gray-300" />{day}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock size={12} className="text-gray-300" />{time}
              </span>
              <span className="flex items-center gap-1.5 font-semibold text-gray-700">
                <Banknote size={12} className="text-gray-300" />₺{Number(booking.price).toLocaleString('tr-TR')}
              </span>
            </div>

            {booking.clientNotes && (
              <p className="mt-3 text-xs text-gray-400 italic bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
                "{booking.clientNotes}"
              </p>
            )}

            {(booking.zoomLink || booking.zoomMeetingId) && (booking.status === 'Confirmed' || booking.status === 'Pending') && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-xl space-y-1">
                <p className="text-xs font-semibold text-blue-700">Zoom Bağlantısı</p>
                {booking.zoomLink && (
                  <a href={booking.zoomLink} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1 text-xs text-blue-600 hover:underline font-medium">
                    <ArrowUpRight size={11} />Derse Katıl
                  </a>
                )}
                {booking.zoomMeetingId && (
                  <p className="text-xs text-blue-600">Meeting ID: <span className="font-mono">{booking.zoomMeetingId}</span></p>
                )}
                {booking.zoomPassword && (
                  <p className="text-xs text-blue-600">Şifre: <span className="font-mono">{booking.zoomPassword}</span></p>
                )}
              </div>
            )}

            {canCancel && (
              <div className="mt-3">
                {confirming ? (
                  <div className="space-y-2">
                    <textarea
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      placeholder="İptal nedeninizi yazabilirsiniz (isteğe bağlı)"
                      rows={2}
                      className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:border-transparent placeholder-gray-400"
                      style={{ '--tw-ring-color': 'var(--color-primary)' } as any}
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => cancelMutation.mutate()}
                        disabled={cancelMutation.isPending}
                        className="text-xs font-semibold text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg disabled:opacity-50 transition-colors"
                      >
                        {cancelMutation.isPending ? '…' : 'İptal Et'}
                      </button>
                      <button
                        onClick={() => { setConfirming(false); setCancelReason('') }}
                        className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg border border-gray-200 transition-colors"
                      >
                        Vazgeç
                      </button>
                    </div>
                  </div>
                ) : withinWindow ? (
                  <p className="text-xs text-gray-400 italic">
                    Derse 24 saatten az kaldığı için iptal yapılamaz.
                  </p>
                ) : (
                  <button
                    onClick={() => setConfirming(true)}
                    className="text-xs text-red-400 hover:text-red-600 font-medium px-3 py-1.5 rounded-lg border border-red-100 hover:border-red-200 hover:bg-red-50 transition-all"
                  >
                    Dersi İptal Et
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

export default function MyBookingsPage() {
  const [filter, setFilter] = useState<Filter>('all')
  const { fullName } = useAuthStore()
  const initials = fullName?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() ?? '?'

  const { data, isLoading } = useQuery({
    queryKey: ['myBookings'],
    queryFn: () => bookingsApi.getMyBookings(1, 100),
  })

  const now = new Date()
  const all = data?.items ?? []

  const filtered = all.filter((b) => {
    if (filter === 'upcoming')  return (b.status === 'Confirmed' || b.status === 'Pending') && new Date(b.startUtc) > now
    if (filter === 'completed') return b.status === 'Completed'
    if (filter === 'cancelled') return b.status === 'Cancelled' || b.status === 'NoShow'
    return true
  }).sort((a, b) => {
    if (filter === 'upcoming') return new Date(a.startUtc).getTime() - new Date(b.startUtc).getTime()
    return new Date(b.startUtc).getTime() - new Date(a.startUtc).getTime()
  })

  const counts: Record<Filter, number> = {
    all: all.length,
    upcoming: all.filter((b) => (b.status === 'Confirmed' || b.status === 'Pending') && new Date(b.startUtc) > now).length,
    completed: all.filter((b) => b.status === 'Completed').length,
    cancelled: all.filter((b) => b.status === 'Cancelled' || b.status === 'NoShow').length,
  }

  return (
    <div className="space-y-5">
      {/* Profile + stats header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-base font-extrabold text-white flex-shrink-0"
          style={{ background: 'var(--color-primary)' }}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 truncate">{fullName}</p>
          <div className="flex gap-4 mt-1">
            {[
              { label: 'Toplam', value: all.length },
              { label: 'Yaklaşan', value: counts.upcoming },
              { label: 'Tamamlanan', value: counts.completed },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <p className="text-sm font-bold text-gray-900">{isLoading ? '—' : value}</p>
                <p className="text-[10px] text-gray-400">{label}</p>
              </div>
            ))}
          </div>
        </div>
        <Link
          to="/providers"
          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
          style={{ background: 'var(--color-primary)' }}
        >
          <ArrowUpRight size={13} /> Ders Al
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 p-1 bg-white rounded-2xl border border-gray-100 shadow-sm w-fit">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
              filter === key ? 'text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
            style={filter === key ? { background: 'var(--color-primary)' } : {}}
          >
            {label}
            {counts[key] > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                filter === key ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-500'
              }`}>
                {counts[key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-32 bg-white rounded-2xl border border-gray-100 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 text-center">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: 'var(--color-primary-light)' }}>
            <CalendarDays size={20} style={{ color: 'var(--color-primary)' }} />
          </div>
          <p className="text-sm font-semibold text-gray-700 mb-1">
            {filter === 'all' ? 'Henüz rezervasyonunuz yok' : 'Bu filtrede ders yok'}
          </p>
          <p className="text-xs text-gray-400 mb-5">
            {filter === 'all' ? 'Bir öğretmen seçerek ilk dersinizi planlayın.' : 'Farklı bir filtre deneyin.'}
          </p>
          {filter === 'all' && (
            <Link
              to="/providers"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'var(--color-primary)' }}
            >
              <ArrowUpRight size={14} /> Ders Al
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((b) => <BookingCard key={b.id} booking={b} />)}
        </div>
      )}
    </div>
  )
}
