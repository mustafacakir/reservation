import { useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useQuery, useQueries } from '@tanstack/react-query'
import { Clock, Star, ChevronLeft, CalendarDays, ArrowRight, UserCheck } from 'lucide-react'
import { providersApi } from '@/api/endpoints/providers.api'
import { useAuthStore } from '@/store/auth.store'
import { useTenantStore } from '@/store/tenant.store'

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

const WEEKDAYS = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt']
const MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']

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

  return (
    <div>
      {/* Date strip */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 mb-4 -mx-1 px-1">
        {days.map((d) => {
          const dateStr = formatDateParam(d)
          const active = dateStr === activeDateStr
          const hasSlots = availabilityMap[dateStr]
          const loadingDay = availabilityMap[dateStr] === undefined
          const disabled = !loadingDay && hasSlots === false

          return (
            <button
              key={dateStr}
              disabled={disabled}
              onClick={() => { setActiveDay(d); onSelect('', '') }}
              className={[
                'flex-shrink-0 flex flex-col items-center w-12 py-2 rounded-xl text-xs font-medium transition-all',
                active ? 'text-white shadow-sm' : disabled
                  ? 'text-gray-300 bg-gray-50 cursor-not-allowed opacity-50'
                  : 'text-gray-600 bg-gray-50 hover:bg-gray-100',
              ].join(' ')}
              style={active ? { background: 'var(--color-primary)' } : {}}
            >
              <span className="text-[9px] uppercase tracking-wider opacity-75">{WEEKDAYS[d.getDay()]}</span>
              <span className="text-base font-bold leading-tight mt-0.5">{d.getDate()}</span>
              <span className="text-[9px] opacity-60">{MONTHS[d.getMonth()]}</span>
              {!disabled && !active && !loadingDay && (
                <span className="w-1 h-1 rounded-full mt-1" style={{ background: 'var(--color-primary)' }} />
              )}
            </button>
          )
        })}
      </div>

      {/* Time slots */}
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
            return (
              <button
                key={slot.startUtc}
                onClick={() => onSelect(slot.startUtc, label)}
                className={[
                  'py-2.5 rounded-xl text-xs font-semibold border transition-all',
                  selected ? 'text-white border-transparent shadow-sm' : 'text-gray-700 border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50',
                ].join(' ')}
                style={selected ? { background: 'var(--color-primary)' } : {}}
              >
                {slot.startLocal}
              </button>
            )
          })}
        </div>
      )}

      <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
        <Clock size={11} /> Her ders {durationMinutes} dakika
      </p>
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

  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null)
  const [selectedSlotStart, setSelectedSlotStart] = useState<string | null>(null)
  const [selectedSlotLabel, setSelectedSlotLabel] = useState<string | null>(null)

  const { data: provider, isLoading } = useQuery({
    queryKey: ['provider', id, slug],
    queryFn: () => providersApi.getById(id!),
    enabled: !!id && !!slug,
  })

  const selectedService = provider?.services.find(s => s.id === selectedServiceId)

  const handleBook = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } })
      return
    }
    if (!selectedServiceId || !selectedSlotStart) return
    navigate(`/client/book/${provider!.id}/${selectedServiceId}`, {
      state: { slotStart: selectedSlotStart, slotLabel: selectedSlotLabel },
    })
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

  return (
    <div>
      {/* ── Hero Banner ── */}
      <div className="relative h-44 sm:h-52" style={{ background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark, #3730a3) 100%)' }}>
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-5 left-4 sm:left-6 flex items-center gap-1.5 text-white/80 hover:text-white text-sm font-medium transition-colors"
        >
          <ChevronLeft size={18} />
          Geri
        </button>

        {/* Decorative circles */}
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
                  {provider.totalReviews > 0 ? (
                    <div className="flex items-center gap-1.5 mt-1">
                      <Star size={14} className="text-amber-400 fill-amber-400" />
                      <span className="text-sm font-semibold text-gray-800">{provider.averageRating.toFixed(1)}</span>
                      <span className="text-sm text-gray-400">({provider.totalReviews} değerlendirme)</span>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 mt-1">Henüz değerlendirme yok</p>
                  )}
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

            {/* Mobile booking CTA */}
            <div className="lg:hidden mt-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <BookingPanel
                provider={provider}
                selectedServiceId={selectedServiceId}
                setSelectedServiceId={setSelectedServiceId}
                selectedSlotStart={selectedSlotStart}
                selectedSlotLabel={selectedSlotLabel}
                setSelectedSlotStart={setSelectedSlotStart}
                setSelectedSlotLabel={setSelectedSlotLabel}
                selectedService={selectedService}
                isAuthenticated={isAuthenticated}
                handleBook={handleBook}
              />
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
              <BookingPanel
                provider={provider}
                selectedServiceId={selectedServiceId}
                setSelectedServiceId={setSelectedServiceId}
                selectedSlotStart={selectedSlotStart}
                selectedSlotLabel={selectedSlotLabel}
                setSelectedSlotStart={setSelectedSlotStart}
                setSelectedSlotLabel={setSelectedSlotLabel}
                selectedService={selectedService}
                isAuthenticated={isAuthenticated}
                handleBook={handleBook}
              />
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
  selectedService, isAuthenticated, handleBook,
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
  handleBook: () => void
}) {
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
                    <p className="text-sm font-semibold" style={active ? { color: 'var(--color-primary)' } : { color: '#111827' }}>
                      {service.name}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                      <Clock size={11} /> {service.durationMinutes} dk
                    </p>
                  </div>
                  <span className="text-sm font-bold text-gray-900 flex-shrink-0">
                    ₺{Number(service.price).toLocaleString('tr-TR')}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Slot picker */}
      {selectedService && (
        <div className="border-t border-gray-100 pt-4">
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
        </div>
      )}

      {/* Book button */}
      <div className={selectedService ? '' : 'pt-2'}>
        {selectedSlotLabel && (
          <div className="mb-3 px-3 py-2.5 rounded-xl text-xs text-center font-medium bg-gray-50 border border-gray-100 text-gray-700">
            {selectedSlotLabel}
          </div>
        )}
        <button
          disabled={!selectedServiceId || !selectedSlotStart}
          onClick={handleBook}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-white transition-opacity disabled:opacity-40 hover:opacity-90 text-sm"
          style={{ background: 'var(--color-primary)' }}
        >
          {!isAuthenticated
            ? <><UserCheck size={16} /> Giriş yaparak rezervasyon yap</>
            : !selectedServiceId
            ? 'Ders seçin'
            : !selectedSlotStart
            ? 'Saat seçin'
            : <><ArrowRight size={16} /> Rezervasyon Yap</>
          }
        </button>
      </div>
    </div>
  )
}
