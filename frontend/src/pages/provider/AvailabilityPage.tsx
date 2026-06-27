import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Clock, Trash2, Check, Plus, AlertTriangle } from 'lucide-react'
import { apiClient } from '@/api/client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/components/ui/Toast'

const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']
const DAY_LABELS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']

interface TimeRange { startTime: string; endTime: string }
interface DateSlot { date: string; ranges: TimeRange[] }
interface WeeklySlot { dayOfWeek: number; startTime: string; endTime: string }

function toDateStr(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function getMonthDays(year: number, month: number): (number | null)[] {
  const startDow = (new Date(year, month, 1).getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  return [...Array(startDow).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
}

function rangeLabel(ranges: TimeRange[]) {
  return ranges.map(r => `${r.startTime}–${r.endTime}`).join(', ')
}

function hasRangeError(r: TimeRange) { return r.endTime <= r.startTime }

export default function AvailabilityPage() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selected, setSelected] = useState<string | null>(null)
  const [ranges, setRanges] = useState<TimeRange[]>([{ startTime: '09:00', endTime: '18:00' }])
  const [repeatWeeks, setRepeatWeeks] = useState(1)
  const qc = useQueryClient()
  const toast = useToast()

  const from = toDateStr(year, month, 1)
  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate())

  // Wider window for pattern detection (current month + 12 weeks ahead)
  const wideFrom = from
  const wideTo = (() => {
    const d = new Date(year, month + 1, 0)
    d.setDate(d.getDate() + 84) // +12 weeks
    return toDateStr(d.getFullYear(), d.getMonth(), d.getDate())
  })()

  const { data: dateSlots = [] } = useQuery<DateSlot[]>({
    queryKey: ['myDateSlots', wideFrom, wideTo],
    queryFn: () => apiClient.get<DateSlot[]>(`/availability/me/dates?from=${wideFrom}&to=${wideTo}`).then(r => r.data),
  })

  const { data: weeklySlots = [] } = useQuery<WeeklySlot[]>({
    queryKey: ['myAvailability'],
    queryFn: () => apiClient.get<WeeklySlot[]>('/availability/me/weekly').then(r => r.data),
  })

  const dateMap = Object.fromEntries(dateSlots.map(s => [s.date, s]))
  const weeklyDowMap = Object.fromEntries(weeklySlots.map(s => [s.dayOfWeek, s]))
  const hasWeekly = weeklySlots.length > 0

  useEffect(() => {
    if (!selected) return
    if (dateMap[selected]) {
      const entry = dateMap[selected]
      setRanges(entry.ranges)
      // Detect how many consecutive same-weekday dates share identical time ranges
      const rangesKey = JSON.stringify(entry.ranges)
      let detected = 1
      for (let w = 1; w <= 8; w++) {
        const d = new Date(selected + 'T12:00:00')
        d.setDate(d.getDate() + 7 * w)
        const nextStr = toDateStr(d.getFullYear(), d.getMonth(), d.getDate())
        if (!dateMap[nextStr] || JSON.stringify(dateMap[nextStr].ranges) !== rangesKey) break
        detected++
      }
      setRepeatWeeks(detected)
    } else {
      const dow = new Date(selected + 'T12:00:00').getDay()
      if (weeklyDowMap[dow]) {
        setRanges([{ startTime: weeklyDowMap[dow].startTime, endTime: weeklyDowMap[dow].endTime }])
      } else {
        setRanges([{ startTime: '09:00', endTime: '18:00' }])
      }
      setRepeatWeeks(1)
    }
  }, [selected, dateSlots])

  const saveMutation = useMutation({
    mutationFn: (d: { date: string; ranges: TimeRange[]; repeatWeeks: number }) => apiClient.put('/availability/me/date', d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['myDateSlots'] })
      qc.invalidateQueries({ queryKey: ['myAvailability'] })
      toast.success('Kaydedildi')
      setSelected(null)
    },
    onError: () => toast.error('Hata', 'Kaydedilemedi.'),
  })

  const deleteDateMutation = useMutation({
    mutationFn: (date: string) => apiClient.delete(`/availability/me/date/${date}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['myDateSlots'] })
      toast.success('Silindi')
      setSelected(null)
    },
  })

  const clearWeeklyMutation = useMutation({
    mutationFn: () => apiClient.put('/availability/me/weekly', { slots: [] }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['myAvailability'] })
      toast.success('Haftalık program temizlendi')
    },
  })

  const prevMonth = () => { setSelected(null); if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1) }
  const nextMonth = () => { setSelected(null); if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1) }

  const getDayInfo = (year: number, month: number, day: number) => {
    const dateStr = toDateStr(year, month, day)
    if (dateMap[dateStr]) return { type: 'exception' as const, label: rangeLabel(dateMap[dateStr].ranges) }
    const dow = new Date(year, month, day).getDay()
    if (weeklyDowMap[dow]) return { type: 'weekly' as const, label: `${weeklyDowMap[dow].startTime}–${weeklyDowMap[dow].endTime}` }
    return { type: 'none' as const, label: '' }
  }

  const updateRange = (idx: number, patch: Partial<TimeRange>) =>
    setRanges(prev => prev.map((r, i) => i === idx ? { ...r, ...patch } : r))

  const addRange = () => setRanges(prev => [...prev, { startTime: '09:00', endTime: '18:00' }])
  const removeRange = (idx: number) => setRanges(prev => prev.filter((_, i) => i !== idx))

  const hasAnyError = ranges.some(hasRangeError)
  const cells = getMonthDays(year, month)

  return (
    <div className="max-w-lg space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Müsaitlik Takvimi</h1>
        <p className="text-sm text-gray-500 mt-0.5">Müsait olduğunuz günlere tıklayarak saat aralığı ekleyin.</p>
      </div>

      {hasWeekly && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
          <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">Haftalık tekrarlayan program aktif</p>
            <p className="text-xs text-amber-700 mt-0.5">Çizgili günler haftalık programa göre müsait görünüyor. Tarih bazlı sisteme geçmek için temizleyin.</p>
            <button onClick={() => clearWeeklyMutation.mutate()} disabled={clearWeeklyMutation.isPending}
              className="mt-2 text-xs font-semibold text-amber-700 border border-amber-300 px-3 py-1.5 rounded-lg hover:bg-amber-100 transition-colors disabled:opacity-50">
              {clearWeeklyMutation.isPending ? 'Temizleniyor…' : 'Haftalık programı temizle'}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-50">
          <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"><ChevronLeft size={18} /></button>
          <span className="font-bold text-gray-900">{MONTHS[month]} {year}</span>
          <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"><ChevronRight size={18} /></button>
        </div>
        <div className="grid grid-cols-7 border-b border-gray-50">
          {DAY_LABELS.map(d => <div key={d} className="text-center text-[10px] font-semibold text-gray-400 uppercase py-2">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1 p-3">
          {cells.map((day, i) => {
            if (!day) return <div key={i} />
            const dateStr = toDateStr(year, month, day)
            const isPast = dateStr < todayStr
            const isSelected = selected === dateStr
            const isToday = dateStr === todayStr
            const { type, label } = getDayInfo(year, month, day)

            return (
              <button key={i}
                onClick={() => { if (!isPast) setSelected(prev => prev === dateStr ? null : dateStr) }}
                disabled={isPast}
                className={`flex flex-col items-center justify-center rounded-xl py-1.5 text-xs transition-all min-h-[52px]
                  ${isPast ? 'cursor-default opacity-30' : 'cursor-pointer hover:opacity-80'}
                  ${isSelected ? 'text-white shadow-md' : ''}
                  ${type === 'weekly' && !isSelected ? 'border border-dashed border-amber-300' : ''}
                `}
                style={
                  isSelected ? { background: 'var(--color-primary)' }
                  : type === 'exception' ? { background: 'var(--color-primary-light)', color: 'var(--color-primary)' }
                  : type === 'weekly' ? { background: '#fffbeb' }
                  : {}
                }
              >
                <span className={`text-sm font-bold leading-none ${isToday && !isSelected ? 'underline decoration-dotted' : ''} ${type === 'weekly' && !isSelected ? 'text-amber-700' : ''}`}>
                  {day}
                </span>
                {label && (
                  <span className={`text-[8px] leading-tight mt-1 font-medium px-0.5 text-center ${isSelected ? 'text-white/80' : type === 'weekly' ? 'text-amber-600' : ''}`}
                    style={type === 'exception' && !isSelected ? { color: 'var(--color-primary)' } : {}}>
                    {label}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Time editor */}
      {selected && (
        <div className="bg-white rounded-2xl border shadow-sm p-5 space-y-4"
          style={{ borderColor: 'var(--color-primary)', boxShadow: '0 0 0 3px var(--color-primary-light)' }}>
          <div className="flex items-center justify-between">
            <p className="font-semibold text-gray-900 text-sm">
              {new Date(selected + 'T12:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' })}
            </p>
            {dateMap[selected] && (
              <button onClick={() => deleteDateMutation.mutate(selected)} disabled={deleteDateMutation.isPending}
                className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors">
                <Trash2 size={12} /> Günü kaldır
              </button>
            )}
          </div>

          <div className="space-y-2">
            {ranges.map((range, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Clock size={13} className="text-gray-400 flex-shrink-0" />
                <div className="flex items-center gap-2">
                  <input type="time" value={range.startTime} onChange={e => updateRange(idx, { startTime: e.target.value })}
                    className={`border rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:border-transparent ${hasRangeError(range) ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                    style={{ '--tw-ring-color': 'var(--color-primary)' } as React.CSSProperties} />
                  <span className="text-gray-300">—</span>
                  <input type="time" value={range.endTime} onChange={e => updateRange(idx, { endTime: e.target.value })}
                    className={`border rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:border-transparent ${hasRangeError(range) ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                    style={{ '--tw-ring-color': 'var(--color-primary)' } as React.CSSProperties} />
                </div>
                {ranges.length > 1 && (
                  <button onClick={() => removeRange(idx)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors">
                    <Trash2 size={13} />
                  </button>
                )}
                {hasRangeError(range) && <span className="text-xs text-red-500">Hatalı aralık</span>}
              </div>
            ))}
          </div>

          <button onClick={addRange}
            className="flex items-center gap-1.5 text-xs font-medium hover:opacity-70 transition-opacity"
            style={{ color: 'var(--color-primary)' }}>
            <Plus size={13} /> Aralık ekle
          </button>

          <div className="flex items-center gap-2 pt-1 border-t border-gray-50">
            <span className="text-xs text-gray-500 flex-shrink-0">Tekrarla:</span>
            <select
              value={repeatWeeks}
              onChange={e => setRepeatWeeks(Number(e.target.value))}
              className="border border-gray-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:border-transparent"
              style={{ '--tw-ring-color': 'var(--color-primary)' } as React.CSSProperties}
            >
              <option value={1}>Sadece bu gün</option>
              <option value={2}>2 hafta</option>
              <option value={3}>3 hafta</option>
              <option value={4}>4 hafta</option>
              <option value={6}>6 hafta</option>
              <option value={8}>8 hafta</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button onClick={() => saveMutation.mutate({ date: selected, ranges, repeatWeeks })}
              disabled={saveMutation.isPending || hasAnyError}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-opacity hover:opacity-90"
              style={{ background: 'var(--color-primary)' }}>
              <Check size={14} />
              {saveMutation.isPending ? 'Kaydediliyor…' : 'Kaydet'}
            </button>
            <button onClick={() => setSelected(null)}
              className="px-4 py-2 rounded-xl text-sm font-medium text-gray-500 border border-gray-200 hover:bg-gray-50 transition-colors">
              İptal
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-4 text-xs text-gray-500 px-1">
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded border border-dashed border-amber-300 bg-amber-50 inline-block" />
          Haftalık program
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded inline-block" style={{ background: 'var(--color-primary-light)' }} />
          Tarih bazlı
        </span>
      </div>
    </div>
  )
}
