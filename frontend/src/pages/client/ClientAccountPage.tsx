import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { User, Mail, Save, Shield } from 'lucide-react'
import { authApi } from '@/api/endpoints/auth.api'
import { useAuthStore } from '@/store/auth.store'
import { useToast } from '@/components/ui/Toast'

const profileSchema = z.object({
  firstName: z.string().min(1, 'Ad gerekli').max(50),
  lastName: z.string().min(1, 'Soyad gerekli').max(50),
})
type ProfileForm = z.infer<typeof profileSchema>

function getNameParts(fullName: string | null) {
  const parts = (fullName ?? '').trim().split(' ')
  const lastName = parts.length > 1 ? parts[parts.length - 1] : ''
  const firstName = parts.slice(0, parts.length > 1 ? -1 : 1).join(' ')
  return { firstName, lastName }
}

export default function ClientAccountPage() {
  const toast = useToast()
  const { fullName, setAuth, userId, role, accessToken, refreshToken } = useAuthStore()
  const initials = fullName?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() ?? '?'
  const { firstName, lastName } = getNameParts(fullName)

  const { register, handleSubmit, formState: { errors, isDirty } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { firstName, lastName },
  })

  const mutation = useMutation({
    mutationFn: authApi.updateProfile,
    onSuccess: (data) => {
      if (userId && role && accessToken && refreshToken) {
        setAuth({ userId, fullName: data.fullName, role, accessToken, refreshToken })
      }
      toast.success('Profil güncellendi', 'İsim bilgilerin kaydedildi.')
    },
    onError: () => toast.error('Güncelleme başarısız', 'Lütfen tekrar deneyin.'),
  })

  return (
    <div className="space-y-5 max-w-lg">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Hesabım</h1>
        <p className="text-sm text-gray-400 mt-0.5">Kişisel bilgilerini düzenle</p>
      </div>

      {/* Avatar card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center gap-5">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-extrabold text-white flex-shrink-0"
          style={{ background: 'var(--color-primary)' }}
        >
          {initials}
        </div>
        <div>
          <p className="font-bold text-gray-900 text-lg">{fullName}</p>
          <p className="text-sm text-gray-400 mt-0.5">Öğrenci hesabı</p>
        </div>
      </div>

      {/* Profile form */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-5">
          <User size={15} className="text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-800">Kişisel Bilgiler</h2>
        </div>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Ad</label>
              <input
                {...register('firstName')}
                className={`w-full border rounded-xl px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
                  errors.firstName ? 'border-red-300 focus:ring-red-400' : 'border-gray-200 focus:ring-[var(--color-primary)]'
                }`}
              />
              {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Soyad</label>
              <input
                {...register('lastName')}
                className={`w-full border rounded-xl px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
                  errors.lastName ? 'border-red-300 focus:ring-red-400' : 'border-gray-200 focus:ring-[var(--color-primary)]'
                }`}
              />
              {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName.message}</p>}
            </div>
          </div>

          <button
            type="submit"
            disabled={mutation.isPending || !isDirty}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: 'var(--color-primary)' }}
          >
            <Save size={14} />
            {mutation.isPending ? 'Kaydediliyor…' : 'Kaydet'}
          </button>
        </form>
      </div>

      {/* Email (read-only) */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Mail size={15} className="text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-800">E-posta</h2>
        </div>
        <div className="flex items-center gap-3 p-3.5 bg-gray-50 rounded-xl border border-gray-100">
          <Mail size={14} className="text-gray-400 flex-shrink-0" />
          <span className="text-sm text-gray-600 flex-1">Giriş yaptığın e-posta adresi</span>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Değiştirilemez</span>
        </div>
      </div>

      {/* Security note */}
      <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
        <Shield size={15} className="text-gray-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-gray-500 leading-relaxed">
          Hesap güvenliği için şifre değiştirme özelliği yakında eklenecek.
        </p>
      </div>
    </div>
  )
}
