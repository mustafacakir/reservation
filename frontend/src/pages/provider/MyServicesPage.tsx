import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, BookOpen, Users, User, Pencil, Trash2, X, Clock, Tag, Video } from 'lucide-react'
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

function stripHtml(html: string) {
  const div = document.createElement('div')
  div.innerHTML = html
  return div.textContent?.trim() ?? ''
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
}

function utcToDatetimeLocal(utcStr: string): string {
  const d = new Date(utcStr)
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

function utcToTimeLocal(utcStr: string): string {
  const d = new Date(utcStr)
  return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', hour12: false })
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

const emptyForm: ServiceForm = { name: '', description: '', durationMinutes: 60, price: 0, currency: 'TRY', sessionType: 'Individual', maxParticipants: null, recurrenceWeeks: null, scheduledStart: null, scheduledEndTime: null, zoomLink: null, zoomMeetingId: null, zoomPassword: null, sortOrder: 0 }
const inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent bg-white transition-colors'

function ServiceFormPanel({ initial, title, onSave, onCancel, isPending }: {
  initial: ServiceForm; title: string; onSave: (f: ServiceForm) => void; onCancel: () => void; isPending: boolean
}) {
  const [form, setForm] = useState<ServiceForm>(initial)
  const set = (patch: Partial<ServiceForm>) => setForm((f) => ({ ...f, ...patch }))
  const isGroup = form.sessionType === 'Group'
  const canSave = form.name.trim() && form.price >= 0 && (!isGroup || ((form.maxParticipants ?? 0) > 0 && !!form.scheduledStart && !!form.scheduledEndTime))

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

      <div className="p-5 space-y-4">
        {/* Name */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Ders Adı *</label>
          <input type="text" value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="ör. Ortaokul Matematik" className={inputCls} />
        </div>

        {/* Sort order */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Sıra Numarası</label>
          <input type="number" min={0} value={form.sortOrder} onChange={(e) => set({ sortOrder: parseInt(e.target.value) || 0 })} placeholder="0" className={inputCls} />
          <p className="text-xs text-gray-400 mt-1">Küçük numara önce görünür. Aynı numara varsa isme göre sıralanır.</p>
        </div>

        {/* Description — rich text */}
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
            className="min-h-[100px] border border-t-0 border-gray-200 rounded-b-xl px-3 py-2.5 text-sm focus-within:ring-2 focus-within:ring-[var(--color-primary)] focus-within:border-transparent cursor-text"
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

        {/* Schedule */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Tarih ve Başlangıç Saati {isGroup ? '*' : <span className="font-normal normal-case text-gray-400">(isteğe bağlı)</span>}
            </label>
            <input type="datetime-local" value={form.scheduledStart ?? ''} onChange={(e) => set({ scheduledStart: e.target.value || null })} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Bitiş Saati {isGroup ? '*' : ''}
            </label>
            <input type="time" value={form.scheduledEndTime ?? ''} onChange={(e) => set({ scheduledEndTime: e.target.value || null })} className={inputCls} />
          </div>
        </div>
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
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Kaç Hafta Tekrarlansın?</label>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <button type="button" onClick={() => set({ recurrenceWeeks: null })}
              className={`px-3 py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${!form.recurrenceWeeks ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-gray-200 text-gray-500'}`}
              style={!form.recurrenceWeeks ? { background: 'var(--color-primary-light)' } : { background: '#fff' }}>
              Tek seferlik
            </button>
            <button type="button" onClick={() => set({ recurrenceWeeks: 4 })}
              className={`px-3 py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${form.recurrenceWeeks ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-gray-200 text-gray-500'}`}
              style={form.recurrenceWeeks ? { background: 'var(--color-primary-light)' } : { background: '#fff' }}>
              Haftalık tekrar
            </button>
          </div>
          {form.recurrenceWeeks && (
            <>
              <input type="number" min={2} max={52} value={form.recurrenceWeeks}
                onChange={(e) => set({ recurrenceWeeks: parseInt(e.target.value) || 4 })} className={inputCls} />
              <p className="text-xs text-gray-400 mt-1">Her hafta aynı saatte {form.recurrenceWeeks} hafta tekrarlanır.</p>
            </>
          )}
        </div>

        {/* Duration + Price */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Süre (dakika)</label>
            <input type="number" min={5} max={480} value={form.durationMinutes}
              onChange={(e) => set({ durationMinutes: parseInt(e.target.value) || 60 })} placeholder="50" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Ücret (₺) *</label>
            <input type="number" value={form.price} onChange={(e) => set({ price: parseFloat(e.target.value) || 0 })} className={inputCls} />
          </div>
        </div>

        {/* Zoom bilgileri */}
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Video size={14} style={{ color: 'var(--color-primary)' }} />
            <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Zoom Bilgileri</span>
            <span className="text-[10px] text-gray-400 font-normal normal-case">(isteğe bağlı — rezervasyon onayında öğrenciye gönderilir)</span>
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
  const updateMutation = useMutation({
    mutationFn: ({ id, ...f }: ServiceForm & { id: string }) => apiClient.put(`/services/${id}`, toPayload(f)).then((r) => r.data),
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
              initial={{ name: s.name, description: s.description, durationMinutes: s.durationMinutes, price: Number(s.price), currency: 'TRY', sessionType: s.sessionType === 'Group' ? 'Group' : 'Individual', maxParticipants: s.maxParticipants ?? null, recurrenceWeeks: s.recurrenceWeeks ?? null, scheduledStart: s.scheduledStart ? utcToDatetimeLocal(s.scheduledStart) : null, scheduledEndTime: s.scheduledEnd ? utcToTimeLocal(s.scheduledEnd) : null, zoomLink: s.zoomLink ?? null, zoomMeetingId: s.zoomMeetingId ?? null, zoomPassword: s.zoomPassword ?? null, sortOrder: (s as any).sortOrder ?? 0 }}
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
                          {(s as any).scheduledStart && (
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                              {new Date((s as any).scheduledStart).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                              {' '}{new Date((s as any).scheduledStart).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                              {(s as any).scheduledEnd && `–${new Date((s as any).scheduledEnd).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`}
                              {(s as any).recurrenceWeeks && ` · ${(s as any).recurrenceWeeks} hafta`}
                            </span>
                          )}
                          {s.zoomLink && (
                            <span className="flex items-center gap-1 text-xs font-medium" style={{ color: 'var(--color-primary)' }}>
                              <Video size={10} /> Zoom bağlı
                            </span>
                          )}
                          {s.description && (
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                              <Tag size={10} /> {stripHtml(s.description)}
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
