import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import { CalendarDays, Clock, CheckCircle, XCircle, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import type { PagedResult } from '@/types/common.types'
import type { Booking, BookingStatus } from '@/types/booking.types'

const STATUS_FILTERS: { key: string; label: string }[] = [
  { key: '',           label: 'Tümü' },
  { key: 'Pending',    label: 'Beklemede' },
  { key: 'Confirmed',  label: 'Onaylı' },
  { key: 'Completed',  label: 'Tamamlandı' },
  { key: 'Cancelled',  label: 'İptal' },
]

const STATUS_CONFIG: Record<BookingStatus, { label: string; color: string; bg: string; Icon: typeof Clock }> = {
  Pending:   { label: 'Beklemede',  color: 'text-amber-700',  bg: 'bg-amber-100',  Icon: Clock },
  Confirmed: { label: 'Onaylandı', color: 'text-blue-700',   bg: 'bg-blue-100',   Icon: CheckCircle },
  Completed: { label: 'Tamamlandı', color: 'text-green-700', bg: 'bg-green-100',  Icon: CheckCircle },
  Cancelled: { label: 'İptal',      color: 'text-red-700',   bg: 'bg-red-100',    Icon: XCircle },
  NoShow:    { label: 'Gelmedi',    color: 'text-gray-600',  bg: 'bg-gray-100',   Icon: AlertCircle },
}

function StatusBadge({ status }: { status: BookingStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.Pending
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
      <cfg.Icon size={11} />
      {cfg.label}
    </span>
  )
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function AdminBookingsPage() {
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery<PagedResult<Booking>>({
    queryKey: ['adminBookings', statusFilter, page],
    queryFn: () =>
      apiClient.get('/admin/bookings', { params: { page, pageSize: 20 } }).then((r) => r.data),
  })

  const filtered = statusFilter
    ? data?.items.filter((b) => b.status === statusFilter)
    : data?.items

  function handleStatusChange(key: string) {
    setStatusFilter(key)
    setPage(1)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Rezervasyonlar</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {data ? `${data.totalCount} rezervasyon` : 'Yükleniyor...'}
        </p>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit flex-wrap">
        {STATUS_FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => handleStatusChange(key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              statusFilter === key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-gray-50">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="px-5 py-3.5 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gray-100 animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 bg-gray-100 rounded animate-pulse w-40" />
                  <div className="h-3 bg-gray-100 rounded animate-pulse w-56" />
                </div>
              </div>
            ))}
          </div>
        ) : !filtered?.length ? (
          <div className="py-16 flex flex-col items-center gap-2 text-gray-400">
            <CalendarDays size={32} className="text-gray-200" />
            <p className="text-sm">Rezervasyon bulunamadı.</p>
          </div>
        ) : (
          <>
            <div className="hidden md:grid grid-cols-[2fr_2fr_1fr_1.5fr_1fr] px-5 py-2.5 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wide">
              <span>Öğrenci</span>
              <span>Ders / Öğretmen</span>
              <span>Fiyat</span>
              <span>Tarih</span>
              <span>Durum</span>
            </div>
            <div className="divide-y divide-gray-50">
              {filtered.map((b) => (
                <div
                  key={b.id}
                  className="px-5 py-3 grid grid-cols-1 md:grid-cols-[2fr_2fr_1fr_1.5fr_1fr] gap-y-1 items-center hover:bg-gray-50/60 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <CalendarDays size={14} className="text-gray-400" />
                    </div>
                    <span className="text-sm font-medium text-gray-900 truncate">{b.clientName ?? '—'}</span>
                  </div>
                  <div className="md:pl-0 pl-12">
                    <p className="text-sm text-gray-700 truncate">{b.serviceName}</p>
                    <p className="text-xs text-gray-400 truncate">{b.providerName}</p>
                  </div>
                  <span className="text-sm font-semibold text-gray-800 md:block hidden">
                    ₺{b.price}
                  </span>
                  <span className="text-xs text-gray-500 md:block hidden">{fmtDate(b.startUtc)}</span>
                  <StatusBadge status={b.status as BookingStatus} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Sayfa {data.page} / {data.totalPages}</span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
              disabled={page === data.totalPages}
              className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
