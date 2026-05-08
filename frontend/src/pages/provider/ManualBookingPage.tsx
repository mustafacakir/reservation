import { useState } from 'react'
import { useQuery, useQueries, useMutation, useQueryClient } from '@tanstack/react-query'
import { Users, User, CalendarDays, Clock, ChevronRight, BookOpen, Banknote } from 'lucide-react'
import { apiClient } from '@/api/client'
import { providersApi } from '@/api/endpoints/providers.api'
import { useToast } from '@/components/ui/Toast'
import type { ServiceItem } from '@/types/provider.types'
import type { AvailableSlot } from '@/types/availability.types'

// ── Date helpers ──────────────────────────────────────────────────────────────

function getNext14Days(): Date[] {
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i)
    return d
  })
}

function toDateParam(d: Date) {
  return d.toISOString().split('T')[0]
}

const WEEKDAYS = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt']
const MONTHS   = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']

// ── Slot picker ───────────────────────────────────────────────────────────────

function SlotPicker({
  providerId, serviceId, durationMinutes, selectedStart, onSelect,
}: {
  providerId: string
  serviceId: string
  durationMinutes: number
  selectedStart: string | null
  onSelect: (startUtc: string, label: string) => void
}) {
  const days = getNext14Days()
  const [activeDay, setActiveDay] = useState(days[0])

  const dayQueries = useQueries({
    queries: days.map((d) => ({
      queryKey: ['slots', providerId, serviceId, toDateParam(d)],
      queryFn: () => providersApi.getAvailableSlots(providerId, serviceId, toDateParam(d)),
      staleTime: 0,
    })),
  })

  const activeDateStr = toDateParam(activeDay)
  const activeIdx = days.findIndex((d) => toDateParam(d) === activeDateStr)
  const slots: AvailableSlot[] = dayQueries[activeIdx]?.data ?? []
  const isLoading = dayQueries[activeIdx]?.isLoading ?? true

  const hasSlots: Record<string, boolean | undefined> = {}
  days.forEach((d, i) => {
    const q = dayQueries[i]
    if (!q.isLoading) hasSlots[toDateParam(d)] = (q.data?.length ?? 0) > 0
  })

  return (
    <div>
      {/* Date strip */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1">
        {days.map((d) => {
          const ds = toDateParam(d)
          const active = ds === activeDateStr
          const available = hasSlots[ds]
          const loading = hasSlots[ds] === undefined
          const disabled = !loading && available === false
          return (
            <button
              key={ds}
              disabled={disabled}
              onClick={() => { setActiveDay(d); onSelect('', '') }}
              className={[
                'flex-shrink-0 flex flex-col items-center w-12 py-2 rounded-xl text-xs font-medium transition-all',
                active ? 'text-white shadow-sm'
                  : disabled ? 'text-gray-300 bg-gray-50 cursor-not-allowed opacity-40'
                  : 'text-gray-600 bg-gray-50 hover:bg-gray-100',
              ].join(' ')}
              style={active ? { background: 'var(--color-primary)' } : {}}
            >
              <span className="text-[9px] uppercase tracking-wider opacity-75">{WEEKDAYS[d.getDay()]}</span>
              <span className="text-base font-bold leading-tight mt-0.5">{d.getDate()}</span>
              <span className="text-[9px] opacity-60">{MONTHS[d.getMonth()]}</span>
              {!disabled && !active && !loading && (
                <span className="w-1 h-1 rounded-full mt-1" style={{ background: 'var(--color-primary)' }} />
              )}
            </button>
          )
        })}
      </div>

      {/* Time slots */}
      <div className="mt-4">
        {isLoading ? (
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-12 rounded-xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : slots.length === 0 ? (
          <div className="py-8 text-center">
            <CalendarDays size={28} className="text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Bu gün müsait saat yok</p>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {slots.map((slot) => {
              const selected = slot.startUtc === selectedStart
              const full = slot.isFull
              return (
                <button
                  key={slot.startUtc}
                  disabled={full}
                  onClick={() => !full && onSelect(slot.startUtc, `${slot.startLocal} – ${slot.endLocal}`)}
                  className={[
                    'py-2.5 px-1 rounded-xl text-xs font-semibold border transition-all flex flex-col items-center gap-1',
                    full ? 'text-gray-300 border-gray-100 bg-gray-50 cursor-not-allowed'
                      : selected ? 'text-white border-transparent shadow-sm'
                      : 'text-gray-700 border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50',
                  ].join(' ')}
                  style={selected && !full ? { background: 'var(--color-primary)' } : {}}
                >
                  <span>{slot.startLocal}</span>
                  {slot.isGroup && slot.maxParticipants && (
                    <span
                      className="flex items-center gap-0.5 text-[9px] font-bold px-1 py-0.5 rounded"
                      style={full
                        ? { background: '#fee2e2', color: '#dc2626' }
                        : selected
                          ? { background: 'rgba(255,255,255,0.25)', color: '#fff' }
                          : { background: 'var(--color-primary-light)', color: 'var(--color-primary)' }
                      }
                    >
                      {full ? 'DOLU' : <><Users size={8} /> {slot.currentParticipants}/{slot.maxParticipants}</>}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}
        <p className="text-xs text-gray-400 mt-3 flex items-center gap-1.5">
          <Clock size={11} /> Her ders {durationMinutes} dakika
        </p>
      </div>
    </div>
  )
}

// ── Step indicator ────────────────────────────────────────────────────────────

function Step({ n, label, done, active }: { n: number; label: string; done: boolean; active: boolean }) {
  return (
    <div className={`flex items-center gap-2 text-sm font-medium ${active ? 'text-gray-900' : done ? 'text-gray-400' : 'text-gray-300'}`}>
      <span
        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
        style={done || active ? { background: 'var(--color-primary)', color: '#fff' } : { background: '#f3f4f6', color: '#9ca3af' }}
      >
        {done ? '✓' : n}
      </span>
      {label}
    </div>
  )
}

// ── Input helpers ─────────────────────────────────────────────────────────────

const inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent bg-white'
const inputStyle = { '--tw-ring-color': 'var(--color-primary)' } as React.CSSProperties

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ManualBookingPage() {
  const [serviceId, setServiceId] = useState('')
  const [selectedStart, setSelectedStart] = useState<string | null>(null)
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [notes, setNotes] = useState('')
  const qc = useQueryClient()
  const toast = useToast()

  const { data: services = [] } = useQuery<ServiceItem[]>({
    queryKey: ['myServices'],
    queryFn: () => apiClient.get('/services/me').then((r) => r.data),
  })

  const { data: myProfile } = useQuery({
    queryKey: ['myProfile'],
    queryFn: () => apiClient.get('/providers/me').then((r) => r.data as { providerId: string }),
  })

  const selectedService = services.find((s) => s.id === serviceId)
  const providerId = myProfile?.providerId

  const mutation = useMutation({
    mutationFn: () =>
      apiClient.post('/bookings/manual', {
        serviceId,
        startUtc: selectedStart,
        studentName: `${firstName.trim()} ${lastName.trim()}`.trim(),
        notes: notes || null,
      }),
    onSuccess: () => {
      toast.success(
        'Rezervasyon eklendi',
        `${firstName.trim()} ${lastName.trim()} · ${selectedLabel}`,
      )
      setFirstName('')
      setLastName('')
      setNotes('')
      qc.invalidateQueries({ queryKey: ['slots'], refetchType: 'all' })
      qc.invalidateQueries({ queryKey: ['providerBookings'] })
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message as string | undefined
      toast.error('Rezervasyon eklenemedi', msg ?? 'Lütfen tekrar deneyin.')
    },
  })

  const step1Done = !!serviceId
  const step2Done = !!selectedStart
  const step3Active = step1Done && step2Done
  const canSubmit = step1Done && step2Done && firstName.trim() && lastName.trim()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Rezervasyon Ekle</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Telefon veya mesaj ile aldığınız randevuyu sisteme ekleyin.
          </p>
        </div>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-3 flex-wrap">
        <Step n={1} label="Ders seç" done={step1Done} active={!step1Done} />
        <ChevronRight size={14} className="text-gray-200 flex-shrink-0" />
        <Step n={2} label="Tarih & saat" done={step2Done} active={step1Done && !step2Done} />
        <ChevronRight size={14} className="text-gray-200 flex-shrink-0" />
        <Step n={3} label="Öğrenci bilgisi" done={false} active={step3Active} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

        {/* Left column: service + student */}
        <div className="space-y-4">

          {/* Service select */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--color-primary-light)' }}>
                <BookOpen size={14} style={{ color: 'var(--color-primary)' }} />
              </div>
              <h2 className="text-sm font-semibold text-gray-800">Ders Seç</h2>
            </div>

            <div className="p-4 space-y-2">
              {services.length === 0 ? (
                <p className="text-xs text-amber-600 py-2">
                  Henüz ders eklenmemiş. Önce Derslerim sayfasından ders ekleyin.
                </p>
              ) : (
                services.map((s) => {
                  const active = serviceId === s.id
                  const Icon = s.sessionType === 'Group' ? Users : User
                  return (
                    <button
                      key={s.id}
                      onClick={() => { setServiceId(s.id); setSelectedStart(null); setSelectedLabel(null) }}
                      className={`w-full text-left p-3.5 rounded-xl border-2 transition-all flex items-center gap-3 ${
                        active ? '' : 'border-gray-100 hover:border-gray-200 bg-white'
                      }`}
                      style={active ? { borderColor: 'var(--color-primary)', background: 'var(--color-primary-light)' } : {}}
                    >
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={active ? { background: 'var(--color-primary)' } : { background: '#f3f4f6' }}
                      >
                        <Icon size={15} style={active ? { color: '#fff' } : { color: '#9ca3af' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={active ? { color: 'var(--color-primary)' } : { color: '#111827' }}>
                          {s.name}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {s.durationMinutes} dk
                          {s.sessionType === 'Group' && s.maxParticipants && ` · Maks. ${s.maxParticipants} kişi`}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-sm font-bold text-gray-900 flex-shrink-0">
                        <Banknote size={13} className="text-gray-400" />
                        ₺{Number(s.price).toLocaleString('tr-TR')}
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>

          {/* Student info */}
          <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${step3Active ? 'border-gray-100' : 'border-gray-100 opacity-50 pointer-events-none'}`}>
            <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--color-primary-light)' }}>
                <User size={14} style={{ color: 'var(--color-primary)' }} />
              </div>
              <h2 className="text-sm font-semibold text-gray-800">Öğrenci Bilgisi</h2>
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Ad *</label>
                  <input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Ali"
                    className={inputCls}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Soyad *</label>
                  <input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Yılmaz"
                    className={inputCls}
                    style={inputStyle}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                  Not <span className="font-normal text-gray-400">(isteğe bağlı)</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Konu, seviye veya özel not…"
                  rows={2}
                  className={`${inputCls} resize-none`}
                  style={inputStyle}
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !canSubmit}
            className="w-full py-3.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40 transition-opacity hover:opacity-90 shadow-sm"
            style={{ background: 'var(--color-primary)' }}
          >
            {mutation.isPending ? 'Kaydediliyor…' : 'Rezervasyonu Kaydet'}
          </button>
        </div>

        {/* Right column: calendar */}
        <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${step1Done ? 'border-gray-100' : 'border-gray-100 opacity-40 pointer-events-none'}`}>
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--color-primary-light)' }}>
                <CalendarDays size={14} style={{ color: 'var(--color-primary)' }} />
              </div>
              <h2 className="text-sm font-semibold text-gray-800">Tarih ve Saat</h2>
            </div>
            {selectedLabel && (
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
              >
                {selectedLabel}
              </span>
            )}
          </div>

          <div className="p-4">
            {step1Done && providerId && selectedService ? (
              <SlotPicker
                providerId={providerId}
                serviceId={serviceId}
                durationMinutes={selectedService.durationMinutes}
                selectedStart={selectedStart}
                onSelect={(start, label) => {
                  setSelectedStart(start || null)
                  setSelectedLabel(label || null)
                }}
              />
            ) : (
              <div className="py-12 text-center">
                <CalendarDays size={32} className="text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-gray-400">Önce bir ders seçin</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

