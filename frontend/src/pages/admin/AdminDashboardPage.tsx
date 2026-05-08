import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import { Users, CalendarDays, TrendingUp, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import type { PagedResult } from '@/types/common.types'
import type { Booking } from '@/types/booking.types'

interface AdminStats {
  totalUsers: number
  totalProviders: number
  totalClients: number
  totalBookings: number
  pendingBookings: number
  confirmedBookings: number
  completedBookings: number
  cancelledBookings: number
  totalRevenue: number
}

function useAdminStats() {
  return useQuery<AdminStats>({
    queryKey: ['adminStats'],
    queryFn: () => apiClient.get('/admin/stats').then((r) => r.data),
  })
}

function useAdminBookings() {
  return useQuery<PagedResult<Booking>>({
    queryKey: ['adminBookings'],
    queryFn: () => apiClient.get('/admin/bookings', { params: { page: 1, pageSize: 10 } }).then((r) => r.data),
  })
}

const STATUS_CONFIG = {
  Pending:   { label: 'Beklemede',   color: 'bg-amber-100 text-amber-700',   Icon: Clock },
  Confirmed: { label: 'Onaylandı',   color: 'bg-blue-100 text-blue-700',     Icon: CheckCircle },
  Completed: { label: 'Tamamlandı',  color: 'bg-green-100 text-green-700',   Icon: CheckCircle },
  Cancelled: { label: 'İptal',       color: 'bg-red-100 text-red-700',       Icon: XCircle },
  NoShow:    { label: 'Gelmedi',     color: 'bg-gray-100 text-gray-600',     Icon: AlertCircle },
} as const

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.Pending
  const { Icon, label, color } = cfg
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${color}`}>
      <Icon size={11} />
      {label}
    </span>
  )
}

function fmt(date: string) {
  return new Date(date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function AdminDashboardPage() {
  const { data: stats, isLoading: statsLoading } = useAdminStats()
  const { data: bookings } = useAdminBookings()

  const statCards = [
    {
      label: 'Toplam Kullanıcı',
      value: stats?.totalUsers,
      sub: `${stats?.totalProviders ?? '—'} öğretmen · ${stats?.totalClients ?? '—'} öğrenci`,
      Icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Toplam Rezervasyon',
      value: stats?.totalBookings,
      sub: `${stats?.pendingBookings ?? '—'} beklemede`,
      Icon: CalendarDays,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
    },
    {
      label: 'Tamamlanan',
      value: stats?.completedBookings,
      sub: `${stats?.cancelledBookings ?? '—'} iptal`,
      Icon: CheckCircle,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: 'Toplam Gelir',
      value: stats ? `₺${stats.totalRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 0 })}` : undefined,
      sub: 'Tamamlanan derslerden',
      Icon: TrendingUp,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Genel Bakış</h1>
        <p className="text-sm text-gray-500 mt-0.5">Platform istatistikleri ve son aktiviteler</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, sub, Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>
              <Icon size={17} className={color} />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {statsLoading ? <span className="inline-block w-12 h-6 bg-gray-100 rounded animate-pulse" /> : (value ?? '—')}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            {sub && <p className="text-[11px] text-gray-400 mt-1">{sub}</p>}
          </div>
        ))}
      </div>

      {/* Booking status breakdown */}
      {stats && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Rezervasyon Dağılımı</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Beklemede',  count: stats.pendingBookings,   color: 'bg-amber-500' },
              { label: 'Onaylandı', count: stats.confirmedBookings,  color: 'bg-blue-500' },
              { label: 'Tamamlandı', count: stats.completedBookings, color: 'bg-green-500' },
              { label: 'İptal',      count: stats.cancelledBookings, color: 'bg-red-500' },
            ].map(({ label, count, color }) => {
              const pct = stats.totalBookings > 0 ? Math.round((count / stats.totalBookings) * 100) : 0
              return (
                <div key={label} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">{label}</span>
                    <span className="font-semibold text-gray-900">{count}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-[10px] text-gray-400">%{pct}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Recent bookings */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">Son Rezervasyonlar</h2>
          <a href="/admin/bookings" className="text-xs text-blue-600 hover:underline">Tümünü gör</a>
        </div>

        {!bookings?.items.length ? (
          <div className="px-5 py-10 text-center text-sm text-gray-400">Henüz rezervasyon yok.</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {bookings.items.map((b) => (
              <div key={b.id} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50/60 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <CalendarDays size={14} className="text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{b.clientName ?? 'Müşteri'}</p>
                  <p className="text-xs text-gray-400 truncate">{b.serviceName} · {b.providerName}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <p className="text-xs text-gray-500 hidden sm:block">{fmt(b.startUtc)}</p>
                  <StatusBadge status={b.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
