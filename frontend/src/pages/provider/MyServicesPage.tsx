import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, BookOpen } from 'lucide-react'
import { apiClient } from '@/api/client'
import type { ServiceItem } from '@/types/provider.types'

interface ServiceForm {
  name: string
  description: string
  durationMinutes: number
  price: number
  currency: string
}

const emptyForm: ServiceForm = { name: '', description: '', durationMinutes: 60, price: 0, currency: 'TRY' }

function ServiceFormCard({
  initial,
  title,
  onSave,
  onCancel,
  isPending,
}: {
  initial: ServiceForm
  title: string
  onSave: (f: ServiceForm) => void
  onCancel: () => void
  isPending: boolean
}) {
  const [form, setForm] = useState<ServiceForm>(initial)
  const set = (patch: Partial<ServiceForm>) => setForm((f) => ({ ...f, ...patch }))

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
      <h2 className="font-semibold text-gray-900 mb-4">{title}</h2>
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ders Adı</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => set({ name: e.target.value })}
            placeholder="ör. Ortaokul Matematik Dersi"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
            style={{ '--tw-ring-color': 'var(--color-primary)' } as React.CSSProperties}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
          <textarea
            value={form.description}
            onChange={(e) => set({ description: e.target.value })}
            placeholder="Ders içeriğini kısaca açıklayın…"
            rows={2}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent resize-none"
            style={{ '--tw-ring-color': 'var(--color-primary)' } as React.CSSProperties}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Süre (dakika)</label>
            <input
              type="number"
              value={form.durationMinutes}
              onChange={(e) => set({ durationMinutes: parseInt(e.target.value) || 60 })}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
              style={{ '--tw-ring-color': 'var(--color-primary)' } as React.CSSProperties}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ücret (₺)</label>
            <input
              type="number"
              value={form.price}
              onChange={(e) => set({ price: parseFloat(e.target.value) || 0 })}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
              style={{ '--tw-ring-color': 'var(--color-primary)' } as React.CSSProperties}
            />
          </div>
        </div>
      </div>
      <div className="flex gap-2 mt-5">
        <button
          onClick={() => onSave(form)}
          disabled={isPending || !form.name.trim()}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60 transition-opacity hover:opacity-90"
          style={{ background: 'var(--color-primary)' }}
        >
          {isPending ? 'Kaydediliyor…' : 'Kaydet'}
        </button>
        <button
          onClick={onCancel}
          className="px-5 py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50"
        >
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

  const createMutation = useMutation({
    mutationFn: (f: ServiceForm) => apiClient.post('/services', f).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['myServices'] }); setShowCreate(false) },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, ...f }: ServiceForm & { id: string }) =>
      apiClient.put(`/services/${id}`, f).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['myServices'] }); setEditingId(null) },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/services/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['myServices'] }); setDeletingId(null) },
  })

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Derslerim</h1>
          <p className="text-sm text-gray-500 mt-0.5">Sunduğunuz ders türlerini yönetin.</p>
        </div>
        {!showCreate && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: 'var(--color-primary)' }}
          >
            <Plus size={16} />
            Ders Ekle
          </button>
        )}
      </div>

      {showCreate && (
        <ServiceFormCard
          title="Yeni Ders"
          initial={emptyForm}
          onSave={(f) => createMutation.mutate(f)}
          onCancel={() => setShowCreate(false)}
          isPending={createMutation.isPending}
        />
      )}

      <div className="space-y-3">
        {services.map((s) =>
          editingId === s.id ? (
            <ServiceFormCard
              key={s.id}
              title="Dersi Düzenle"
              initial={{ name: s.name, description: s.description, durationMinutes: s.durationMinutes, price: Number(s.price), currency: 'TRY' }}
              onSave={(f) => updateMutation.mutate({ id: s.id, ...f })}
              onCancel={() => setEditingId(null)}
              isPending={updateMutation.isPending}
            />
          ) : (
            <div key={s.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              {deletingId === s.id ? (
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">{s.name}</span> silinsin mi?
                  </p>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => deleteMutation.mutate(s.id)}
                      disabled={deleteMutation.isPending}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500 text-white hover:bg-red-600 disabled:opacity-60"
                    >
                      {deleteMutation.isPending ? '…' : 'Evet, Sil'}
                    </button>
                    <button
                      onClick={() => setDeletingId(null)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 text-gray-600 hover:bg-gray-50"
                    >
                      Vazgeç
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900">{s.name}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{s.durationMinutes} dakika · {s.description}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <p className="font-bold text-gray-900">₺{Number(s.price).toLocaleString('tr-TR')}</p>
                    <button
                      onClick={() => setEditingId(s.id)}
                      className="text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors"
                      style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
                    >
                      Düzenle
                    </button>
                    <button
                      onClick={() => setDeletingId(s.id)}
                      className="text-xs px-2.5 py-1.5 rounded-lg font-medium text-red-500 bg-red-50 hover:bg-red-100 transition-colors"
                    >
                      Sil
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        )}
        {services.length === 0 && !showCreate && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-12 text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: 'var(--color-primary-light, #ede9fe)' }}>
              <BookOpen size={24} style={{ color: 'var(--color-primary)' }} />
            </div>
            <p className="text-sm font-medium text-gray-600 mb-1">Henüz ders eklenmemiş</p>
            <p className="text-xs text-gray-400">Yukarıdan ilk dersinizi ekleyin.</p>
          </div>
        )}
      </div>

    </div>
  )
}
