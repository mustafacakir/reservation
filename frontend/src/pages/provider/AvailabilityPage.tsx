import { useState, useEffect } from 'react'
import { Plus, Trash2, Clock } from 'lucide-react'
import { apiClient } from '@/api/client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/components/ui/Toast'

const DAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi']
const DAY_SHORT = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt']
const MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']

function getWeekDates(): Date[] {
  const today = new Date()
  const sunday = new Date(today)
  sunday.setDate(today.getDate() - today.getDay())
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday)
    d.setDate(sunday.getDate() + i)
    return d
  })
}

const WEEK_DATES = getWeekDates()
const TODAY_DOW = new Date().getDay()

interface TimeRange {
  startTime: string
  endTime: string
}

type DayRanges = TimeRange[]

const WEEKDAY_DEFAULT: TimeRange = { startTime: '09:00', endTime: '18:00' }

const FALLBACK_RANGES: Record<number, DayRanges> = {
  0: [],
  1: [{ ...WEEKDAY_DEFAULT }],
  2: [{ ...WEEKDAY_DEFAULT }],
  3: [{ ...WEEKDAY_DEFAULT }],
  4: [{ ...WEEKDAY_DEFAULT }],
  5: [{ ...WEEKDAY_DEFAULT }],
  6: [],
}

function hasError(range: TimeRange) {
  return range.endTime <= range.startTime
}

function totalHoursForDay(ranges: TimeRange[]) {
  return ranges.reduce((sum, r) => {
    if (hasError(r)) return sum
    const [sh, sm] = r.startTime.split(':').map(Number)
    const [eh, em] = r.endTime.split(':').map(Number)
    return sum + (eh * 60 + em - (sh * 60 + sm)) / 60
  }, 0)
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${
        on ? '' : 'bg-gray-200'
      }`}
      style={on ? { background: 'var(--color-primary)' } : {}}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
          on ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}

function TimeInput({
  value,
  onChange,
  error,
}: {
  value: string
  onChange: (v: string) => void
  error?: boolean
}) {
  return (
    <input
      type="time"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`border rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
        error ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'
      }`}
      style={{ '--tw-ring-color': 'var(--color-primary)' } as React.CSSProperties}
    />
  )
}

export default function AvailabilityPage() {
  const [dayRanges, setDayRanges] = useState<Record<number, DayRanges>>(FALLBACK_RANGES)
  const qc = useQueryClient()
  const toast = useToast()

  const { data: existingSlots, isSuccess } = useQuery({
    queryKey: ['myAvailability'],
    queryFn: () =>
      apiClient
        .get<{ dayOfWeek: number; startTime: string; endTime: string }[]>('/availability/me/weekly')
        .then((r) => r.data),
  })

  useEffect(() => {
    if (!isSuccess || !existingSlots?.length) return
    const loaded: Record<number, DayRanges> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] }
    existingSlots.forEach((s) => {
      loaded[s.dayOfWeek].push({ startTime: s.startTime, endTime: s.endTime })
    })
    setDayRanges(loaded)
  }, [isSuccess, existingSlots])

  const saveMutation = useMutation({
    mutationFn: (data: Record<number, DayRanges>) => {
      const slots = Object.entries(data).flatMap(([day, ranges]) =>
        ranges
          .filter((r) => !hasError(r))
          .map((r) => ({ dayOfWeek: parseInt(day), startTime: r.startTime, endTime: r.endTime }))
      )
      return apiClient.put('/availability/me/weekly', { slots })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['myAvailability'] })
      toast.success('Müsaitlik kaydedildi', 'Haftalık programınız güncellendi.')
    },
    onError: () => {
      toast.error('Kayıt başarısız', 'Lütfen tekrar deneyin.')
    },
  })

  const isActive = (day: number) => dayRanges[day].length > 0

  const toggleDay = (day: number) => {
    setDayRanges((prev) => ({
      ...prev,
      [day]: prev[day].length > 0 ? [] : [{ ...WEEKDAY_DEFAULT }],
    }))
  }

  const addRange = (day: number) => {
    setDayRanges((prev) => ({
      ...prev,
      [day]: [...prev[day], { startTime: '09:00', endTime: '18:00' }],
    }))
  }

  const removeRange = (day: number, idx: number) => {
    setDayRanges((prev) => ({
      ...prev,
      [day]: prev[day].filter((_, i) => i !== idx),
    }))
  }

  const updateRange = (day: number, idx: number, patch: Partial<TimeRange>) => {
    setDayRanges((prev) => ({
      ...prev,
      [day]: prev[day].map((r, i) => (i === idx ? { ...r, ...patch } : r)),
    }))
  }

  const hasAnyError = Object.values(dayRanges).some((ranges) => ranges.some(hasError))

  const activeDays = Object.values(dayRanges).filter((r) => r.length > 0).length
  const totalHours = Object.values(dayRanges).reduce(
    (sum, ranges) => sum + totalHoursForDay(ranges),
    0,
  )

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Haftalık Müsaitlik</h1>
          <p className="text-sm text-gray-500 mt-0.5">Ders verebileceğiniz gün ve saatleri belirleyin.</p>
        </div>
        {activeDays > 0 && (
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-gray-900">{activeDays} gün</p>
            <p className="text-xs text-gray-400">{Math.round(totalHours)} saat/hafta</p>
          </div>
        )}
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-7 gap-1.5">
        {[0, 1, 2, 3, 4, 5, 6].map((dow) => {
          const active = isActive(dow)
          const isToday = dow === TODAY_DOW
          const date = WEEK_DATES[dow]
          return (
            <button
              key={dow}
              type="button"
              onClick={() => toggleDay(dow)}
              className="flex flex-col items-center gap-0.5 py-2 rounded-xl text-xs font-semibold transition-all"
              style={
                active
                  ? { background: 'var(--color-primary)', color: '#fff' }
                  : { background: '#f3f4f6', color: '#9ca3af' }
              }
            >
              <span className="text-[10px] uppercase tracking-wide opacity-80">{DAY_SHORT[dow]}</span>
              <span className={`text-sm font-bold leading-tight ${isToday && !active ? 'underline decoration-dotted' : ''}`}>
                {date.getDate()}
              </span>
              {active
                ? <span className="w-1.5 h-1.5 rounded-full bg-white/60" />
                : <span className="text-[9px] opacity-50">{MONTHS[date.getMonth()]}</span>
              }
            </button>
          )
        })}
      </div>

      {/* Day rows */}
      <div className="space-y-2">
        {DAYS.map((day, i) => {
          const active = isActive(i)
          const ranges = dayRanges[i]
          const hours = totalHoursForDay(ranges)

          return (
            <div
              key={day}
              className="bg-white rounded-2xl border transition-all overflow-hidden"
              style={
                active
                  ? { borderColor: 'var(--color-primary)', boxShadow: '0 0 0 3px var(--color-primary-light)' }
                  : { borderColor: '#f3f4f6' }
              }
            >
              {/* Day header */}
              <div className="flex items-center gap-4 px-5 py-3.5">
                <div className="flex-1 flex items-center gap-3">
                  <span
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all"
                    style={
                      active
                        ? { background: 'var(--color-primary)', color: '#fff' }
                        : { background: '#f3f4f6', color: '#9ca3af' }
                    }
                  >
                    {DAY_SHORT[i]}
                  </span>
                  <div>
                    <div className="flex items-baseline gap-2">
                      <p className="text-sm font-semibold text-gray-900">{day}</p>
                      <span className={`text-xs font-medium ${i === TODAY_DOW ? 'font-bold' : 'text-gray-400'}`}
                        style={i === TODAY_DOW ? { color: 'var(--color-primary)' } : {}}>
                        {WEEK_DATES[i].getDate()} {MONTHS[WEEK_DATES[i].getMonth()]}
                        {i === TODAY_DOW && <span className="ml-1 text-[10px]">(bugün)</span>}
                      </span>
                    </div>
                    <p className="text-xs" style={active ? { color: 'var(--color-primary)' } : { color: '#d1d5db' }}>
                      {active
                        ? `${Math.round(hours * 10) / 10} saat müsait`
                        : 'Müsait değil'}
                    </p>
                  </div>
                </div>
                <Toggle on={active} onToggle={() => toggleDay(i)} />
              </div>

              {/* Time ranges */}
              {active && (
                <div className="px-5 pb-4 border-t border-gray-50 pt-3 space-y-2">
                  {ranges.map((range, idx) => {
                    const err = hasError(range)
                    return (
                      <div key={idx} className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-1.5">
                          <Clock size={12} className="text-gray-400 flex-shrink-0" />
                          <TimeInput
                            value={range.startTime}
                            onChange={(v) => updateRange(i, idx, { startTime: v })}
                            error={err}
                          />
                          <span className="text-gray-300 text-sm">—</span>
                          <TimeInput
                            value={range.endTime}
                            onChange={(v) => updateRange(i, idx, { endTime: v })}
                            error={err}
                          />
                        </div>
                        {err && (
                          <span className="text-xs text-red-500">Bitiş başlangıçtan önce olamaz</span>
                        )}
                        {ranges.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeRange(i, idx)}
                            className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    )
                  })}
                  <button
                    type="button"
                    onClick={() => addRange(i)}
                    className="flex items-center gap-1.5 text-xs font-medium mt-1 hover:opacity-70 transition-opacity"
                    style={{ color: 'var(--color-primary)' }}
                  >
                    <Plus size={13} /> Aralık ekle
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Save */}
      <div className="flex items-center gap-3 pb-4">
        <button
          onClick={() => saveMutation.mutate(dayRanges)}
          disabled={saveMutation.isPending || hasAnyError}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-opacity hover:opacity-90 shadow-sm"
          style={{ background: 'var(--color-primary)' }}
        >
          {saveMutation.isPending ? 'Kaydediliyor…' : 'Değişiklikleri Kaydet'}
        </button>
        {hasAnyError && (
          <span className="text-sm text-red-500">Hatalı saat aralıkları var.</span>
        )}
      </div>
    </div>
  )
}
