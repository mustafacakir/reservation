import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, Lock, User, ArrowRight, CheckCircle2 } from 'lucide-react'
import { authApi } from '@/api/endpoints/auth.api'
import { useAuthStore } from '@/store/auth.store'
import Logo from '@/components/landing/Logo'

const schema = z.object({
  firstName: z.string().min(1, 'Ad gerekli').max(100),
  lastName: z.string().min(1, 'Soyad gerekli').max(100),
  email: z.string().email('Geçerli bir e-posta girin'),
  password: z.string().min(8, 'En az 8 karakter olmalı'),
})
type FormData = z.infer<typeof schema>

const BENEFITS = [
  'Uzman öğretmenlerle birebir ders',
  'İstediğin saat ve günde rezervasyon',
  'Güvenli online ödeme',
  'İlk ders memnuniyet garantisi',
]

export default function RegisterPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const mutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      setAuth({ ...data, fullName: `${data.firstName ?? ''} ${data.lastName ?? ''}`.trim() || '', role: 'Client' })
      navigate('/client/browse', { replace: true })
    },
  })

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div
        className="hidden lg:flex lg:w-5/12 flex-col justify-between p-12"
        style={{ background: 'var(--color-primary)' }}
      >
        <Logo size="md" white />

        <div>
          <h2 className="text-3xl font-bold text-white leading-snug mb-3">
            Başarıya giden yolda<br />doğru öğretmen seç.
          </h2>
          <p className="text-white/70 text-sm mb-8">
            Ücretsiz hesap oluştur, hemen ders planlamaya başla.
          </p>
          <div className="space-y-3">
            {BENEFITS.map((b) => (
              <div key={b} className="flex items-center gap-3">
                <CheckCircle2 size={18} className="text-white/80 flex-shrink-0" />
                <span className="text-white/90 text-sm">{b}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-white/40 text-xs">© 2025 sevdailematematik</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="mb-8 lg:hidden">
            <Logo size="md" />
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Hesap Oluştur</h1>
            <p className="text-sm text-gray-500 mt-1">Ücretsiz kaydolun, hemen başlayın</p>
          </div>

          {mutation.error && (
            <div className="mb-5 flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl text-sm text-red-700">
              <span className="mt-0.5 flex-shrink-0">⚠️</span>
              <span>Kayıt sırasında bir hata oluştu. Lütfen tekrar deneyin.</span>
            </div>
          )}

          <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Ad</label>
                <div className="relative">
                  <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    {...register('firstName')}
                    type="text"
                    autoComplete="given-name"
                    placeholder="Ali"
                    className={`w-full border rounded-xl pl-9 pr-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${errors.firstName ? 'border-red-300 focus:ring-red-400' : 'border-gray-200 focus:ring-[var(--color-primary)]'}`}
                  />
                </div>
                {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Soyad</label>
                <input
                  {...register('lastName')}
                  type="text"
                  autoComplete="family-name"
                  placeholder="Yılmaz"
                  className={`w-full border rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${errors.lastName ? 'border-red-300 focus:ring-red-400' : 'border-gray-200 focus:ring-[var(--color-primary)]'}`}
                />
                {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">E-posta</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  {...register('email')}
                  type="email"
                  autoComplete="email"
                  placeholder="ornek@email.com"
                  className={`w-full border rounded-xl pl-9 pr-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${errors.email ? 'border-red-300 focus:ring-red-400' : 'border-gray-200 focus:ring-[var(--color-primary)]'}`}
                />
              </div>
              {errors.email && <p className="text-xs text-red-500 mt-1.5">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Şifre</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  {...register('password')}
                  type="password"
                  autoComplete="new-password"
                  placeholder="En az 8 karakter"
                  className={`w-full border rounded-xl pl-9 pr-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${errors.password ? 'border-red-300 focus:ring-red-400' : 'border-gray-200 focus:ring-[var(--color-primary)]'}`}
                />
              </div>
              {errors.password && <p className="text-xs text-red-500 mt-1.5">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={mutation.isPending}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60 mt-2"
              style={{ background: 'var(--color-primary)' }}
            >
              {mutation.isPending ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Hesap oluşturuluyor…
                </span>
              ) : (
                <>Hesap Oluştur <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">
              Zaten hesabınız var mı?{' '}
              <Link to="/login" className="font-semibold hover:underline" style={{ color: 'var(--color-primary)' }}>
                Giriş yapın
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
