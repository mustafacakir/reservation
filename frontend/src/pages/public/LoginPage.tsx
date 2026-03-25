import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { Mail, Lock, ArrowRight, CalendarCheck, Star, Shield } from 'lucide-react'
import { authApi } from '@/api/endpoints/auth.api'
import { useAuthStore } from '@/store/auth.store'
import Logo from '@/components/landing/Logo'

const schema = z.object({
  email: z.string().email('Geçerli bir e-posta girin'),
  password: z.string().min(1, 'Şifre gerekli'),
})
type FormData = z.infer<typeof schema>

const FEATURES = [
  { Icon: CalendarCheck, text: 'Kolayca ders rezervasyonu yapın' },
  { Icon: Star, text: 'Uzman öğretmenlerle çalışın' },
  { Icon: Shield, text: 'Güvenli ödeme altyapısı' },
]

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const setAuth = useAuthStore((s) => s.setAuth)
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const mutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setAuth(data)
      const fallback = data.role === 'ServiceProvider' ? '/provider'
        : data.role === 'Admin' || data.role === 'SuperAdmin' ? '/admin'
        : '/client/browse'
      navigate(from ?? fallback, { replace: true })
    },
  })

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12"
        style={{ background: 'var(--color-primary)' }}
      >
        <Logo size="md" white />

        <div>
          <h2 className="text-4xl font-bold text-white leading-snug mb-4">
            Matematik öğrenmek<br />hiç bu kadar kolay olmamıştı.
          </h2>
          <p className="text-white/70 text-base mb-10">
            Uzman öğretmenlerle birebir ders alın, ilerlemenizi takip edin.
          </p>
          <div className="space-y-4">
            {FEATURES.map(({ Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
                  <Icon size={18} className="text-white" />
                </div>
                <span className="text-white/90 text-sm font-medium">{text}</span>
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
            <h1 className="text-2xl font-bold text-gray-900">Tekrar hoş geldiniz</h1>
            <p className="text-sm text-gray-500 mt-1">Hesabınıza giriş yapın</p>
          </div>

          {mutation.error && (
            <div className="mb-5 flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl text-sm text-red-700">
              <span className="mt-0.5 flex-shrink-0">⚠️</span>
              <span>E-posta veya şifre hatalı.</span>
            </div>
          )}

          <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
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
                  autoComplete="current-password"
                  placeholder="••••••••"
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
                  Giriş yapılıyor…
                </span>
              ) : (
                <>Giriş Yap <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">
              Hesabınız yok mu?{' '}
              <Link to="/register" className="font-semibold hover:underline" style={{ color: 'var(--color-primary)' }}>
                Ücretsiz kayıt ol
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
