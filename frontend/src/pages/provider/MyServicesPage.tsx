import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, BookOpen, Users, User, Pencil, Trash2, X, Clock, Tag } from 'lucide-react'
import { apiClient } from '@/api/client'
import type { ServiceItem } from '@/types/provider.types'

function toHHMM(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  return h > 0 ? `${h}s ${m > 0 ? m + 'dk' : ''}`.trim() : `${m}dk`
}

interface ServiceForm {
  name: string; description: string; durationMinutes: number
  price: number; currency: string; sessionType: 'Individual' | 'Group'; maxParticipants: number | null
}

const emptyForm: ServiceForm = { name: '', description: '', durationMinutes: 60, price: 0, currency: 'TRY', sessionType: 'Individual', maxParticipants: null }
const inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent bg-white transition-colors'

function ServiceFormPanel({ initial, title, onSave, onCancel, isPending }: {
  initial: ServiceForm; title: string; onSave: (f: ServiceForm) => void; onCancel: () => void; isPending: boolean
}) {
  const [form, setForm] = useState<ServiceForm>(initial)
  const set = (patch: Partial<ServiceForm>) => setForm((f) => ({ ...f, ...patch }))
  const isGroup = form.sessionType === 'Group'
  const canSave = form.name.trim() && form.price > 0 && (!isGroup || (form.maxParticipants ?? 0) > 0)

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-4">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
        <h2 className="font-semibold text-gray-900">{title}</h2>
        <button onClick={onCancel} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
          <X size={16} />
        </button>
      </div>

      <div className="p-5 space-y-4">
        {/* Name */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Ders Adı *</label>
          <input type="text" value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="ör. Ortaokul Matematik" className={inputCls} />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Açıklama</label>
          <textarea value={form.description} onChange={(e) => set({ description: e.target.value })} placeholder="Ders içeriğini kısaca açıklayın…" rows={2} className={`${inputCls} resize-none`} />
        </div>

        {/* Session type */}
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

        {/* Max participants */}
        {isGroup && (
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Kontenjan *</label>
            <input type="number" min={2} max={500} value={form.maxParticipants ?? 10} onChange={(e) => set({ maxParticipants: parseInt(e.target.value) || 10 })} className={inputCls} />
            <p className="text-xs text-gray-400 mt-1">Kontenjan dolduğunda yeni rezervasyon alınamaz.</p>
          </div>
        )}

        {/* Duration + Price */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Süre (dakika)</label>
            <input
              type="number"
              min={5}
              max={480}
              value={form.durationMinutes}
              onChange={(e) => set({ durationMinutes: parseInt(e.target.value) || 60 })}
              placeholder="50"
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Ücret (₺) *</label>
            <input type="number" value={form.price} onChange={(e) => set({ price: parseFloat(e.target.value) || 0 })} className={inputCls} />
          </div>
        </div>
      </div>

      <div className="flex gap-2 px-5 pb-5">
        <button
          onClick={() => onSave(form)}
          disabled={isPending || !canSave}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-opacity hover:opacity-90"
          style={{ background: 'var(--color-primary)' }}
        >
          {isPending ? 'Kaydediliyor…' : 'Kaydet'}
        </button>
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

  const createMutation = useMutation({
    mutationFn: (f: ServiceForm) => apiClient.post('/services', f).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['myServices'] }); setShowCreate(false) },
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, ...f }: ServiceForm & { id: string }) => apiClient.put(`/services/${id}`, f).then((r) => r.data),
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
        <ServiceFormPanel title="Yeni Ders Ekle" initial={emptyForm} onSave={(f) => createMutation.mutate(f)} onCancel={() => setShowCreate(false)} isPending={createMutation.isPending} />
      )}

      <div className="space-y-3">
        {services.map((s) =>
          editingId === s.id ? (
            <ServiceFormPanel
              key={s.id}
              title="Dersi Düzenle"
              initial={{ name: s.name, description: s.description, durationMinutes: s.durationMinutes, price: Number(s.price), currency: 'TRY', sessionType: (s as any).sessionType === 'Group' ? 'Group' : 'Individual', maxParticipants: (s as any).maxParticipants ?? null }}
              onSave={(f) => updateMutation.mutate({ id: s.id, ...f })}
              onCancel={() => setEditingId(null)}
              isPending={updateMutation.isPending}
            />
          ) : (
            <div key={s.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {deletingId === s.id ? (
                <div className="p-4 flex items-center gap-4 bg-red-50 border-red-100">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">{s.name}</p>
                    <p className="text-xs text-red-600 mt-0.5">Bu dersi silmek istediğinize emin misiniz?</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => deleteMutation.mutate(s.id)} disabled={deleteMutation.isPending} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500 text-white hover:bg-red-600 disabled:opacity-60 transition-colors">
                      {deleteMutation.isPending ? '…' : 'Sil'}
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
                              <Users size={10} /> {(s as any).totalBookings ?? 0}/{(s as any).maxParticipants} kişi
                            </span>
                          )}
                          {s.description && (
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                              <Tag size={10} /> {s.description}
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
        )}

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
    </div>
  )
}
