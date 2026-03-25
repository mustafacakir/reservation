import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CalendarDays, Clock, Banknote } from 'lucide-react'
import { bookingsApi } from '@/api/endpoints/bookings.api'
import type { Booking, BookingStatus } from '@/types/booking.types'

const statusLabel: Record<BookingStatus, string> = {
  Pending: 'Beklemede',
  Confirmed: 'Onaylandı',
  Cancelled: 'İptal Edildi',
  Completed: 'Tamamlandı',
  NoShow: 'Gelmedi',
}

const statusStyle: Record<BookingStatus, string> = {
  Pending: 'bg-amber-50 text-amber-700 border-amber-200',
  Confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Cancelled: 'bg-red-50 text-red-600 border-red-200',
  Completed: 'bg-blue-50 text-blue-700 border-blue-200',
  NoShow: 'bg-gray-100 text-gray-500 border-gray-200',
}

const statusDot: Record<BookingStatus, string> = {
  Pending: 'bg-amber-400',
  Confirmed: 'bg-emerald-400',
  Cancelled: 'bg-red-400',
  Completed: 'bg-blue-400',
  NoShow: 'bg-gray-400',
}

const WEEKDAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi']
const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']

function formatDate(utc: string) {
  const d = new Date(utc)
  const pad = (n: number) => String(n).padStart(2, '0')
  return {
    day: `${WEEKDAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  }
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div
      className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
      style={{ background: 'var(--color-primary)' }}
    >
      {initials}
    </div>
  )
}

function BookingCard({ booking }: { booking: Booking }) {
  const qc = useQueryClient()
  const cancelMutation = useMutation({
    mutationFn: () => bookingsApi.cancel(booking.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['myBookings'] }),
  })

  const { day, time } = formatDate(booking.startUtc)
  const canCancel = booking.status === 'Pending' || booking.status === 'Confirmed'

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      {/* Top color bar based on status */}
      <div className={`h-1 ${booking.status === 'Confirmed' ? 'bg-emerald-400' : booking.status === 'Cancelled' ? 'bg-red-400' : booking.status === 'Completed' ? 'bg-blue-400' : 'bg-amber-400'}`} />

      <div className="p-5">
        <div className="flex items-start gap-4">
          <Avatar name={booking.providerName} />

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-gray-900 text-base leading-tight">{booking.serviceName}</p>
                <p className="text-sm text-gray-500 mt-0.5">{booking.providerName}</p>
              </div>
              <span className={`flex-shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${statusStyle[booking.status]}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${statusDot[booking.status]}`} />
                {statusLabel[booking.status]}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <CalendarDays size={13} className="text-gray-400" />
                <span>{day}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Clock size={13} className="text-gray-400" />
                <span>{time}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Banknote size={13} className="text-gray-400" />
                <span className="font-semibold text-gray-800">₺{Number(booking.price).toLocaleString('tr-TR')}</span>
              </span>
            </div>

            {booking.clientNotes && (
              <div className="mt-3 px-3 py-2 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-xs text-gray-400 mb-0.5 font-medium">Notunuz</p>
                <p className="text-sm text-gray-600 italic">"{booking.clientNotes}"</p>
              </div>
            )}

            {canCancel && (
              <div className="mt-3">
                <button
                  onClick={() => cancelMutation.mutate()}
                  disabled={cancelMutation.isPending}
                  className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50 font-medium border border-red-200 hover:border-red-300 px-3 py-1.5 rounded-lg transition-colors"
                >
                  {cancelMutation.isPending ? 'İptal ediliyor…' : 'İptal Et'}
                </button>
                {cancelMutation.isError && (
                  <span className="text-xs text-red-500 ml-2">İptal başarısız.</span>
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
  const { data, isLoading } = useQuery({
    queryKey: ['myBookings'],
    queryFn: () => bookingsApi.getMyBookings(),
  })

  const bookings = data?.items ?? []

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Rezervasyonlarım</h1>
        <p className="text-sm text-gray-500 mt-1">
          {bookings.length > 0 ? `${bookings.length} rezervasyon` : 'Geçmiş ve gelecek dersleriniz'}
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-36 bg-white rounded-2xl border border-gray-100 animate-pulse" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-20 text-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'var(--color-primary-light, #ede9fe)' }}
          >
            <CalendarDays size={28} style={{ color: 'var(--color-primary)' }} />
          </div>
          <p className="font-semibold text-gray-700 mb-1">Henüz rezervasyonunuz yok</p>
          <p className="text-sm text-gray-400 mb-6">Bir öğretmen seçerek ilk dersinizi planlayın.</p>
          <a
            href="/providers"
            className="inline-block px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: 'var(--color-primary)' }}
          >
            Öğretmenleri Keşfet
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => <BookingCard key={b.id} booking={b} />)}
        </div>
      )}
    </div>
  )
}
