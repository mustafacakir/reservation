import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  CalendarDays, Clock, ChevronRight, CheckCircle, ArrowUpRight, User, Save, Mail,
} from 'lucide-react'
import { bookingsApi } from '@/api/endpoints/bookings.api'
import { apiClient } from '@/api/client'
import { useAuthStore } from '@/store/auth.store'
import { useTenantStore } from '@/store/tenant.store'
import { getSectorConfig } from '@/config/sectors'
import { useToast } from '@/components/ui/Toast'
import type { Booking, BookingStatus } from '@/types/booking.types'

const STATUS_CFG: Record<BookingStatus, { label: string; color: string; bg: string }> = {
  Pending:   { label: 'Beklemede',   color: 'text-amber-700',   bg: 'bg-amber-100' },
  Confirmed: { label: 'Onaylandı',  color: 'text-emerald-700', bg: 'bg-emerald-100' },
  Cancelled: { label: 'İptal',      color: 'text-red-600',     bg: 'bg-red-100' },
  Completed: { label: 'Tamamlandı', color: 'text-blue-700',    bg: 'bg-blue-100' },
  NoShow:    { label: 'Gelmedi',    color: 'text-gray-500',    bg: 'bg-gray-100' },
}

const DAYS   = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt']
const MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']

function fmtDate(utc: string) {
  const d = new Date(utc)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]} · ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function daysUntil(utc: string) {
  const diff = new Date(utc).getTime() - Date.now()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Bugün'
  if (days === 1) return 'Yarın'
  return `${days} gün sonra`
}

function UpcomingCard({ b }: { b: Booking }) {
  const d = new Date(b.startUtc)
  const pad = (n: number) => String(n).padStart(2, '0')
  const until = daysUntil(b.startUtc)
  const isToday = until === 'Bugün'

  return (
    <div
      className="rounded-2xl p-4 flex items-start gap-4"
      style={{ background: isToday ? 'var(--color-primary)' : 'var(--color-primary-light)' }}
    >
      <div className="text-center flex-shrink-0">
        <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: isToday ? 'rgba(255,255,255,0.7)' : 'var(--color-primary)' }}>
          {MONTHS[d.getMonth()]}
        </p>
        <p className="text-2xl font-extrabold leading-none" style={{ color: isToday ? '#fff' : 'var(--color-primary)' }}>
          {d.getDate()}
        </p>
        <p className="text-[10px] font-semibold mt-0.5" style={{ color: isToday ? 'rgba(255,255,255,0.7)' : 'var(--color-primary)' }}>
          {DAYS[d.getDay()]}
        </p>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold truncate" style={{ color: isToday ? '#fff' : 'var(--color-primary)' }}>
          {b.serviceName}
        </p>
        <p className="text-xs mt-0.5 truncate" style={{ color: isToday ? 'rgba(255,255,255,0.75)' : 'var(--color-primary-dark, var(--color-primary))' }}>
          {b.providerName}
        </p>
        <div className="flex items-center gap-3 mt-2">
          <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: isToday ? 'rgba(255,255,255,0.9)' : 'var(--color-primary)' }}>
            <Clock size={10} /> {pad(d.getHours())}:{pad(d.getMinutes())}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={isToday ? { background: 'rgba(255,255,255,0.2)', color: '#fff' } : { background: 'var(--color-primary)', color: '#fff' }}>
            {until}
          </span>
        </div>
      </div>
    </div>
  )
}

function BookingRow({ b }: { b: Booking }) {
  const cfg = STATUS_CFG[b.status]
  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: 'var(--color-primary)' }}>
        {b.providerName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">{b.serviceName}</p>
        <p className="text-xs text-gray-400 mt-0.5">{fmtDate(b.startUtc)}</p>
      </div>
      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${cfg.bg} ${cfg.color}`}>
        {cfg.label}
      </span>
    </div>
  )
}

// ── Profile edit form ──────────────────────────────────────────────────────────

function ProfileEditCard() {
  const { fullName, setFullName } = useAuthStore()
  const toast = useToast()

  const [firstName, setFirstName] = useState(() => {
    if (!fullName) return ''
    const idx = fullName.indexOf(' ')
    return idx === -1 ? fullName : fullName.slice(0, idx)
  })
  const [lastName, setLastName] = useState(() => {
    if (!fullName) return ''
    const idx = fullName.indexOf(' ')
    return idx === -1 ? '' : fullName.slice(idx + 1)
  })
  const [isEmailSubscribed, setIsEmailSubscribed] = useState(false)
  const [loadedSub, setLoadedSub] = useState(false)

  // Fetch current subscription status
  useQuery({
    queryKey: ['authMe'],
    queryFn: () => apiClient.get('/auth/me').then((r) => r.data as { isEmailSubscribed: boolean }),
    enabled: !loadedSub,
    onSuccess: (d: { isEmailSubscribed: boolean }) => {
      setIsEmailSubscribed(d.isEmailSubscribed)
      setLoadedSub(true)
    },
  } as any)

  const mutation = useMutation({
    mutationFn: () =>
      apiClient.put('/auth/me', { firstName: firstName.trim(), lastName: lastName.trim(), isEmailSubscribed }),
    onSuccess: (res) => {
      setFullName(res.data.fullName)
      toast.success('Bilgiler güncellendi', res.data.fullName)
    },
    onError: () => {
      toast.error('Güncelleme başarısız', 'Lütfen tekrar deneyin.')
    },
  })

  const canSave = firstName.trim().length > 0

  const inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent bg-white'
  const ringStyle = { '--tw-ring-color': 'var(--color-primary)' } as React.CSSProperties

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--color-primary-light)' }}>
          <User size={14} style={{ color: 'var(--color-primary)' }} />
        </div>
        <h2 className="text-sm font-semibold text-gray-800">Bilgileri Güncelle</h2>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Ad *</label>
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Ali"
              className={inputCls}
              style={ringStyle}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Soyad</label>
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Yılmaz"
              className={inputCls}
              style={ringStyle}
            />
          </div>
        </div>

        {/* E-posta aboneliği toggle */}
        <label className="flex items-start gap-3 cursor-pointer select-none">
          <div
            onClick={() => setIsEmailSubscribed((v) => !v)}
            className="flex-shrink-0 mt-0.5 w-9 h-5 rounded-full transition-colors relative cursor-pointer"
            style={isEmailSubscribed ? { background: 'var(--color-primary)' } : { background: '#d1d5db' }}
          >
            <span
              className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform"
              style={{ transform: isEmailSubscribed ? 'translateX(16px)' : 'translateX(2px)' }}
            />
          </div>
          <span className="text-xs text-gray-600 leading-relaxed">
            <span className="flex items-center gap-1 font-semibold mb-0.5"><Mail size={11} /> Bilgilendirme e-postaları</span>
            Kampanya, duyuru ve bilgilendirici e-postalar almak istiyorum.
          </span>
        </label>

        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || !canSave}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40 transition-opacity hover:opacity-90"
          style={{ background: 'var(--color-primary)' }}
        >
          <Save size={14} />
          {mutation.isPending ? 'Kaydediliyor…' : 'Kaydet'}
        </button>
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function ClientProfilePage() {
  const { fullName } = useAuthStore()
  const { sector } = useTenantStore()
  const sectorCfg = getSectorConfig(sector)
  const initials = fullName?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() ?? '?'

  const { data, isLoading } = useQuery({
    queryKey: ['myBookings', 1, 50],
    queryFn: () => bookingsApi.getMyBookings(1, 50),
  })

  const now = new Date()
  const all = data?.items ?? []
  const upcoming = all
    .filter((b) => new Date(b.startUtc) > now && (b.status === 'Confirmed' || b.status === 'Pending'))
    .sort((a, b) => new Date(a.startUtc).getTime() - new Date(b.startUtc).getTime())
  const past = all
    .filter((b) => b.status === 'Completed' || b.status === 'Cancelled' || b.status === 'NoShow')
    .sort((a, b) => new Date(b.startUtc).getTime() - new Date(a.startUtc).getTime())
    .slice(0, 5)
  const completed = all.filter((b) => b.status === 'Completed').length

  return (
    <div className="space-y-5">

      {/* Hero */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="h-20 w-full" style={{ background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark, var(--color-primary)) 100%)', opacity: 0.9 }} />
        <div className="px-6 pb-5">
          <div className="-mt-8 flex items-end justify-between gap-3 mb-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-extrabold text-white border-4 border-white shadow-md flex-shrink-0"
              style={{ background: 'var(--color-primary)' }}
            >
              {initials}
            </div>
            <Link
              to="/providers"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white shadow-sm mb-0.5 transition-opacity hover:opacity-90"
              style={{ background: 'var(--color-primary)' }}
            >
              <ArrowUpRight size={13} /> Ders Al
            </Link>
          </div>
          <h1 className="text-lg font-bold text-gray-900">{fullName}</h1>
          <p className="text-sm text-gray-400">{sectorCfg.clientLabel}</p>

          <div className="grid grid-cols-3 gap-3 mt-4">
            {[
              { label: 'Toplam Ders', value: all.length },
              { label: 'Yaklaşan',    value: upcoming.length },
              { label: 'Tamamlanan',  value: completed },
            ].map(({ label, value }) => (
              <div key={label} className="text-center p-3 rounded-xl bg-gray-50">
                <p className="text-xl font-extrabold text-gray-900">{isLoading ? '—' : value}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Profile edit */}
      <ProfileEditCard />

      {/* Upcoming */}
      {isLoading ? (
        <div className="h-28 bg-white rounded-2xl border border-gray-100 animate-pulse" />
      ) : upcoming.length > 0 ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold text-gray-700">Yaklaşan Dersler</h2>
            <Link to="/client/bookings" className="flex items-center gap-0.5 text-xs font-semibold" style={{ color: 'var(--color-primary)' }}>
              Tümü <ChevronRight size={13} />
            </Link>
          </div>
          <div className="space-y-2">
            {upcoming.slice(0, 3).map((b) => <UpcomingCard key={b.id} b={b} />)}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: 'var(--color-primary-light)' }}>
            <CalendarDays size={20} style={{ color: 'var(--color-primary)' }} />
          </div>
          <p className="text-sm font-semibold text-gray-700 mb-1">Yaklaşan ders yok</p>
          <p className="text-xs text-gray-400 mb-4">Hemen bir öğretmen bularak ders planla</p>
          <Link
            to="/providers"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'var(--color-primary)' }}
          >
            <ArrowUpRight size={14} /> Ders Al
          </Link>
        </div>
      )}

      {/* Past */}
      {past.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <CheckCircle size={15} className="text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-800">Geçmiş Dersler</h2>
            </div>
            <Link to="/client/bookings" className="flex items-center gap-0.5 text-xs font-semibold" style={{ color: 'var(--color-primary)' }}>
              Tümü <ChevronRight size={13} />
            </Link>
          </div>
          <div className="px-5">
            {past.map((b) => <BookingRow key={b.id} b={b} />)}
          </div>
        </div>
      )}
    </div>
  )
}
