import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import type { ServiceItem } from '@/types/provider.types'

interface ManualBookingForm {
  serviceId: string
  studentName: string
  notes: string
  date: string
  time: string
}

const emptyForm: ManualBookingForm = { serviceId: '', studentName: '', notes: '', date: '', time: '' }

export default function ManualBookingPage() {
  const [form, setForm] = useState<ManualBookingForm>(emptyForm)
  const set = (patch: Partial<ManualBookingForm>) => setForm((f) => ({ ...f, ...patch }))

  const { data: services = [] } = useQuery<ServiceItem[]>({
    queryKey: ['myServices'],
    queryFn: () => apiClient.get('/services/me').then((r) => r.data),
  })

  const mutation = useMutation({
    mutationFn: (f: ManualBookingForm) => {
      const startUtc = new Date(`${f.date}T${f.time}:00`).toISOString()
      return apiClient.post('/bookings/manual', {
        serviceId: f.serviceId,
        startUtc,
        studentName: f.studentName,
        notes: f.notes || null,
      })
    },
    onSuccess: () => setForm(emptyForm),
  })

  const canSubmit = form.serviceId && form.studentName && form.date && form.time

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Rezervasyon Ekle</h1>
        <p className="text-sm text-gray-500 mt-0.5">WhatsApp veya telefon ile aldığınız randevuyu sisteme ekleyin.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ders</label>
          <select
            value={form.serviceId}
            onChange={(e) => set({ serviceId: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
            style={{ '--tw-ring-color': 'var(--color-primary)' } as React.CSSProperties}
          >
            <option value="">Ders seçin…</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} — {s.durationMinutes} dk · ₺{Number(s.price).toLocaleString('tr-TR')}
              </option>
            ))}
          </select>
          {services.length === 0 && (
            <p className="text-xs text-amber-600 mt-1">Henüz ders eklenmemiş. Önce Derslerim sayfasından ders ekleyin.</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Öğrenci Adı</label>
          <input
            value={form.studentName}
            onChange={(e) => set({ studentName: e.target.value })}
            placeholder="ör. Ali Yılmaz"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
            style={{ '--tw-ring-color': 'var(--color-primary)' } as React.CSSProperties}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tarih</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => set({ date: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
              style={{ '--tw-ring-color': 'var(--color-primary)' } as React.CSSProperties}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Saat</label>
            <input
              type="time"
              value={form.time}
              onChange={(e) => set({ time: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
              style={{ '--tw-ring-color': 'var(--color-primary)' } as React.CSSProperties}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Not (isteğe bağlı)</label>
          <textarea
            value={form.notes}
            onChange={(e) => set({ notes: e.target.value })}
            placeholder="Konu, seviye veya özel not…"
            rows={3}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:border-transparent"
            style={{ '--tw-ring-color': 'var(--color-primary)' } as React.CSSProperties}
          />
        </div>

        {mutation.isError && (
          <p className="text-sm text-red-500">Rezervasyon eklenemedi. Saat çakışması olabilir.</p>
        )}
        {mutation.isSuccess && (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
            <span className="text-emerald-500">✓</span>
            <p className="text-sm text-emerald-700 font-medium">Rezervasyon başarıyla eklendi!</p>
          </div>
        )}

        <button
          onClick={() => mutation.mutate(form)}
          disabled={mutation.isPending || !canSubmit}
          className="w-full py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60 transition-opacity hover:opacity-90"
          style={{ background: 'var(--color-primary)' }}
        >
          {mutation.isPending ? 'Kaydediliyor…' : 'Rezervasyonu Kaydet'}
        </button>
      </div>
    </div>
  )
}
