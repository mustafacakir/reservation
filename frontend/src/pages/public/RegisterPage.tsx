import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, Lock, User, Phone, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react'
import { authApi } from '@/api/endpoints/auth.api'
import { useAuthStore } from '@/store/auth.store'
import { useTenantStore } from '@/store/tenant.store'
import { getSectorConfig } from '@/config/sectors'
import Logo from '@/components/landing/Logo'

const schema = z.object({
  firstName: z.string().min(1, 'Ad gerekli').max(100),
  lastName: z.string().min(1, 'Soyad gerekli').max(100),
  email: z.string().email('Geçerli bir e-posta girin'),
  password: z.string().min(8, 'En az 8 karakter olmalı'),
  phoneNumber: z.string().regex(/^0[5][0-9]{9}$/, 'Geçerli bir TR cep telefonu girin (05XX XXX XX XX)'),
  acceptKvkk: z.literal(true, { errorMap: () => ({ message: 'KVKK onayı zorunludur' }) }),
  acceptTerms: z.literal(true, { errorMap: () => ({ message: 'Kullanım koşulları onayı zorunludur' }) }),
  isEmailSubscribed: z.boolean().default(false),
})
type FormData = z.infer<typeof schema>

function getRegisterErrorMessage(error: unknown): string {
  const msg = (error as any)?.response?.data?.message as string | undefined
  if (!msg) return 'Kayıt sırasında bir hata oluştu. Lütfen tekrar deneyin.'
  if (msg.includes('already registered')) return 'Bu e-posta adresi zaten kayıtlı.'
  if (msg.includes('Tenant context')) return 'Yapılandırma hatası. Lütfen sayfayı yenileyin.'
  return msg
}

const BENEFITS = [
  'Uzman profesyonellerle birebir seans',
  'İstediğin saat ve günde rezervasyon',
  'Güvenli online ödeme',
  '24 saat öncesine kadar ücretsiz iptal',
]

// ── Checkbox bileşeni ─────────────────────────────────────────────────────────

function Checkbox({
  checked, onChange, error, children,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="flex items-start gap-3 cursor-pointer select-none">
        <div className="relative flex-shrink-0 mt-0.5">
          <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
          <div
            className="w-4 h-4 rounded border-2 flex items-center justify-center transition-colors"
            style={checked
              ? { borderColor: 'var(--color-primary)', background: 'var(--color-primary)' }
              : error
                ? { borderColor: '#ef4444', background: '#fff' }
                : { borderColor: '#d1d5db', background: '#fff' }}
          >
            {checked && (
              <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
        </div>
        <span className="text-xs text-gray-600 leading-relaxed">{children}</span>
      </label>
      {error && <p className="text-xs text-red-500 mt-1 ml-7">{error}</p>}
    </div>
  )
}

// ── Ana sayfa ─────────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const { sector } = useTenantStore()
  const sectorCfg = getSectorConfig(sector)

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { isEmailSubscribed: false, acceptKvkk: undefined as any, acceptTerms: undefined as any },
  })

  const acceptKvkk        = watch('acceptKvkk')
  const acceptTerms       = watch('acceptTerms')
  const isEmailSubscribed = watch('isEmailSubscribed')

  const mutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      setAuth({ ...data, fullName: '', role: 'Client' })
      navigate('/', { replace: true })
    },
  })

  return (
    <div className="min-h-screen flex">
      {/* Sol panel */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12"
        style={{ background: 'var(--color-primary)' }}
      >
        <Logo size="md" white />
        <div>
          <h2 className="text-4xl font-bold text-white leading-snug mb-4">{sectorCfg.heroTitle}</h2>
          <p className="text-white/70 text-base mb-10">Ücretsiz hesap oluştur, hemen başla.</p>
          <div className="space-y-3">
            {BENEFITS.map((b) => (
              <div key={b} className="flex items-center gap-3">
                <CheckCircle2 size={18} className="text-white/80 flex-shrink-0" />
                <span className="text-white/90 text-sm">{b}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-white/40 text-xs">© 2025 · {sectorCfg.label}</p>
      </div>

      {/* Sağ panel */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo size="md" />
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Hesap Oluştur</h1>
            <p className="text-sm text-gray-500 mt-1">Ücretsiz kaydolun, hemen başlayın</p>
          </div>

          {mutation.error && (
            <div className="mb-5 flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl text-sm text-red-700">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0 text-red-400" />
              <span>{getRegisterErrorMessage(mutation.error)}</span>
            </div>
          )}

          <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
            {/* Ad / Soyad */}
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

            {/* E-posta */}
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

            {/* Telefon */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Telefon Numarası</label>
              <div className="relative">
                <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  {...register('phoneNumber')}
                  type="tel"
                  autoComplete="tel"
                  placeholder="05XX XXX XX XX"
                  maxLength={11}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 11)
                    e.target.value = digits
                    register('phoneNumber').onChange(e)
                  }}
                  className={`w-full border rounded-xl pl-9 pr-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${errors.phoneNumber ? 'border-red-300 focus:ring-red-400' : 'border-gray-200 focus:ring-[var(--color-primary)]'}`}
                />
              </div>
              {errors.phoneNumber && <p className="text-xs text-red-500 mt-1.5">{errors.phoneNumber.message}</p>}
            </div>

            {/* Şifre */}
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

            {/* Zorunlu onaylar */}
            <div className="space-y-3 pt-1">
              <Checkbox
                checked={!!acceptKvkk}
                onChange={(v) => setValue('acceptKvkk', v as true)}
                error={errors.acceptKvkk?.message}
              >
                <Link to="/kvkk" target="_blank" className="font-semibold underline" style={{ color: 'var(--color-primary)' }}>
                  KVKK Aydınlatma Metni
                </Link>
                'ni okudum; kişisel verilerimin belirtilen amaçlarla işlenmesine onay veriyorum.{' '}
                <span className="text-red-500 font-semibold">*</span>
              </Checkbox>

              <Checkbox
                checked={!!acceptTerms}
                onChange={(v) => setValue('acceptTerms', v as true)}
                error={errors.acceptTerms?.message}
              >
                <Link to="/kullanim-kosullari" target="_blank" className="font-semibold underline" style={{ color: 'var(--color-primary)' }}>
                  Kullanım Koşulları
                </Link>
                'nı ve{' '}
                <Link to="/gizlilik" target="_blank" className="font-semibold underline" style={{ color: 'var(--color-primary)' }}>
                  Gizlilik Politikası
                </Link>
                'nı okudum, kabul ediyorum.{' '}
                <span className="text-red-500 font-semibold">*</span>
              </Checkbox>

              {/* İsteğe bağlı e-posta aboneliği */}
              <Checkbox
                checked={isEmailSubscribed}
                onChange={(v) => setValue('isEmailSubscribed', v)}
              >
                Kampanya, duyuru ve bilgilendirici e-postalar almak istiyorum.{' '}
                <span className="text-gray-400">(İsteğe bağlı)</span>
              </Checkbox>
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
