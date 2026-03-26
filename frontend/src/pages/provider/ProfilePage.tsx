import { useState, useEffect, useRef } from 'react'
import { Check } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import EmojiPicker, { type EmojiClickData, Theme } from 'emoji-picker-react'
import { apiClient } from '@/api/client'
import { useAuthStore } from '@/store/auth.store'

interface ProfileForm {
  firstName: string
  lastName: string
  avatarUrl: string
  bio: string
  specializations: string[]
  hourlyRate: string
  currency: string
}

export default function ProfilePage() {
  const qc = useQueryClient()
  const authState = useAuthStore()
  const [newSpec, setNewSpec] = useState('')
  const [uploading, setUploading] = useState(false)
  const [showEmoji, setShowEmoji] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const emojiRef = useRef<HTMLDivElement>(null)
  const formInitialized = useRef(false)
  const [form, setForm] = useState<ProfileForm>({
    firstName: '', lastName: '', avatarUrl: '',
    bio: '', specializations: [], hourlyRate: '', currency: 'TRY',
  })

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Kendinizi öğrencilere tanıtın… 🎓' }),
    ],
    content: '',
    onUpdate: ({ editor }) => {
      setForm((f) => ({ ...f, bio: editor.getHTML() }))
    },
  })

  const { data, isLoading } = useQuery({
    queryKey: ['myProfile'],
    queryFn: () => apiClient.get('/providers/me').then((r) => r.data),
  })

  useEffect(() => {
    if (data && !formInitialized.current) {
      formInitialized.current = true
      const bio = data.bio ?? ''
      setForm({
        firstName: data.firstName ?? '',
        lastName: data.lastName ?? '',
        avatarUrl: data.avatarUrl ?? '',
        bio,
        specializations: data.specializations ?? [],
        hourlyRate: data.hourlyRate?.toString() ?? '',
        currency: data.currency ?? 'TRY',
      })
      if (editor && bio) {
        editor.commands.setContent(bio)
      }
    }
  }, [data, editor])

  const saveMutation = useMutation({
    mutationFn: (f: ProfileForm) =>
      apiClient.put('/providers/me', {
        firstName: f.firstName,
        lastName: f.lastName,
        bio: f.bio,
        specializations: f.specializations,
        avatarUrl: f.avatarUrl || null,
        hourlyRate: f.hourlyRate ? parseFloat(f.hourlyRate) : null,
        currency: f.currency || 'TRY',
      }),
    onSuccess: () => {
      formInitialized.current = false
      qc.invalidateQueries({ queryKey: ['myProfile'] })
      // update auth store fullName
      authState.setAuth({
        userId: authState.userId!,
        fullName: `${form.firstName} ${form.lastName}`.trim(),
        role: authState.role!,
        accessToken: authState.accessToken!,
        refreshToken: authState.refreshToken!,
      })
    },
  })

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setShowEmoji(false)
      }
    }
    if (showEmoji) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showEmoji])

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    editor?.commands.insertContent(emojiData.emoji)
    setShowEmoji(false)
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Anında preview için base64
    const reader = new FileReader()
    reader.onload = (ev) => {
      if (ev.target?.result) {
        setForm((f) => ({ ...f, avatarUrl: ev.target!.result as string }))
      }
    }
    reader.readAsDataURL(file)

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await apiClient.post('/uploads/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setForm((f) => ({ ...f, avatarUrl: res.data.url }))
    } finally {
      setUploading(false)
    }
  }

  const addSpec = () => {
    const s = newSpec.trim()
    if (s && !form.specializations.includes(s)) {
      setForm((f) => ({ ...f, specializations: [...f.specializations, s] }))
    }
    setNewSpec('')
  }

  const removeSpec = (s: string) =>
    setForm((f) => ({ ...f, specializations: f.specializations.filter((x) => x !== s) }))

  if (isLoading) {
    return (
      <div className="max-w-2xl space-y-4 animate-pulse">
        <div className="h-8 bg-gray-100 rounded-xl w-1/3" />
        <div className="h-64 bg-gray-100 rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Profilim</h1>
        <p className="text-sm text-gray-500 mt-0.5">Öğrencilerin gördüğü bilgileri düzenleyin.</p>
      </div>

      <div className="space-y-4">
        {/* Ad Soyad + Profil Resmi */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Kişisel Bilgiler</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ad</label>
              <input
                value={form.firstName}
                onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                style={{ '--tw-ring-color': 'var(--color-primary)' } as React.CSSProperties}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Soyad</label>
              <input
                value={form.lastName}
                onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                style={{ '--tw-ring-color': 'var(--color-primary)' } as React.CSSProperties}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Saatlik Ücret (₺)</label>
            <input
              type="number"
              value={form.hourlyRate}
              onChange={(e) => setForm((f) => ({ ...f, hourlyRate: e.target.value }))}
              placeholder="ör. 300"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
              style={{ '--tw-ring-color': 'var(--color-primary)' } as React.CSSProperties}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Profil Fotoğrafı</label>
            <div className="flex items-center gap-4">
              {form.avatarUrl ? (
                <img src={form.avatarUrl} alt="profil"
                  className="w-16 h-16 rounded-2xl object-cover border border-gray-200 flex-shrink-0" />
              ) : (
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white flex-shrink-0"
                  style={{ background: 'var(--color-primary)' }}
                >
                  {form.firstName?.[0] ?? '?'}
                </div>
              )}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-60 transition-colors"
                >
                  {uploading ? 'Yükleniyor…' : 'Fotoğraf Seç'}
                </button>
                <p className="text-xs text-gray-400 mt-1">JPG, PNG veya WebP · Maks 5 MB</p>
              </div>
            </div>
          </div>
        </div>

        {/* Hakkında */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-3">
          <h2 className="font-semibold text-gray-900">Hakkında</h2>

          {/* Toolbar */}
          <div className="flex items-center gap-1 flex-wrap border border-gray-200 rounded-xl px-2 py-1.5 bg-gray-50">
            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleBold().run()}
              className={`px-2.5 py-1 rounded-lg text-sm font-bold transition-colors ${editor?.isActive('bold') ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-800 hover:bg-white'}`}
            >B</button>
            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              className={`px-2.5 py-1 rounded-lg text-sm italic transition-colors ${editor?.isActive('italic') ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-800 hover:bg-white'}`}
            >I</button>
            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
              className={`px-2.5 py-1 rounded-lg text-sm transition-colors ${editor?.isActive('bulletList') ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-800 hover:bg-white'}`}
            >• Liste</button>
            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleOrderedList().run()}
              className={`px-2.5 py-1 rounded-lg text-sm transition-colors ${editor?.isActive('orderedList') ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-800 hover:bg-white'}`}
            >1. Liste</button>
            <div className="w-px h-5 bg-gray-200 mx-1" />
            <div ref={emojiRef} className="relative">
              <button
                type="button"
                onClick={() => setShowEmoji((v) => !v)}
                className="px-2.5 py-1 rounded-lg text-sm transition-colors text-gray-500 hover:text-gray-800 hover:bg-white"
                title="Emoji ekle"
              >😊</button>
              {showEmoji && (
                <div className="absolute left-0 top-9 z-50">
                  <EmojiPicker
                    onEmojiClick={handleEmojiClick}
                    theme={Theme.LIGHT}
                    height={380}
                    width={320}
                    searchPlaceholder="Emoji ara…"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Editor area */}
          <div
            className="min-h-[120px] border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus-within:ring-2 focus-within:border-transparent cursor-text"
            style={{ '--tw-ring-color': 'var(--color-primary)' } as React.CSSProperties}
            onClick={() => editor?.commands.focus()}
          >
            <EditorContent editor={editor} />
          </div>
          <style>{`
            .tiptap p.is-editor-empty:first-child::before {
              content: attr(data-placeholder);
              float: left;
              color: #9ca3af;
              pointer-events: none;
              height: 0;
            }
            .tiptap:focus { outline: none; }
            .tiptap ul { list-style-type: disc; padding-left: 1.25rem; }
            .tiptap ol { list-style-type: decimal; padding-left: 1.25rem; }
            .tiptap strong { font-weight: 700; }
            .tiptap em { font-style: italic; }
          `}</style>
        </div>

        {/* Uzmanlık Alanları */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-3">
          <h2 className="font-semibold text-gray-900">Uzmanlık Alanları</h2>
          <div className="flex flex-wrap gap-2">
            {form.specializations.map((s) => (
              <span
                key={s}
                className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full font-medium"
                style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
              >
                {s}
                <button onClick={() => removeSpec(s)} className="opacity-60 hover:opacity-100 text-xs font-bold">✕</button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={newSpec}
              onChange={(e) => setNewSpec(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSpec())}
              placeholder="ör. DGS Matematik"
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
              style={{ '--tw-ring-color': 'var(--color-primary)' } as React.CSSProperties}
            />
            <button
              onClick={addSpec}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'var(--color-primary)' }}
            >
              Ekle
            </button>
          </div>
        </div>

        {/* Save */}
        <div className="flex items-center gap-3 pb-6">
          <button
            onClick={() => saveMutation.mutate(form)}
            disabled={saveMutation.isPending}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60 transition-opacity hover:opacity-90"
            style={{ background: 'var(--color-primary)' }}
          >
            {saveMutation.isPending ? 'Kaydediliyor…' : 'Değişiklikleri Kaydet'}
          </button>
          {saveMutation.isSuccess && (
            <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
              <Check size={15} /> Kaydedildi
            </span>
          )}
          {saveMutation.isError && <span className="text-sm text-red-500">Hata oluştu, tekrar deneyin.</span>}
        </div>
      </div>
    </div>
  )
}
