import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { CalendarDays, ChevronLeft, ChevronRight, CalendarPlus, Pencil } from 'lucide-react'
import { bookingsApi } from '@/api/endpoints/bookings.api'
import { apiClient } from '@/api/client'
import { useAuthStore } from '@/store/auth.store'
import type { Booking } from '@/types/booking.types'
import type { WeeklySlot } from '@/types/availability.types'
import type { ServiceItem } from '@/types/provider.types'

interface TimeRange { startTime: string; endTime: string }
interface DateSlot { date: string; ranges: TimeRange[] }

const MONTHS_FULL = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']
const DAY_FULL = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi']

function effectiveStatus(b: Booking): Booking['status'] {
  if ((b.status === 'Confirmed' || b.status === 'Pending') && new Date(b.endUtc) < new Date()) return 'Completed'
  return b.status
}

// ── Weekly Schedule ────────────────────────────────────────────────────────────

function toIsoDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Groups multi-day lesson series (same seriesId) together so they share one color/legend entry. */
function groupByProgram(services: ServiceItem[]): ServiceItem[][] {
  const order: string[] = []
  const map = new Map<string, ServiceItem[]>()
  for (const s of services) {
    const key = (s as any).seriesId ?? s.id
    if (!map.has(key)) { map.set(key, []); order.push(key) }
    map.get(key)!.push(s)
  }
  return order.map((key) => map.get(key)!)
}

function WeeklySchedule({ slots, services, isLoading, bookings }: {
  slots: WeeklySlot[]
  services: ServiceItem[]
  isLoading: boolean
  bookings: Booking[]
}) {
  const [weekOffset, setWeekOffset] = useState(0)
  const today = new Date()
  const todayJsDow = today.getDay()

  const jsDowToCol = (dow: number) => (dow + 6) % 7
  const DAY_SHORT_MF = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']
  const HOUR_PX = 60
  const PALETTES = [
    { bg: 'var(--color-primary-light)', fg: 'var(--color-primary)', bd: 'var(--color-primary)' },
    { bg: '#fef3c7', fg: '#b45309', bd: '#f59e0b' },
    { bg: '#dcfce7', fg: '#15803d', bd: '#22c55e' },
    { bg: '#fce7f3', fg: '#be185d', bd: '#ec4899' },
  ]
  const parseHM = (hhmm: string) => { const [h, m] = hhmm.split(':').map(Number); return h + m / 60 }

  const monday = useCallback(() => {
    const d = new Date(today)
    const dow = d.getDay()
    d.setDate(d.getDate() + (dow === 0 ? -6 : 1 - dow) + weekOffset * 7)
    d.setHours(0, 0, 0, 0)
    return d
  }, [weekOffset])() // eslint-disable-line react-hooks/exhaustive-deps

  const weekEnd = new Date(monday); weekEnd.setDate(weekEnd.getDate() + 7)
  const weekDates = Array.from({ length: 7 }, (_, col) => { const d = new Date(monday); d.setDate(monday.getDate() + col); return d })

  const mondayStr = toIsoDate(monday)
  const sundayStr = toIsoDate(weekDates[6])

  const { data: dateSlots = [] } = useQuery<DateSlot[]>({
    queryKey: ['myDateSlots', mondayStr, sundayStr],
    queryFn: () => apiClient.get<DateSlot[]>(`/availability/me/dates?from=${mondayStr}&to=${sundayStr}`).then(r => r.data),
  })
  const dateSlotMap: Record<string, TimeRange[]> = Object.fromEntries(dateSlots.map(ds => [ds.date, ds.ranges]))

  const weekLabel = (() => {
    const s = weekDates[0], e = weekDates[6]
    if (weekOffset === 0) return 'Bu Hafta'
    if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear())
      return `${s.getDate()} – ${e.getDate()} ${s.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}`
    return `${s.getDate()} ${s.toLocaleDateString('tr-TR', { month: 'short' })} – ${e.getDate()} ${e.toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' })}`
  })()

  const availByCol: Record<number, WeeklySlot[]> = Object.fromEntries(Array.from({ length: 7 }, (_, i) => [i, []]))
  slots.forEach(s => availByCol[jsDowToCol(s.dayOfWeek)].push(s))

  const bookingEvents = bookings
    .filter(b => {
      const s = new Date(b.startUtc); const sDay = new Date(s); sDay.setHours(0, 0, 0, 0)
      return sDay >= monday && sDay < weekEnd && b.status !== 'Cancelled' && b.status !== 'NoShow'
    })
    .map(b => {
      const s = new Date(b.startUtc), e = new Date(b.endUtc)
      return {
        b, col: jsDowToCol(s.getDay()),
        startH: s.getHours() + s.getMinutes() / 60,
        endH: e.getHours() + e.getMinutes() / 60,
        tStart: s.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        tEnd: e.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        status: effectiveStatus(b),
      }
    })

  const fixedPrograms = groupByProgram(services.filter(s => s.scheduledStart))
  const fixedEvents = fixedPrograms.flatMap((group, i) => {
    const pal = PALETTES[i % PALETTES.length]
    return group.flatMap((s) => {
      const baseStart = new Date(s.scheduledStart!)
      const baseEnd = s.scheduledEnd ? new Date(s.scheduledEnd) : new Date(baseStart.getTime() + s.durationMinutes * 60000)
      const weeks = s.recurrenceWeeks ?? 1
      for (let w = 0; w < weeks; w++) {
        const st = new Date(baseStart.getTime() + w * 7 * 24 * 60 * 60 * 1000)
        const stDay = new Date(st); stDay.setHours(0, 0, 0, 0)
        if (stDay >= monday && stDay < weekEnd) {
          const en = new Date(baseEnd.getTime() + w * 7 * 24 * 60 * 60 * 1000)
          const stMs = st.getTime()
          const count = bookings.filter(b => b.serviceId === s.id && new Date(b.startUtc).getTime() === stMs && (b.status === 'Confirmed' || b.status === 'Pending')).length
          return [{ s, col: jsDowToCol(st.getDay()), startH: st.getHours() + st.getMinutes() / 60, endH: en.getHours() + en.getMinutes() / 60, tStart: st.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }), tEnd: en.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }), pal, count }]
        }
      }
      return []
    })
  })

  const dateSlotTimes = dateSlots.flatMap(ds => ds.ranges)
  const allStartH = [...slots.map(s => parseHM(s.startTime)), ...fixedEvents.map(e => e.startH), ...dateSlotTimes.map(r => parseHM(r.startTime)), ...bookingEvents.map(e => e.startH)]
  const allEndH   = [...slots.map(s => parseHM(s.endTime)),   ...fixedEvents.map(e => e.endH),   ...dateSlotTimes.map(r => parseHM(r.endTime)),   ...bookingEvents.map(e => e.endH)]
  const hasContent = allStartH.length > 0
  const minH = hasContent ? Math.max(6,  Math.floor(Math.min(...allStartH)) - 1) : 8
  const maxH = hasContent ? Math.min(23, Math.ceil(Math.max(...allEndH))   + 1) : 18
  const hours = Array.from({ length: maxH - minH + 1 }, (_, i) => minH + i)
  const totalH = (maxH - minH) * HOUR_PX
  const todayCol = weekOffset === 0 ? jsDowToCol(todayJsDow) : -1
  const activeCount = Object.values(availByCol).filter(r => r.length > 0).length + dateSlots.length
  const dateSlotHours = dateSlots.reduce((sum, ds) => sum + ds.ranges.reduce((s2, r) => s2 + parseHM(r.endTime) - parseHM(r.startTime), 0), 0)
  const totalHours = slots.reduce((sum, s) => sum + parseHM(s.endTime) - parseHM(s.startTime), 0) + dateSlotHours

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--color-primary-light)' }}>
            <CalendarDays size={15} style={{ color: 'var(--color-primary)' }} />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 text-sm leading-none">Takvim</h2>
            {!isLoading && activeCount > 0 && (
              <p className="text-xs text-gray-400 mt-0.5">{activeCount} gün · {Math.round(totalHours)} saat müsait</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-gray-50 rounded-xl p-1">
            <button onClick={() => setWeekOffset(w => w - 1)} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:bg-white hover:shadow-sm transition-all">
              <ChevronLeft size={14} />
            </button>
            <button onClick={() => setWeekOffset(0)} className="px-2.5 h-7 text-[11px] font-semibold rounded-lg transition-all"
              style={weekOffset === 0 ? { background: 'var(--color-primary)', color: '#fff' } : { color: 'var(--color-primary)' }}>
              {weekLabel}
            </button>
            <button onClick={() => setWeekOffset(w => w + 1)} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:bg-white hover:shadow-sm transition-all">
              <ChevronRight size={14} />
            </button>
          </div>
          <Link to="/provider/availability" className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors hover:bg-gray-50"
            style={{ color: 'var(--color-primary)', borderColor: 'var(--color-primary-light)' }}>
            <Pencil size={11} /> Düzenle
          </Link>
        </div>
      </div>

      <div className="p-4">
        {isLoading ? (
          <div className="h-64 rounded-xl bg-gray-100 animate-pulse" />
        ) : !hasContent && bookingEvents.length === 0 ? (
          <div className="py-8 text-center">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: 'var(--color-primary-light)' }}>
              <CalendarPlus size={20} style={{ color: 'var(--color-primary)' }} />
            </div>
            <p className="text-sm font-medium text-gray-700 mb-1">Bu haftada planlanmış ders yok</p>
            <p className="text-xs text-gray-400 mb-4">İleri haftaya geçin veya müsaitliğinizi düzenleyin.</p>
            <Link to="/provider/availability" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: 'var(--color-primary)' }}>
              <CalendarPlus size={14} /> Saatleri Ayarla
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-1 px-1">
            <div className="min-w-[560px]">
              <div className="flex pl-10 mb-2 gap-px">
                {DAY_SHORT_MF.map((d, col) => {
                  const isNow = col === todayCol
                  const date = weekDates[col]
                  return (
                    <div key={d} className="flex-1 flex flex-col items-center py-1">
                      <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: isNow ? 'var(--color-primary)' : '#9ca3af' }}>{d}</p>
                      <span className="text-xs font-bold mt-0.5 w-6 h-6 flex items-center justify-center rounded-full"
                        style={isNow ? { background: 'var(--color-primary)', color: '#fff' } : { color: '#6b7280' }}>
                        {date.getDate()}
                      </span>
                    </div>
                  )
                })}
              </div>

              <div className="flex" style={{ height: totalH }}>
                <div className="w-10 flex-shrink-0 relative select-none">
                  {hours.map(h => (
                    <div key={h} className="absolute right-2 text-[10px] text-gray-400 leading-none" style={{ top: (h - minH) * HOUR_PX - 6 }}>
                      {String(h).padStart(2, '0')}:00
                    </div>
                  ))}
                </div>

                {Array.from({ length: 7 }, (_, col) => {
                  const avails = availByCol[col]
                  const colEvents = fixedEvents.filter(e => e.col === col)
                  const isNow = col === todayCol
                  return (
                    <div key={col} className="flex-1 relative" style={{ borderLeft: col > 0 ? '1px solid #f3f4f6' : undefined }}>
                      {hours.map(h => <div key={h} className="absolute left-0 right-0" style={{ top: (h - minH) * HOUR_PX, borderTop: '1px solid #f3f4f6' }} />)}
                      {isNow && <div className="absolute inset-0 pointer-events-none rounded-sm" style={{ background: 'var(--color-primary-light)', opacity: 0.15 }} />}

                      {avails.map((slot, i) => {
                        const sh = parseHM(slot.startTime), eh = parseHM(slot.endTime)
                        const top = (Math.max(sh, minH) - minH) * HOUR_PX
                        const height = (Math.min(eh, maxH) - Math.max(sh, minH)) * HOUR_PX
                        if (height <= 0) return null
                        return <div key={i} className="absolute left-0.5 right-0.5 rounded-md" style={{ top: top + 1, height: height - 2, background: 'var(--color-primary-light)', opacity: 0.55 }} />
                      })}

                      {(dateSlotMap[toIsoDate(weekDates[col])] ?? []).map((range, i) => {
                        const sh = parseHM(range.startTime), eh = parseHM(range.endTime)
                        const top = (Math.max(sh, minH) - minH) * HOUR_PX
                        const height = (Math.min(eh, maxH) - Math.max(sh, minH)) * HOUR_PX
                        if (height <= 0) return null
                        return <div key={`ds-${i}`} className="absolute left-0.5 right-0.5 rounded-md" style={{ top: top + 1, height: height - 2, background: 'var(--color-primary-light)', opacity: 0.55 }} />
                      })}

                      {colEvents.map((e, j) => (
                        <Link key={j} to="/provider/services"
                          className="absolute left-1 right-1 rounded-xl px-2 py-1.5 overflow-hidden shadow-sm hover:brightness-95 transition-all"
                          style={{ top: (e.startH - minH) * HOUR_PX + 2, height: (e.endH - e.startH) * HOUR_PX - 4, background: e.pal.bg, border: `1.5px solid ${e.pal.bd}` }}>
                          <p className="text-[11px] font-bold leading-tight truncate" style={{ color: e.pal.fg }}>{e.s.name}</p>
                          <p className="text-[10px] leading-tight mt-0.5" style={{ color: e.pal.fg, opacity: 0.8 }}>{e.tStart} – {e.tEnd}</p>
                          {e.count > 0 && <p className="text-[9px] leading-tight mt-0.5" style={{ color: e.pal.fg, opacity: 0.65 }}>{e.s.maxParticipants ? `${e.count}/${e.s.maxParticipants} kayıtlı` : `${e.count} kayıtlı`}</p>}
                        </Link>
                      ))}

                      {bookingEvents.filter(e => e.col === col).map((e, j) => {
                        const top = (Math.max(e.startH, minH) - minH) * HOUR_PX
                        const height = (Math.min(e.endH, maxH) - Math.max(e.startH, minH)) * HOUR_PX
                        if (height <= 0) return null
                        const isDone = e.status === 'Completed'
                        return (
                          <div key={`bk-${j}`} className="absolute left-1 right-1 rounded-xl px-2 py-1.5 overflow-hidden shadow-sm"
                            style={{ top: top + 2, height: height - 4, background: isDone ? '#f3f4f6' : 'var(--color-primary)', border: isDone ? '1.5px solid #e5e7eb' : 'none' }}>
                            <p className="text-[11px] font-bold leading-tight truncate" style={{ color: isDone ? '#9ca3af' : '#fff' }}>{e.b.serviceName}</p>
                            {e.b.clientName && <p className="text-[10px] leading-tight mt-0.5 truncate" style={{ color: isDone ? '#9ca3af' : 'rgba(255,255,255,0.85)' }}>{e.b.clientName}</p>}
                            <p className="text-[9px] leading-tight mt-0.5" style={{ color: isDone ? '#d1d5db' : 'rgba(255,255,255,0.7)' }}>{e.tStart} – {e.tEnd}</p>
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>

              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-50 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm" style={{ background: 'var(--color-primary-light)', border: '1px solid var(--color-primary-light)' }} />
                  <span className="text-[10px] text-gray-400">Müsait saat</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm" style={{ background: 'var(--color-primary)' }} />
                  <span className="text-[10px] text-gray-400">Onaylı ders</span>
                </div>
                {fixedPrograms.map((group, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm" style={{ background: PALETTES[i % PALETTES.length].bg, border: `1px solid ${PALETTES[i % PALETTES.length].bd}` }} />
                    <span className="text-[10px] text-gray-400">{group[0].name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Upcoming Lessons ──────────────────────────────────────────────────────────

function toIsoDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function UpcomingLessons({ bookings, services }: { bookings: Booking[]; services: ServiceItem[] }) {
  const now = new Date()

  type Event = { key: string; dateStr: string; startMs: number; name: string; clientName?: string; tStart: string; tEnd: string }
  const events: Event[] = []

  bookings
    .filter(b => (effectiveStatus(b) === 'Confirmed' || effectiveStatus(b) === 'Pending') && new Date(b.startUtc) > now)
    .forEach(b => {
      const s = new Date(b.startUtc), e = new Date(b.endUtc)
      events.push({
        key: b.id, dateStr: toIsoDateStr(s), startMs: s.getTime(), name: b.serviceName,
        clientName: b.clientName ?? undefined,
        tStart: s.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        tEnd: e.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      })
    })

  services.filter(s => !!s.scheduledStart).forEach(s => {
    const base = new Date(s.scheduledStart!), weeks = s.recurrenceWeeks ?? 1
    for (let w = 0; w < weeks; w++) {
      const st = new Date(base.getTime() + w * 7 * 24 * 60 * 60 * 1000)
      if (st <= now) continue
      const en = s.scheduledEnd
        ? new Date(new Date(s.scheduledEnd).getTime() + w * 7 * 24 * 60 * 60 * 1000)
        : new Date(st.getTime() + s.durationMinutes * 60000)
      events.push({
        key: `${s.id}-${w}`, dateStr: toIsoDateStr(st), startMs: st.getTime(), name: s.name,
        tStart: st.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        tEnd: en.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      })
    }
  })

  events.sort((a, b) => a.startMs - b.startMs)

  if (events.length === 0) return null

  const grouped = events.reduce<Record<string, Event[]>>((acc, e) => {
    if (!acc[e.dateStr]) acc[e.dateStr] = []
    acc[e.dateStr].push(e)
    return acc
  }, {})
  const dates = Object.keys(grouped).sort()

  const fmtHeader = (ds: string) => {
    const d = new Date(ds + 'T12:00:00')
    const todayDs = toIsoDateStr(now)
    const tomorrowDs = toIsoDateStr(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1))
    if (ds === todayDs) return 'Bugün'
    if (ds === tomorrowDs) return 'Yarın'
    return d.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--color-primary-light)' }}>
            <CalendarDays size={15} style={{ color: 'var(--color-primary)' }} />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 text-sm leading-none">Yaklaşan Dersler</h2>
            <p className="text-xs text-gray-400 mt-0.5">{events.length} ders planlandı</p>
          </div>
        </div>
        <Link to="/provider/rezervasyon-ekle"
          className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors hover:bg-gray-50"
          style={{ color: 'var(--color-primary)', borderColor: 'var(--color-primary-light)' }}>
          <CalendarPlus size={11} /> Ekle
        </Link>
      </div>
      <div className="divide-y divide-gray-50 max-h-[360px] overflow-y-auto">
        {dates.map(ds => (
          <div key={ds} className="px-5 py-3">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">{fmtHeader(ds)}</p>
            <div className="space-y-2">
              {grouped[ds].map(e => (
                <div key={e.key} className="flex items-center gap-3">
                  <div className="w-1 rounded-full flex-shrink-0 self-stretch" style={{ background: 'var(--color-primary)', minHeight: '32px' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{e.name}</p>
                    {e.clientName && <p className="text-xs text-gray-400 truncate">{e.clientName}</p>}
                  </div>
                  <span className="text-xs text-gray-500 font-medium flex-shrink-0 tabular-nums">{e.tStart} – {e.tEnd}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function ProviderDashboard() {
  const fullName = useAuthStore((s) => s.fullName)
  const firstName = fullName?.split(' ')[0] ?? ''
  const now = new Date()
  const todayStr = `${DAY_FULL[now.getDay()]}, ${now.getDate()} ${MONTHS_FULL[now.getMonth()]} ${now.getFullYear()}`

  const { data: bookingData, isLoading: bookingsLoading } = useQuery({
    queryKey: ['providerBookings'],
    queryFn: () => bookingsApi.getMyBookings(1, 200),
  })

  const { data: availSlots = [], isLoading: availLoading } = useQuery<WeeklySlot[]>({
    queryKey: ['myAvailability'],
    queryFn: () => apiClient.get<WeeklySlot[]>('/availability/me/weekly').then(r => r.data),
  })

  const { data: myServices = [] } = useQuery<ServiceItem[]>({
    queryKey: ['myServices'],
    queryFn: () => apiClient.get<ServiceItem[]>('/services/me').then(r => r.data),
  })

  const all = bookingData?.items ?? []

  return (
    <div className="space-y-5">
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

      <WeeklySchedule slots={availSlots} services={myServices} isLoading={availLoading || bookingsLoading} bookings={all} />

      <UpcomingLessons bookings={all} services={myServices} />
    </div>
  )
}
