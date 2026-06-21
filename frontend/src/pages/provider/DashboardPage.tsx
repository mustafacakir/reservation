import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  CalendarDays, Clock, CheckCircle, Sun, MessageSquare, Banknote,
  X, Check, ChevronRight, CalendarPlus, Pencil, ChevronLeft,
} from 'lucide-react'
import { bookingsApi } from '@/api/endpoints/bookings.api'
import { apiClient } from '@/api/client'
import { useAuthStore } from '@/store/auth.store'
import type { Booking } from '@/types/booking.types'
import type { WeeklySlot } from '@/types/availability.types'
import type { ServiceItem } from '@/types/provider.types'

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

function WeeklySchedule({ slots, services, isLoading, bookings }: {
  slots: WeeklySlot[]
  services: ServiceItem[]
  isLoading: boolean
  bookings: Booking[]
}) {
  const [weekOffset, setWeekOffset] = useState(0)
  const today = new Date()
  const todayJsDow = today.getDay()

  const jsDowToCol = (dow: number) => (dow + 6) % 7 // Mon=0, Sun=6

  const DAY_SHORT_MF = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']
  const HOUR_PX = 60

  const PALETTES = [
    { bg: 'var(--color-primary-light)', fg: 'var(--color-primary)', bd: 'var(--color-primary)' },
    { bg: '#fef3c7', fg: '#b45309', bd: '#f59e0b' },
    { bg: '#dcfce7', fg: '#15803d', bd: '#22c55e' },
    { bg: '#fce7f3', fg: '#be185d', bd: '#ec4899' },
  ]

  const parseHM = (hhmm: string) => {
    const [h, m] = hhmm.split(':').map(Number)
    return h + m / 60
  }

  // Monday of the displayed week
  const monday = useCallback(() => {
    const d = new Date(today)
    const dow = d.getDay()
    d.setDate(d.getDate() + (dow === 0 ? -6 : 1 - dow) + weekOffset * 7)
    d.setHours(0, 0, 0, 0)
    return d
  }, [weekOffset])() // eslint-disable-line react-hooks/exhaustive-deps

  const weekEnd = new Date(monday)
  weekEnd.setDate(weekEnd.getDate() + 7)

  // One date per Mon-first column
  const weekDates = Array.from({ length: 7 }, (_, col) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + col)
    return d
  })

  const weekLabel = (() => {
    const s = weekDates[0], e = weekDates[6]
    if (weekOffset === 0) return 'Bu Hafta'
    if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear())
      return `${s.getDate()} – ${e.getDate()} ${s.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}`
    return `${s.getDate()} ${s.toLocaleDateString('tr-TR', { month: 'short' })} – ${e.getDate()} ${e.toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' })}`
  })()

  const availByCol: Record<number, WeeklySlot[]> = Object.fromEntries(
    Array.from({ length: 7 }, (_, i) => [i, []])
  )
  slots.forEach((s) => availByCol[jsDowToCol(s.dayOfWeek)].push(s))

  // Group lesson occurrences that fall in the displayed week
  const fixedEvents = services
    .filter((s) => s.scheduledStart)
    .flatMap((s, i) => {
      const baseStart = new Date(s.scheduledStart!)
      const baseEnd = s.scheduledEnd
        ? new Date(s.scheduledEnd)
        : new Date(baseStart.getTime() + s.durationMinutes * 60000)
      const weeks = s.recurrenceWeeks ?? 1
      for (let w = 0; w < weeks; w++) {
        const st = new Date(baseStart.getTime() + w * 7 * 24 * 60 * 60 * 1000)
        const stDay = new Date(st); stDay.setHours(0, 0, 0, 0)
        if (stDay >= monday && stDay < weekEnd) {
          const en = new Date(baseEnd.getTime() + w * 7 * 24 * 60 * 60 * 1000)
          const col = jsDowToCol(st.getDay())
          const startH = st.getHours() + st.getMinutes() / 60
          const endH = en.getHours() + en.getMinutes() / 60
          const tStart = st.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
          const tEnd = en.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
          const stMs = st.getTime()
          const count = bookings.filter(
            (b) => b.serviceId === s.id &&
              new Date(b.startUtc).getTime() === stMs &&
              (b.status === 'Confirmed' || b.status === 'Pending')
          ).length
          return [{ s, col, startH, endH, tStart, tEnd, pal: PALETTES[i % PALETTES.length], count }]
        }
      }
      return []
    })

  const allStartH = [...slots.map((s) => parseHM(s.startTime)), ...fixedEvents.map((e) => e.startH)]
  const allEndH = [...slots.map((s) => parseHM(s.endTime)), ...fixedEvents.map((e) => e.endH)]
  const hasContent = allStartH.length > 0
  const minH = hasContent ? Math.max(6, Math.floor(Math.min(...allStartH)) - 1) : 8
  const maxH = hasContent ? Math.min(23, Math.ceil(Math.max(...allEndH)) + 1) : 18
  const hours = Array.from({ length: maxH - minH + 1 }, (_, i) => minH + i)
  const totalH = (maxH - minH) * HOUR_PX
  const todayCol = weekOffset === 0 ? jsDowToCol(todayJsDow) : -1
  const activeCount = Object.values(availByCol).filter((r) => r.length > 0).length
  const totalHours = slots.reduce((sum, s) => sum + parseHM(s.endTime) - parseHM(s.startTime), 0)

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
        <div className="flex items-center gap-2">
          {/* Week navigation */}
          <div className="flex items-center gap-1 bg-gray-50 rounded-xl p-1">
            <button
              onClick={() => setWeekOffset((w) => w - 1)}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:bg-white hover:shadow-sm transition-all"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => setWeekOffset(0)}
              className="px-2.5 h-7 text-[11px] font-semibold rounded-lg transition-all"
              style={weekOffset === 0
                ? { background: 'var(--color-primary)', color: '#fff' }
                : { color: 'var(--color-primary)' }}
            >
              {weekLabel}
            </button>
            <button
              onClick={() => setWeekOffset((w) => w + 1)}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:bg-white hover:shadow-sm transition-all"
            >
              <ChevronRight size={14} />
            </button>
          </div>
          <Link
            to="/provider/availability"
            className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors hover:bg-gray-50"
            style={{ color: 'var(--color-primary)', borderColor: 'var(--color-primary-light)' }}
          >
            <Pencil size={11} /> Düzenle
          </Link>
        </div>
      </div>

      <div className="p-4">
        {isLoading ? (
          <div className="h-64 rounded-xl bg-gray-100 animate-pulse" />
        ) : !hasContent ? (
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
          <div className="overflow-x-auto -mx-1 px-1">
            <div className="min-w-[560px]">
              {/* Day headers */}
              <div className="flex pl-10 mb-2 gap-px">
                {DAY_SHORT_MF.map((d, col) => {
                  const isNow = col === todayCol
                  const date = weekDates[col]
                  return (
                    <div key={d} className="flex-1 flex flex-col items-center py-1">
                      <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: isNow ? 'var(--color-primary)' : '#9ca3af' }}>
                        {d}
                      </p>
                      <span
                        className="text-xs font-bold mt-0.5 w-6 h-6 flex items-center justify-center rounded-full"
                        style={isNow
                          ? { background: 'var(--color-primary)', color: '#fff' }
                          : { color: '#6b7280' }
                        }
                      >
                        {date.getDate()}
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* Calendar grid */}
              <div className="flex" style={{ height: totalH }}>
                {/* Hour axis */}
                <div className="w-10 flex-shrink-0 relative select-none">
                  {hours.map((h) => (
                    <div
                      key={h}
                      className="absolute right-2 text-[10px] text-gray-400 leading-none"
                      style={{ top: (h - minH) * HOUR_PX - 6 }}
                    >
                      {String(h).padStart(2, '0')}:00
                    </div>
                  ))}
                </div>

                {/* Day columns */}
                {Array.from({ length: 7 }, (_, col) => {
                  const avails = availByCol[col]
                  const colEvents = fixedEvents.filter((e) => e.col === col)
                  const isNow = col === todayCol

                  return (
                    <div
                      key={col}
                      className="flex-1 relative"
                      style={{ borderLeft: col > 0 ? '1px solid #f3f4f6' : undefined }}
                    >
                      {hours.map((h) => (
                        <div
                          key={h}
                          className="absolute left-0 right-0"
                          style={{ top: (h - minH) * HOUR_PX, borderTop: '1px solid #f3f4f6' }}
                        />
                      ))}

                      {isNow && (
                        <div className="absolute inset-0 pointer-events-none rounded-sm" style={{ background: 'var(--color-primary-light)', opacity: 0.15 }} />
                      )}

                      {avails.map((slot, i) => {
                        const sh = parseHM(slot.startTime)
                        const eh = parseHM(slot.endTime)
                        const top = (Math.max(sh, minH) - minH) * HOUR_PX
                        const height = (Math.min(eh, maxH) - Math.max(sh, minH)) * HOUR_PX
                        if (height <= 0) return null
                        return (
                          <div
                            key={i}
                            className="absolute left-0.5 right-0.5 rounded-md"
                            style={{ top: top + 1, height: height - 2, background: 'var(--color-primary-light)', opacity: 0.55 }}
                          />
                        )
                      })}

                      {colEvents.map((e, j) => (
                        <Link
                          key={j}
                          to="/provider/services"
                          className="absolute left-1 right-1 rounded-xl px-2 py-1.5 overflow-hidden shadow-sm hover:brightness-95 transition-all"
                          style={{
                            top: (e.startH - minH) * HOUR_PX + 2,
                            height: (e.endH - e.startH) * HOUR_PX - 4,
                            background: e.pal.bg,
                            border: `1.5px solid ${e.pal.bd}`,
                          }}
                        >
                          <p className="text-[11px] font-bold leading-tight truncate" style={{ color: e.pal.fg }}>
                            {e.s.name}
                          </p>
                          <p className="text-[10px] leading-tight mt-0.5" style={{ color: e.pal.fg, opacity: 0.8 }}>
                            {e.tStart} – {e.tEnd}
                          </p>
                          <p className="text-[9px] leading-tight mt-0.5" style={{ color: e.pal.fg, opacity: 0.65 }}>
                            {e.s.maxParticipants
                              ? `${e.count}/${e.s.maxParticipants} kayıtlı`
                              : e.count > 0 ? `${e.count} kayıtlı` : ''}
                            {e.s.recurrenceWeeks && e.s.recurrenceWeeks > 1 ? ` · ${e.s.recurrenceWeeks} hafta` : ''}
                          </p>
                        </Link>
                      ))}
                    </div>
                  )
                })}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-50 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm" style={{ background: 'var(--color-primary-light)' }} />
                  <span className="text-[10px] text-gray-400">Müsait saat</span>
                </div>
                {services.filter((s) => s.scheduledStart).map((s, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm" style={{ background: PALETTES[i % PALETTES.length].bg, border: `1px solid ${PALETTES[i % PALETTES.length].bd}` }} />
                    <span className="text-[10px] text-gray-400">{s.name}</span>
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

  const { data: myServices = [] } = useQuery<ServiceItem[]>({
    queryKey: ['myServices'],
    queryFn: () => apiClient.get<ServiceItem[]>('/services/me').then((r) => r.data),
  })

  const all = bookingData?.items ?? []

  const upcoming = all
    .filter((b) => effectiveStatus(b) !== 'Completed' && effectiveStatus(b) !== 'Cancelled' &&
      (isToday(b.startUtc) || new Date(b.startUtc) > now))
    .sort((a, b) => new Date(a.startUtc).getTime() - new Date(b.startUtc).getTime())

  // Services with a fixed future date (no booking required to show in schedule)
  const scheduledServices = myServices.filter((s) => {
    if (!s.scheduledStart) return false
    const weeks = s.recurrenceWeeks ?? 1
    // Show if any occurrence is in the future
    for (let w = 0; w < weeks; w++) {
      const d = new Date(new Date(s.scheduledStart).getTime() + w * 7 * 24 * 60 * 60 * 1000)
      if (d > now) return true
    }
    return false
  })

  const todayCount     = all.filter((b) => isToday(b.startUtc) && effectiveStatus(b) !== 'Cancelled').length
  const pendingCount   = all.filter((b) => effectiveStatus(b) === 'Pending').length
  const completedCount = all.filter((b) => effectiveStatus(b) === 'Completed').length

  const filtered =
    filter === 'upcoming'  ? upcoming :
    filter === 'pending'   ? all.filter((b) => effectiveStatus(b) === 'Pending') :
    filter === 'completed' ? all.filter((b) => effectiveStatus(b) === 'Completed') :
    all

  const upcomingTotal = upcoming.length + scheduledServices.length

  const stats = [
    { label: 'Bugün',      value: todayCount,     Icon: Sun,          active: todayCount > 0 },
    { label: 'Yaklaşan',   value: upcomingTotal,  Icon: CalendarDays, active: false },
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
      <WeeklySchedule slots={availSlots} services={myServices} isLoading={availLoading} bookings={all} />

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
        ) : (
          <div className="space-y-3">
            {/* Scheduled services (fixed-date, no booking needed) */}
            {filter === 'upcoming' && scheduledServices.map((s) => {
              const start = new Date(s.scheduledStart!)
              const end = s.scheduledEnd ? new Date(s.scheduledEnd) : new Date(start.getTime() + s.durationMinutes * 60000)
              const weeks = s.recurrenceWeeks ?? 1
              const occurrences = Array.from({ length: weeks }, (_, w) => ({
                start: new Date(start.getTime() + w * 7 * 24 * 60 * 60 * 1000),
                end: new Date(end.getTime() + w * 7 * 24 * 60 * 60 * 1000),
              })).filter((o) => o.start > now)
              return occurrences.map((occ, w) => (
                <div key={`${s.id}-${w}`} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--color-primary-light)' }}>
                    <CalendarDays size={16} style={{ color: 'var(--color-primary)' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900 text-sm">{s.name}</p>
                      {s.sessionType === 'Group' && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md" style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>GRUP</span>
                      )}
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-600">PLANLI</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <CalendarDays size={11} />{dayLabel(occ.start.toISOString())}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock size={11} />
                        {occ.start.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                        {' – '}
                        {occ.end.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {s.sessionType === 'Group' && s.maxParticipants && (
                        <span className="text-xs text-gray-400">Maks. {s.maxParticipants} kişi</span>
                      )}
                    </div>
                  </div>
                  <span className="text-sm font-bold text-gray-700 flex-shrink-0">
                    {Number(s.price) === 0 ? <span className="text-green-600">Ücretsiz</span> : `₺${Number(s.price).toLocaleString('tr-TR')}`}
                  </span>
                </div>
              ))
            })}

            {/* Actual bookings */}
            {filtered.map((b) => <BookingCard key={b.id} b={b} />)}

            {filter !== 'upcoming' && filtered.length === 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-14 text-center">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: 'var(--color-primary-light)' }}>
                  <CalendarDays size={20} style={{ color: 'var(--color-primary)' }} />
                </div>
                <p className="text-sm font-medium text-gray-600">Ders bulunamadı</p>
                <p className="text-xs text-gray-400 mt-1">Bu filtrede ders yok.</p>
              </div>
            )}
            {filter === 'upcoming' && upcoming.length === 0 && scheduledServices.length === 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-14 text-center">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: 'var(--color-primary-light)' }}>
                  <CalendarDays size={20} style={{ color: 'var(--color-primary)' }} />
                </div>
                <p className="text-sm font-medium text-gray-600">Yaklaşan ders yok</p>
                <p className="text-xs text-gray-400 mt-1">Müsaitliğinizi güncelleyin veya sabit tarihli ders ekleyin.</p>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  )
}
