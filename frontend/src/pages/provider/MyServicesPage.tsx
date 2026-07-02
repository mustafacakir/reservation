import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, BookOpen, Users, User, Pencil, Trash2, X, Clock, Video, CalendarClock, ChevronRight, ChevronLeft, Check } from 'lucide-react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import EmojiPicker, { type EmojiClickData, Theme } from 'emoji-picker-react'
import { apiClient } from '@/api/client'
import type { ServiceItem } from '@/types/provider.types'

function toHHMM(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  return h > 0 ? `${h}s ${m > 0 ? m + 'dk' : ''}`.trim() : `${m}dk`
}

interface ServiceForm {
  name: string; description: string; durationMinutes: number
  price: number; currency: string; sessionType: 'Individual' | 'Group'
  maxParticipants: number | null; recurrenceWeeks: number | null
  scheduledStart: string | null
  scheduledEndTime: string | null
  zoomLink: string | null
  zoomMeetingId: string | null
  zoomPassword: string | null
  sortOrder: number
  seriesId: string | null
}

function utcToDatetimeLocal(utcStr: string): string {
  const d = new Date(utcStr)
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

function utcToTimeLocal(utcStr: string): string {
  const d = new Date(utcStr)
  return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', hour12: false })
}

const WEEKDAY_OPTIONS = [
  { label: 'Pzt', value: 1 },
  { label: 'Sal', value: 2 },
  { label: 'Çar', value: 3 },
  { label: 'Per', value: 4 },
  { label: 'Cum', value: 5 },
  { label: 'Cmt', value: 6 },
  { label: 'Paz', value: 0 },
]

function weekdayLabel(day: number): string {
  return WEEKDAY_OPTIONS.find((w) => w.value === day)?.label ?? ''
}

function groupServices(list: ServiceItem[]): ServiceItem[][] {
  const order: string[] = []
  const map = new Map<string, ServiceItem[]>()
  for (const s of list) {
    const key = (s as any).seriesId ?? s.id
    if (!map.has(key)) { map.set(key, []); order.push(key) }
    map.get(key)!.push(s)
  }
  return order.map((key) => map.get(key)!.slice().sort((a, b) => {
    const da = a.scheduledStart ? (new Date(a.scheduledStart).getDay() + 6) % 7 : 0
    const db = b.scheduledStart ? (new Date(b.scheduledStart).getDay() + 6) % 7 : 0
    return da - db
  }))
}

function withWeekday(scheduledStart: string, targetDay: number): string {
  const [datePart, timePart] = scheduledStart.split('T')
  const d = new Date(`${datePart}T00:00:00`)
  const diff = targetDay - d.getDay()
  d.setDate(d.getDate() + diff)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}T${timePart}`
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000

function expandFormOccurrences(f: ServiceForm): { startMs: number; endMs: number }[] {
  if (!f.scheduledStart || !f.scheduledEndTime) return []
  const datePart = f.scheduledStart.split('T')[0]
  const start = new Date(f.scheduledStart).getTime()
  const end = new Date(`${datePart}T${f.scheduledEndTime}`).getTime()
  if (end <= start) return []
  const weeks = f.recurrenceWeeks ?? 1
  return Array.from({ length: weeks }, (_, w) => ({ startMs: start + w * WEEK_MS, endMs: end + w * WEEK_MS }))
}

function expandServiceOccurrences(s: ServiceItem): { startMs: number; endMs: number }[] {
  if (!s.scheduledStart || !s.scheduledEnd) return []
  const start = new Date(s.scheduledStart).getTime()
  const end = new Date(s.scheduledEnd).getTime()
  const weeks = s.recurrenceWeeks ?? 1
  return Array.from({ length: weeks }, (_, w) => ({ startMs: start + w * WEEK_MS, endMs: end + w * WEEK_MS }))
}

function groupBlockInfo(durationMinutes: number, startStr: string, endTimeStr: string) {
  const [sh, sm] = startStr.split('T')[1]?.split(':').map(Number) ?? [0, 0]
  const [eh, em] = endTimeStr.split(':').map(Number)
  const blockMinutes = (eh * 60 + em) - (sh * 60 + sm)
  if (blockMinutes <= 0) return null
  const BREAK = 10
  const sessionCount = Math.floor((blockMinutes + BREAK) / (durationMinutes + BREAK))
  return { blockMinutes, sessionCount, breakMinutes: BREAK }
}

const emptyForm: ServiceForm = { name: '', description: '', durationMinutes: 60, price: 0, currency: 'TRY', sessionType: 'Individual', maxParticipants: null, recurrenceWeeks: null, scheduledStart: null, scheduledEndTime: null, zoomLink: null, zoomMeetingId: null, zoomPassword: null, sortOrder: 0, seriesId: null }
const inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent bg-white transition-colors'

const MONTH_NAMES = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']
const DAY_LABELS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']
const QUARTER_MINUTES = ['00', '15', '30', '45']

function toDateStr(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function getMonthCells(year: number, month: number): (number | null)[] {
  const startDow = (new Date(year, month, 1).getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  return [...Array(startDow).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
}

/** Always-visible month calendar for picking a single date (YYYY-MM-DD). */
function InlineCalendar({ value, onChange }: { value: string | null; onChange: (date: string) => void }) {
  const today = new Date()
  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate())
  const initial = value ? new Date(`${value}T00:00:00`) : today
  const [year, setYear] = useState(initial.getFullYear())
  const [month, setMonth] = useState(initial.getMonth())

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear((y) => y - 1) } else setMonth((m) => m - 1) }
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear((y) => y + 1) } else setMonth((m) => m + 1) }
  const cells = getMonthCells(year, month)
  const isPastMonth = year === today.getFullYear() && month === today.getMonth()

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3">
      <div className="flex items-center justify-between mb-2">
        <button type="button" onClick={prevMonth} disabled={isPastMonth} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed text-gray-500 transition-colors">
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-bold text-gray-800">{MONTH_NAMES[month]} {year}</span>
        <button type="button" onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
          <ChevronRight size={16} />
        </button>
      </div>
      <div className="grid grid-cols-7">
        {DAY_LABELS.map((d) => (
          <div key={d} className="text-center text-[10px] font-semibold text-gray-400 uppercase py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />
          const dateStr = toDateStr(year, month, day)
          const isPast = dateStr < todayStr
          const isSelected = dateStr === value
          const isToday = dateStr === todayStr
          return (
            <button
              key={i}
              type="button"
              disabled={isPast}
              onClick={() => onChange(dateStr)}
              className={[
                'flex items-center justify-center rounded-lg text-sm font-medium transition-all h-9',
                isPast ? 'text-gray-200 cursor-not-allowed'
                  : isSelected ? 'text-white shadow-sm'
                  : 'text-gray-700 hover:bg-gray-100',
                isToday && !isSelected ? 'underline decoration-dotted underline-offset-2' : '',
              ].join(' ')}
              style={isSelected ? { background: 'var(--color-primary)' } : {}}
            >
              {day}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/** Hour + quarter-hour minute selects (00/15/30/45) producing an HH:mm string. */
function QuarterTimeSelect({ value, onChange }: { value: string | null; onChange: (time: string) => void }) {
  const [h, m] = value ? value.split(':') : ['', '']
  return (
    <div className="grid grid-cols-2 gap-2">
      <select
        value={h}
        onChange={(e) => onChange(`${e.target.value}:${m || '00'}`)}
        className={inputCls}
      >
        <option value="" disabled>Saat</option>
        {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')).map((hh) => (
          <option key={hh} value={hh}>{hh}</option>
        ))}
      </select>
      <select
        value={m}
        onChange={(e) => onChange(`${h || '09'}:${e.target.value}`)}
        className={inputCls}
      >
        <option value="" disabled>Dakika</option>
        {QUARTER_MINUTES.map((mm) => (
          <option key={mm} value={mm}>{mm}</option>
        ))}
      </select>
    </div>
  )
}

interface GroupMember { id: string; scheduledStart: string }
interface EditGroupPayload {
  updates: { id: string; form: ServiceForm }[]
  toCreate: ServiceForm[]
  toDeleteIds: string[]
}

function ServiceFormPanel({ initial, title, onSave, onSaveMultiple, allowMultiDay, selfId, existingGroupMembers, onSaveEditGroup, existingServices, onCancel, isPending }: {
  initial: ServiceForm; title: string; onSave: (f: ServiceForm) => void
  onSaveMultiple?: (forms: ServiceForm[]) => void; allowMultiDay?: boolean
  selfId?: string; existingGroupMembers?: GroupMember[]; onSaveEditGroup?: (payload: EditGroupPayload) => void
  existingServices?: ServiceItem[]
  onCancel: () => void; isPending: boolean
}) {
  const [form, setForm] = useState<ServiceForm>(initial)
  const [extraDays, setExtraDays] = useState<number[]>(() => (existingGroupMembers ?? []).map((m) => new Date(m.scheduledStart).getDay()))
  const [conflictNames, setConflictNames] = useState<string[] | null>(null)
  const [step, setStep] = useState(1)
  const [lastPrice, setLastPrice] = useState(initial.price > 0 ? initial.price : 0)
  const [isFree, setIsFree] = useState(initial.price === 0)
  const set = (patch: Partial<ServiceForm>) => { setConflictNames(null); setForm((f) => ({ ...f, ...patch })) }
  const toggleExtraDay = (day: number) => { setConflictNames(null); setExtraDays((d) => d.includes(day) ? d.filter((x) => x !== day) : [...d, day]) }
  const isGroup = form.sessionType === 'Group'
  const canSave = form.name.trim() && form.price >= 0 && (!isGroup || ((form.maxParticipants ?? 0) > 0 && !!form.scheduledStart && !!form.scheduledEndTime))

  const step1Valid = form.name.trim().length > 0
  const step2Valid = !isGroup || (Boolean(form.maxParticipants && form.maxParticipants > 0) && !!form.scheduledStart && !!form.scheduledEndTime)
  const step3Valid = form.price >= 0
  const maxReachableStep = step1Valid ? (step2Valid ? (step3Valid ? 4 : 3) : 2) : 1
  const goToStep = (n: number) => { if (n <= maxReachableStep) setStep(n) }

  const computeDayForms = (): ServiceForm[] => {
    if (!form.scheduledStart) return [form]
    const anchorDay = new Date(`${form.scheduledStart.split('T')[0]}T00:00:00`).getDay()
    const days = [anchorDay, ...extraDays.filter((d) => d !== anchorDay)]
    if (days.length <= 1) return [form]
    return days.map((d) => d === anchorDay ? form : { ...form, scheduledStart: withWeekday(form.scheduledStart!, d) })
  }

  const findConflicts = (): string[] => {
    const candidateRanges = computeDayForms().flatMap(expandFormOccurrences)
    if (candidateRanges.length === 0) return []
    const excludeIds = new Set([...(selfId ? [selfId] : []), ...(existingGroupMembers ?? []).map((m) => m.id)])
    const names = new Set<string>()
    for (const s of existingServices ?? []) {
      if (excludeIds.has(s.id)) continue
      const ranges = expandServiceOccurrences(s)
      if (ranges.some((r) => candidateRanges.some((c) => c.startMs < r.endMs && c.endMs > r.startMs))) {
        names.add(s.name)
      }
    }
    return Array.from(names)
  }

  const handleSaveClick = () => {
    if (!conflictNames) {
      const conflicts = findConflicts()
      if (conflicts.length > 0) {
        setConflictNames(conflicts)
        return
      }
    }
    executeSave()
  }

  const executeSave = () => {
    if (onSaveEditGroup && selfId && form.scheduledStart) {
      const anchorDay = new Date(`${form.scheduledStart.split('T')[0]}T00:00:00`).getDay()
      const selectedDays = [anchorDay, ...extraDays.filter((d) => d !== anchorDay)]
      const seriesId = form.seriesId ?? crypto.randomUUID()
      const baseForm = { ...form, seriesId }

      const othersByDay = new Map<number, GroupMember>()
      for (const m of existingGroupMembers ?? []) othersByDay.set(new Date(m.scheduledStart).getDay(), m)

      const updates: { id: string; form: ServiceForm }[] = [{ id: selfId, form: baseForm }]
      const toCreate: ServiceForm[] = []
      for (const day of selectedDays) {
        if (day === anchorDay) continue
        const dayForm = { ...baseForm, scheduledStart: withWeekday(form.scheduledStart, day) }
        const existing = othersByDay.get(day)
        if (existing) updates.push({ id: existing.id, form: dayForm })
        else toCreate.push(dayForm)
      }
      const selectedSet = new Set(selectedDays)
      const toDeleteIds = (existingGroupMembers ?? [])
        .filter((m) => !selectedSet.has(new Date(m.scheduledStart).getDay()))
        .map((m) => m.id)

      onSaveEditGroup({ updates, toCreate, toDeleteIds })
    } else if (allowMultiDay && onSaveMultiple && extraDays.length > 0 && form.scheduledStart) {
      const anchorDay = new Date(`${form.scheduledStart.split('T')[0]}T00:00:00`).getDay()
      const days = [anchorDay, ...extraDays.filter((d) => d !== anchorDay)]
      const seriesId = crypto.randomUUID()
      const forms = days.map((d) => ({
        ...(d === anchorDay ? form : { ...form, scheduledStart: withWeekday(form.scheduledStart!, d) }),
        seriesId,
      }))
      onSaveMultiple(forms)
    } else {
      onSave(form)
    }
  }

  const [showEmoji, setShowEmoji] = useState(false)
  const emojiRef = useRef<HTMLDivElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Ders içeriğini kısaca açıklayın…' }),
    ],
    content: initial.description || '',
    onUpdate: ({ editor }) => {
      set({ description: editor.getHTML() })
    },
  })

  useEffect(() => {
    if (editor && initial.description !== undefined) {
      const current = editor.getHTML()
      if (current !== initial.description) {
        editor.commands.setContent(initial.description || '')
      }
    }
  }, [initial.description, editor])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setShowEmoji(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleEmojiClick = (data: EmojiClickData) => {
    editor?.chain().focus().insertContent(data.emoji).run()
    setShowEmoji(false)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-4">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
        <h2 className="font-semibold text-gray-900">{title}</h2>
        <button onClick={onCancel} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
          <X size={16} />
        </button>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 px-5 pt-4">
        {[
          { n: 1, label: 'Temel Bilgiler' },
          { n: 2, label: 'Tür & Program' },
          { n: 3, label: 'Süre & Ücret' },
          { n: 4, label: 'Ek Bilgiler' },
        ].map(({ n, label }, i) => {
          const reachable = n <= maxReachableStep
          const done = n < step
          const active = n === step
          return (
            <div key={n} className="flex items-center gap-2 flex-1">
              <button
                type="button"
                onClick={() => goToStep(n)}
                disabled={!reachable}
                className="flex items-center gap-2 group"
              >
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors"
                  style={
                    active ? { background: 'var(--color-primary)', color: '#fff' }
                    : done ? { background: 'var(--color-primary-light)', color: 'var(--color-primary)' }
                    : { background: '#f3f4f6', color: '#9ca3af' }
                  }
                >
                  {done ? <Check size={12} /> : n}
                </span>
                <span className={`text-xs font-medium hidden sm:inline ${active ? 'text-gray-900' : 'text-gray-400'} ${reachable && !active ? 'group-hover:text-gray-600' : ''}`}>
                  {label}
                </span>
              </button>
              {i < 3 && <div className="flex-1 h-px" style={{ background: n < step ? 'var(--color-primary-light)' : '#f3f4f6' }} />}
            </div>
          )
        })}
      </div>

      <div className="p-5 space-y-6">
        {/* Adım 1: Temel bilgiler */}
        {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Ders Adı *</label>
            <input type="text" value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="ör. Ortaokul Matematik" className={inputCls} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Açıklama</label>

            {/* Toolbar */}
            <div className="flex items-center gap-1 flex-wrap border border-gray-200 rounded-t-xl px-2 py-1.5 bg-gray-50">
              <button type="button" onClick={() => editor?.chain().focus().toggleBold().run()}
                className={`px-2.5 py-1 rounded-lg text-sm font-bold transition-colors ${editor?.isActive('bold') ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-800 hover:bg-white'}`}>B</button>
              <button type="button" onClick={() => editor?.chain().focus().toggleItalic().run()}
                className={`px-2.5 py-1 rounded-lg text-sm italic transition-colors ${editor?.isActive('italic') ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-800 hover:bg-white'}`}>I</button>
              <button type="button" onClick={() => editor?.chain().focus().toggleBulletList().run()}
                className={`px-2.5 py-1 rounded-lg text-sm transition-colors ${editor?.isActive('bulletList') ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-800 hover:bg-white'}`}>• Liste</button>
              <button type="button" onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                className={`px-2.5 py-1 rounded-lg text-sm transition-colors ${editor?.isActive('orderedList') ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-800 hover:bg-white'}`}>1. Liste</button>
              <div className="w-px h-5 bg-gray-200 mx-1" />
              <div ref={emojiRef} className="relative">
                <button type="button" onClick={() => setShowEmoji((v) => !v)}
                  className="px-2.5 py-1 rounded-lg text-sm transition-colors text-gray-500 hover:text-gray-800 hover:bg-white" title="Emoji ekle">😊</button>
                {showEmoji && (
                  <div className="absolute left-0 top-9 z-50">
                    <EmojiPicker onEmojiClick={handleEmojiClick} theme={Theme.LIGHT} height={380} width={320} searchPlaceholder="Emoji ara…" />
                  </div>
                )}
              </div>
            </div>

            {/* Editor area */}
            <div
              className="min-h-[180px] border border-t-0 border-gray-200 rounded-b-xl px-3 py-2.5 text-sm focus-within:ring-2 focus-within:ring-[var(--color-primary)] focus-within:border-transparent cursor-text"
              onClick={() => editor?.commands.focus()}
            >
              <EditorContent editor={editor} />
            </div>
            <style>{`
              .tiptap p.is-editor-empty:first-child::before {
                content: attr(data-placeholder);
                float: left; color: #9ca3af; pointer-events: none; height: 0;
              }
              .tiptap:focus { outline: none; }
              .tiptap ul { list-style-type: disc; padding-left: 1.25rem; }
              .tiptap ol { list-style-type: decimal; padding-left: 1.25rem; }
              .tiptap strong { font-weight: 700; }
              .tiptap em { font-style: italic; }
            `}</style>
          </div>
        </div>
        )}

        {/* Adım 2: Tür & Program */}
        {step === 2 && (
        <>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Ders Türü</label>
            <div className="grid grid-cols-2 gap-2">
              {(['Individual', 'Group'] as const).map((type) => {
                const active = form.sessionType === type
                const Icon = type === 'Individual' ? User : Users
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => set({ sessionType: type, maxParticipants: type === 'Group' ? 10 : null })}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border-2 transition-all ${
                      active ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                    style={active ? { background: 'var(--color-primary-light)' } : { background: '#fff' }}
                  >
                    <Icon size={15} />
                    {type === 'Individual' ? 'Bireysel' : 'Grup'}
                  </button>
                )
              })}
            </div>
          </div>

          {isGroup && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Kontenjan *</label>
              <input type="number" min={2} max={500} value={form.maxParticipants ?? 10} onChange={(e) => set({ maxParticipants: parseInt(e.target.value) || 10 })} className={inputCls} />
              <p className="text-xs text-gray-400 mt-1">Kontenjan dolduğunda yeni rezervasyon alınamaz.</p>
            </div>
          )}
        </div>

        {/* Ders programı */}
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-4">
          <div className="flex items-center gap-2">
            <CalendarClock size={14} style={{ color: 'var(--color-primary)' }} />
            <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Ders Programı</span>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Tarih {isGroup ? '*' : <span className="text-gray-400">(isteğe bağlı)</span>}
            </label>
            <InlineCalendar
              value={form.scheduledStart ? form.scheduledStart.split('T')[0] : null}
              onChange={(date) => {
                const time = form.scheduledStart ? form.scheduledStart.split('T')[1] : '09:00'
                set({ scheduledStart: `${date}T${time}` })
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Başlangıç Saati {isGroup ? '*' : ''}
              </label>
              <QuarterTimeSelect
                value={form.scheduledStart ? form.scheduledStart.split('T')[1] : null}
                onChange={(time) => {
                  const today = new Date()
                  const date = form.scheduledStart ? form.scheduledStart.split('T')[0] : toDateStr(today.getFullYear(), today.getMonth(), today.getDate())
                  set({ scheduledStart: `${date}T${time}` })
                }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Bitiş Saati {isGroup ? '*' : ''}
              </label>
              <QuarterTimeSelect value={form.scheduledEndTime} onChange={(time) => set({ scheduledEndTime: time })} />
            </div>
          </div>

          {(allowMultiDay || onSaveEditGroup) && form.scheduledStart && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Ek Günler (aynı saatte)</label>
              <div className="grid grid-cols-7 gap-1.5">
                {WEEKDAY_OPTIONS.map(({ label, value }) => {
                  const anchorDay = new Date(`${form.scheduledStart!.split('T')[0]}T00:00:00`).getDay()
                  const isAnchor = value === anchorDay
                  const active = isAnchor || extraDays.includes(value)
                  return (
                    <button
                      key={value}
                      type="button"
                      disabled={isAnchor}
                      onClick={() => toggleExtraDay(value)}
                      className={`py-2 rounded-lg text-xs font-medium border-2 transition-all bg-white ${active ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-gray-200 text-gray-500 hover:border-gray-300'} ${isAnchor ? 'opacity-70 cursor-default' : ''}`}
                      style={active ? { background: 'var(--color-primary-light)' } : {}}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
              <p className="text-xs text-gray-400 mt-1">Başlangıç tarihinin günü otomatik seçilidir. Diğer günleri işaretleyin — her gün için ayrı bir ders kaydı oluşturulur.</p>
            </div>
          )}

          {isGroup && (() => {
            if (!form.scheduledStart || !form.scheduledEndTime) return null
            const info = groupBlockInfo(form.durationMinutes, form.scheduledStart, form.scheduledEndTime)
            if (!info || info.sessionCount <= 0) return (
              <p className="text-xs text-red-500">Bitiş saati başlangıçtan sonra olmalı.</p>
            )
            return (
              <div className="px-3 py-2.5 rounded-xl bg-blue-50 border border-blue-100 text-xs text-blue-800">
                <strong>{info.sessionCount} seans</strong> × {form.durationMinutes} dk
                {info.breakMinutes > 0 && <> (aralarında {info.breakMinutes} dk mola)</>}
                {' '}→ toplam {info.blockMinutes} dk
              </div>
            )
          })()}

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Tekrar</label>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => set({ recurrenceWeeks: null })}
                className={`px-3 py-2.5 rounded-xl text-sm font-medium border-2 transition-all bg-white ${!form.recurrenceWeeks ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-gray-200 text-gray-500'}`}
                style={!form.recurrenceWeeks ? { background: 'var(--color-primary-light)' } : {}}>
                Tek seferlik
              </button>
              <button type="button" onClick={() => set({ recurrenceWeeks: 4 })}
                className={`px-3 py-2.5 rounded-xl text-sm font-medium border-2 transition-all bg-white ${form.recurrenceWeeks ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-gray-200 text-gray-500'}`}
                style={form.recurrenceWeeks ? { background: 'var(--color-primary-light)' } : {}}>
                Haftalık tekrar
              </button>
            </div>
            {form.recurrenceWeeks && (
              <>
                <input type="number" min={2} max={52} value={form.recurrenceWeeks}
                  onChange={(e) => set({ recurrenceWeeks: parseInt(e.target.value) || 4 })} className={`${inputCls} mt-2`} />
                <p className="text-xs text-gray-400 mt-1">Aynı gün ve saatte {form.recurrenceWeeks} hafta boyunca tekrarlanır.</p>
              </>
            )}
          </div>
        </div>
        </>
        )}

        {/* Adım 3: Süre & Ücret */}
        {step === 3 && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Süre (dakika)</label>
            <input type="number" min={5} max={480} value={form.durationMinutes}
              onChange={(e) => set({ durationMinutes: parseInt(e.target.value) || 60 })} placeholder="50" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Ücret (₺) *</label>
            <input
              type="number"
              value={form.price}
              disabled={isFree}
              onChange={(e) => { const v = parseFloat(e.target.value) || 0; setLastPrice(v); set({ price: v }) }}
              className={`${inputCls} ${isFree ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
            <label className="flex items-center gap-2 mt-2 text-xs font-medium text-gray-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isFree}
                onChange={(e) => {
                  const checked = e.target.checked
                  setIsFree(checked)
                  if (checked) { setLastPrice(form.price || lastPrice); set({ price: 0 }) }
                  else { set({ price: lastPrice > 0 ? lastPrice : form.price }) }
                }}
                className="rounded border-gray-300"
                style={{ accentColor: 'var(--color-primary)' }}
              />
              Ücretsiz ders
            </label>
          </div>
        </div>
        )}

        {/* Adım 4: Ek Bilgiler — sıra numarası + Zoom */}
        {step === 4 && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Sıra Numarası</label>
            <input type="number" min={0} value={form.sortOrder} onChange={(e) => set({ sortOrder: parseInt(e.target.value) || 0 })} placeholder="0" className={inputCls} />
            <p className="text-xs text-gray-400 mt-1">Küçük numara önce görünür. Aynı numara varsa isme göre sıralanır.</p>
          </div>

          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Video size={14} style={{ color: 'var(--color-primary)' }} />
              <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Zoom Bilgileri</span>
              <span className="text-[10px] text-gray-400 font-normal normal-case">(rezervasyon onayında öğrenciye gönderilir)</span>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Meeting Linki</label>
              <input type="url" value={form.zoomLink ?? ''} onChange={(e) => set({ zoomLink: e.target.value || null })} placeholder="https://zoom.us/j/..." className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Meeting ID</label>
                <input type="text" value={form.zoomMeetingId ?? ''} onChange={(e) => set({ zoomMeetingId: e.target.value || null })} placeholder="123 456 7890" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Şifre</label>
                <input type="text" value={form.zoomPassword ?? ''} onChange={(e) => set({ zoomPassword: e.target.value || null })} placeholder="abc123" className={inputCls} />
              </div>
            </div>
          </div>
        </div>
        )}
      </div>

      {step === 4 && conflictNames && conflictNames.length > 0 && (
        <div className="px-5 pb-3">
          <div className="px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
            <strong>Saat çakışması:</strong> "{conflictNames.join('", "')}" dersiyle çakışıyor. Yine de kaydetmek için tekrar "Yine de Kaydet"e basın.
          </div>
        </div>
      )}

      <div className="flex gap-2 px-5 pb-5">
        {step > 1 && (
          <button
            onClick={() => setStep((s) => s - 1)}
            className="flex items-center gap-1 px-4 py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft size={15} /> Geri
          </button>
        )}
        {step < 4 ? (
          <button
            onClick={() => setStep((s) => Math.min(4, s + 1))}
            disabled={step === 1 ? !step1Valid : step === 2 ? !step2Valid : !step3Valid}
            className="flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-opacity hover:opacity-90"
            style={{ background: 'var(--color-primary)' }}
          >
            İleri <ChevronRight size={15} />
          </button>
        ) : (
          <button
            onClick={handleSaveClick}
            disabled={isPending || !canSave}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-opacity hover:opacity-90"
            style={{ background: conflictNames ? '#d97706' : 'var(--color-primary)' }}
          >
            {isPending ? 'Kaydediliyor…' : conflictNames ? 'Yine de Kaydet' : 'Kaydet'}
          </button>
        )}
        <button onClick={onCancel} className="px-4 py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
          İptal
        </button>
      </div>
    </div>
  )
}

export default function MyServicesPage() {
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const { data: services = [] } = useQuery<ServiceItem[]>({
    queryKey: ['myServices'],
    queryFn: () => apiClient.get('/services/me').then((r) => r.data),
  })

  const toPayload = (f: ServiceForm) => {
    let scheduledEnd: string | null = null
    if (f.scheduledStart && f.scheduledEndTime) {
      const datePart = f.scheduledStart.split('T')[0]
      scheduledEnd = new Date(`${datePart}T${f.scheduledEndTime}`).toISOString()
    }
    return {
      ...f,
      scheduledStart: f.scheduledStart ? new Date(f.scheduledStart).toISOString() : null,
      scheduledEnd,
      scheduledEndTime: undefined,
    }
  }

  const createMutation = useMutation({
    mutationFn: (f: ServiceForm) => apiClient.post('/services', toPayload(f)).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['myServices'] }); setShowCreate(false) },
  })
  const createManyMutation = useMutation({
    mutationFn: (forms: ServiceForm[]) => Promise.all(forms.map((f) => apiClient.post('/services', toPayload(f)))),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['myServices'] }); setShowCreate(false) },
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, ...f }: ServiceForm & { id: string }) => apiClient.put(`/services/${id}`, toPayload(f)).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['myServices'] }); setEditingId(null) },
  })
  const updateGroupMutation = useMutation({
    mutationFn: ({ updates, toCreate, toDeleteIds }: { updates: { id: string; form: ServiceForm }[]; toCreate: ServiceForm[]; toDeleteIds: string[] }) =>
      Promise.all([
        ...updates.map(({ id, form }) => apiClient.put(`/services/${id}`, toPayload(form))),
        ...toCreate.map((form) => apiClient.post('/services', toPayload(form))),
        ...toDeleteIds.map((id) => apiClient.delete(`/services/${id}`)),
      ]),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['myServices'] }); setEditingId(null) },
  })
  const deleteGroupMutation = useMutation({
    mutationFn: (ids: string[]) => Promise.all(ids.map((id) => apiClient.delete(`/services/${id}`))),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['myServices'] }); setDeletingId(null) },
  })

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Derslerim</h1>
          <p className="text-sm text-gray-400 mt-0.5">Sunduğunuz hizmetleri yönetin</p>
        </div>
        {!showCreate && (
          <button
            onClick={() => { setShowCreate(true); setEditingId(null) }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 shadow-sm"
            style={{ background: 'var(--color-primary)' }}
          >
            <Plus size={15} /> Yeni Ders
          </button>
        )}
      </div>

      {showCreate && (
        <ServiceFormPanel
          title="Yeni Ders Ekle"
          initial={emptyForm}
          allowMultiDay
          existingServices={services}
          onSave={(f) => createMutation.mutate(f)}
          onSaveMultiple={(forms) => createManyMutation.mutate(forms)}
          onCancel={() => setShowCreate(false)}
          isPending={createMutation.isPending || createManyMutation.isPending}
        />
      )}

      {!showCreate && (
      <div className="space-y-3">
        {groupServices(services).map((group) => {
          const s = group[0]
          const isMultiDay = group.length > 1
          const daysLabel = isMultiDay
            ? group.filter((m) => m.scheduledStart).map((m) => weekdayLabel(new Date(m.scheduledStart!).getDay())).join(', ')
            : null
          const totalBookings = group.reduce((sum, m) => sum + ((m as any).totalBookings ?? 0), 0)

          return editingId === s.id ? (
            <ServiceFormPanel
              key={s.id}
              title="Dersi Düzenle"
              initial={{ name: s.name, description: s.description, durationMinutes: s.durationMinutes, price: Number(s.price), currency: 'TRY', sessionType: s.sessionType === 'Group' ? 'Group' : 'Individual', maxParticipants: s.maxParticipants ?? null, recurrenceWeeks: s.recurrenceWeeks ?? null, scheduledStart: s.scheduledStart ? utcToDatetimeLocal(s.scheduledStart) : null, scheduledEndTime: s.scheduledEnd ? utcToTimeLocal(s.scheduledEnd) : null, zoomLink: s.zoomLink ?? null, zoomMeetingId: s.zoomMeetingId ?? null, zoomPassword: s.zoomPassword ?? null, sortOrder: (s as any).sortOrder ?? 0, seriesId: (s as any).seriesId ?? null }}
              allowMultiDay
              selfId={s.id}
              existingGroupMembers={group.filter((m) => m.id !== s.id && m.scheduledStart).map((m) => ({ id: m.id, scheduledStart: m.scheduledStart! }))}
              existingServices={services}
              onSave={(f) => updateMutation.mutate({ id: s.id, ...f })}
              onSaveEditGroup={(payload) => updateGroupMutation.mutate(payload)}
              onCancel={() => setEditingId(null)}
              isPending={updateMutation.isPending || updateGroupMutation.isPending}
            />
          ) : (
            <div key={s.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {deletingId === s.id ? (
                <div className="p-4 flex items-center gap-4 bg-red-50 border-red-100">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">{s.name}</p>
                    <p className="text-xs text-red-600 mt-0.5">
                      {isMultiDay
                        ? `Bu ders ${group.length} güne ait kayıtlarıyla (${daysLabel}) birlikte silinecek. Emin misiniz?`
                        : 'Bu dersi silmek istediğinize emin misiniz?'}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => deleteGroupMutation.mutate(group.map((m) => m.id))} disabled={deleteGroupMutation.isPending} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500 text-white hover:bg-red-600 disabled:opacity-60 transition-colors">
                      {deleteGroupMutation.isPending ? '…' : 'Sil'}
                    </button>
                    <button onClick={() => setDeletingId(null)} className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors">
                      Vazgeç
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--color-primary-light)' }}>
                        {(s as any).sessionType === 'Group'
                          ? <Users size={16} style={{ color: 'var(--color-primary)' }} />
                          : <User size={16} style={{ color: 'var(--color-primary)' }} />
                        }
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-gray-900 text-sm">{s.name}</p>
                          {(s as any).sessionType === 'Group' && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md" style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
                              GRUP
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <Clock size={10} /> {toHHMM(s.durationMinutes)}
                          </span>
                          {(s as any).sessionType === 'Group' && (s as any).maxParticipants && (
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                              <Users size={10} /> {totalBookings}/{(s as any).maxParticipants} kişi
                            </span>
                          )}
                          {(s as any).scheduledStart && (
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                              {!isMultiDay && <>{new Date((s as any).scheduledStart).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}{' '}</>}
                              {new Date((s as any).scheduledStart).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                              {(s as any).scheduledEnd && `–${new Date((s as any).scheduledEnd).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`}
                              {isMultiDay && daysLabel && ` · ${daysLabel}`}
                              {(s as any).recurrenceWeeks && ` · ${(s as any).recurrenceWeeks} hafta`}
                            </span>
                          )}
                          {s.zoomLink && (
                            <span className="flex items-center gap-1 text-xs font-medium" style={{ color: 'var(--color-primary)' }}>
                              <Video size={10} /> Zoom bağlı
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-bold text-gray-900 text-sm">₺{Number(s.price).toLocaleString('tr-TR')}</span>
                      <button onClick={() => { setEditingId(s.id); setShowCreate(false) }} className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors" title="Düzenle">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => setDeletingId(s.id)} className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Sil">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {services.length === 0 && !showCreate && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 text-center">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: 'var(--color-primary-light)' }}>
              <BookOpen size={22} style={{ color: 'var(--color-primary)' }} />
            </div>
            <p className="text-sm font-semibold text-gray-700 mb-1">Henüz ders eklenmemiş</p>
            <p className="text-xs text-gray-400 mb-4">İlk dersinizi ekleyerek rezervasyon almaya başlayın.</p>
            <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: 'var(--color-primary)' }}>
              <Plus size={14} /> Ders Ekle
            </button>
          </div>
        )}
      </div>
      )}
    </div>
  )
}
