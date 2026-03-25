import { useState } from 'react'
import { ChevronDown, ChevronUp, Check } from 'lucide-react'
import { apiClient } from '@/api/client'
import { useMutation, useQueryClient } from '@tanstack/react-query'

const DAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi']
const DAY_SHORT = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt']

// Hours 0–23
const HOURS = Array.from({ length: 24 }, (_, i) => i)

function fmt(h: number) {
  return `${String(h).padStart(2, '0')}:00`
}

// State per day: set of selected hours
type DayHours = Set<number>

const defaultDayHours: Record<number, DayHours> = {
  0: new Set(),
  1: new Set([9, 10, 11, 12, 13, 14, 15, 16]),
  2: new Set([9, 10, 11, 12, 13, 14, 15, 16]),
  3: new Set([9, 10, 11, 12, 13, 14, 15, 16]),
  4: new Set([9, 10, 11, 12, 13, 14, 15, 16]),
  5: new Set([9, 10, 11, 12, 13, 14, 15, 16]),
  6: new Set(),
}

function hoursToSlots(dayIndex: number, hours: DayHours) {
  if (hours.size === 0) return []
  // Group consecutive hours into ranges
  const sorted = [...hours].sort((a, b) => a - b)
  const ranges: { start: number; end: number }[] = []
  let start = sorted[0]
  let prev = sorted[0]

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === prev + 1) {
      prev = sorted[i]
    } else {
      ranges.push({ start, end: prev + 1 })
      start = sorted[i]
      prev = sorted[i]
    }
  }
  ranges.push({ start, end: prev + 1 })

  return ranges.map((r) => ({
    dayOfWeek: dayIndex,
    startTime: fmt(r.start),
    endTime: fmt(r.end),
  }))
}

export default function AvailabilityPage() {
  const [dayHours, setDayHours] = useState<Record<number, DayHours>>(defaultDayHours)
  const [openDay, setOpenDay] = useState<number | null>(null)
  const qc = useQueryClient()

  const saveMutation = useMutation({
    mutationFn: (data: Record<number, DayHours>) =>
      apiClient.put('/availability/me/weekly', {
        slots: Object.entries(data).flatMap(([day, hours]) =>
          hoursToSlots(parseInt(day), hours)
        ),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['myAvailability'] }),
  })

  const toggleHour = (day: number, hour: number) => {
    setDayHours((prev) => {
      const next = new Set(prev[day])
      if (next.has(hour)) next.delete(hour)
      else next.add(hour)
      return { ...prev, [day]: next }
    })
  }

  const toggleDay = (day: number) => {
    setOpenDay((d) => (d === day ? null : day))
  }

  const clearDay = (day: number) => {
    setDayHours((prev) => ({ ...prev, [day]: new Set() }))
  }

  const selectAll = (day: number) => {
    setDayHours((prev) => ({ ...prev, [day]: new Set(HOURS.filter((h) => h >= 8 && h < 22)) }))
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Haftalık Müsaitlik</h1>
        <p className="text-sm text-gray-500 mt-1">
          Ders verebileceğiniz gün ve saatleri belirleyin. Bir güne tıklayarak saatleri seçin.
        </p>
      </div>

      <div className="space-y-2">
        {DAYS.map((day, i) => {
          const hours = dayHours[i]
          const isOpen = openDay === i
          const count = hours.size

          return (
            <div
              key={day}
              className="bg-white rounded-2xl border overflow-hidden transition-all"
              style={isOpen ? { borderColor: 'var(--color-primary)', boxShadow: '0 0 0 2px var(--color-primary-light, #ede9fe)' } : {}}
            >
              {/* Day header */}
              <button
                onClick={() => toggleDay(i)}
                className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 transition-all ${count > 0 ? 'text-white' : 'bg-gray-100 text-gray-400'}`}
                    style={count > 0 ? { background: 'var(--color-primary)' } : {}}
                  >
                  {DAY_SHORT[i]}
                </span>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{day}</p>
                    {count > 0 ? (
                      <p className="text-xs text-gray-400 mt-0.5">{count} saat seçili</p>
                    ) : (
                      <p className="text-xs text-gray-300 mt-0.5">Müsait değil</p>
                    )}
                  </div>
                </div>
                {isOpen ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
              </button>

              {/* Hour grid */}
              {isOpen && (
                <div className="px-5 pb-5 border-t border-gray-50">
                  <div className="flex items-center justify-between py-3">
                    <p className="text-xs font-medium text-gray-500">Saat seçin</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => selectAll(i)}
                        className="text-xs px-2.5 py-1 rounded-lg font-medium transition-colors"
                        style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
                      >
                        08–22 Tümü
                      </button>
                      <button
                        onClick={() => clearDay(i)}
                        className="text-xs px-2.5 py-1 rounded-lg font-medium text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors"
                      >
                        Temizle
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-6 gap-1.5">
                    {HOURS.map((h) => {
                      const selected = hours.has(h)
                      return (
                        <button
                          key={h}
                          onClick={() => toggleHour(i, h)}
                          className={`py-2 rounded-xl text-xs font-medium transition-all ${selected ? 'text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                          style={selected ? { background: 'var(--color-primary)' } : {}}
                        >
                          {fmt(h)}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="pt-5 flex items-center gap-3">
        <button
          onClick={() => saveMutation.mutate(dayHours)}
          disabled={saveMutation.isPending}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ background: 'var(--color-primary)' }}
        >
          {saveMutation.isPending ? 'Kaydediliyor…' : 'Kaydet'}
        </button>
        {saveMutation.isSuccess && (
          <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
            <Check size={15} /> Kaydedildi
          </span>
        )}
        {saveMutation.isError && <span className="text-sm text-red-500">Kayıt başarısız, tekrar deneyin.</span>}
      </div>
    </div>
  )
}
