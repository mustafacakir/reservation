import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  CalendarCheck, BookOpen, Award, ChevronDown, ChevronUp,
  MapPin, Monitor, Shield, Heart, Target, TrendingUp, Video, Zap,
  BadgeCheck, Users,
} from 'lucide-react'
import { providersApi } from '@/api/endpoints/providers.api'
import { useTenantStore } from '@/store/tenant.store'
import { getSectorConfig, type SectorFeatureCard } from '@/config/sectors'
import Logo from '@/components/landing/Logo'

// ── Icon map for feature cards ────────────────────────────────────────────────

const ICON_MAP: Record<SectorFeatureCard['iconKey'], React.ElementType> = {
  'award': Award,
  'calendar-check': CalendarCheck,
  'book-open': BookOpen,
  'heart': Heart,
  'shield': Shield,
  'target': Target,
  'trending-up': TrendingUp,
  'video': Video,
  'zap': Zap,
  'badge-check': BadgeCheck,
  'users': Users,
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function Avatar({ name, avatarUrl, size }: { name: string; avatarUrl?: string | null; size: number }) {
  const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
  return avatarUrl ? (
    <img
      src={avatarUrl}
      alt={name}
      className="rounded-3xl object-cover ring-4 ring-white shadow-xl"
      style={{ width: size, height: size }}
    />
  ) : (
    <div
      className="rounded-3xl flex items-center justify-center font-black text-white ring-4 ring-white shadow-xl"
      style={{ width: size, height: size, background: 'var(--color-primary)', fontSize: size * 0.3 }}
    >
      {initials}
    </div>
  )
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div
      className="border rounded-2xl overflow-hidden transition-all"
      style={open
        ? { borderColor: 'var(--color-primary)', boxShadow: '0 0 0 2px var(--color-primary-light)' }
        : { borderColor: '#f3f4f6' }
      }
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left gap-4"
      >
        <span className="font-semibold text-gray-900 text-sm sm:text-base">{q}</span>
        {open
          ? <ChevronUp size={18} className="flex-shrink-0 text-gray-400" />
          : <ChevronDown size={18} className="flex-shrink-0 text-gray-400" />
        }
      </button>
      {open && (
        <div className="px-5 pb-4">
          <p className="text-sm text-gray-600 leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const { slug, sector } = useTenantStore()
  const cfg = getSectorConfig(sector)

  const { data, isLoading } = useQuery({
    queryKey: ['landing-providers', slug],
    queryFn: () => providersApi.search({ page: 1, pageSize: 3 }),
    enabled: !!slug,
    staleTime: 1000 * 60 * 5,
  })

  const providers = data?.items ?? []

  const findProvidersForCategory = (catLabel: string, catSlug: string) => {
    if (providers.length === 0) return []
    const label = catLabel.toLowerCase()
    const slug = catSlug.toLowerCase()
    const matched = providers.filter(p =>
      p.specializations.some(s => {
        const sl = s.toLowerCase()
        return sl.includes(label) || label.includes(sl) || sl.includes(slug)
      })
    )
    return matched
  }

  return (
    <div className="min-h-screen bg-white">

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden pt-16 pb-20 px-4"
        style={{ background: `linear-gradient(160deg, var(--color-primary-light) 0%, #fff 60%)` }}
      >
        {/* Decorative background symbols */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden>
          {cfg.decorativeSymbols.map((s, i) => (
            <span
              key={i}
              className="absolute font-black text-5xl sm:text-7xl opacity-[0.04]"
              style={{
                color: 'var(--color-primary)',
                fontFamily: 'Georgia, serif',
                top: `${10 + i * 14}%`,
                left: i % 2 === 0 ? `${2 + i * 3}%` : undefined,
                right: i % 2 !== 0 ? `${2 + i * 3}%` : undefined,
                transform: `rotate(${(i % 3 - 1) * 15}deg)`,
              }}
            >
              {s}
            </span>
          ))}
        </div>

        <div className="relative max-w-5xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">

            {/* Text side */}
            <div className="flex-1 text-center lg:text-left">
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-5"
                style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
              >
                <MapPin size={12} /> İstanbul · Online & Yüz Yüze
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight mb-4">
                {cfg.heroTitle.split(' ').slice(0, 3).join(' ')}<br />
                <span style={{ color: 'var(--color-primary)' }}>
                  {cfg.heroTitle.split(' ').slice(3).join(' ')}
                </span>
              </h1>

              <p className="text-base sm:text-lg text-gray-600 mb-8 leading-relaxed max-w-lg mx-auto lg:mx-0">
                {cfg.heroSubtitle}
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <a
                  href="#ogretmenlerimiz"
                  className="px-7 py-3.5 rounded-2xl text-sm font-bold text-white shadow-md transition-all hover:shadow-lg hover:scale-105"
                  style={{ background: 'var(--color-primary)' }}
                >
                  {cfg.browseLabel} →
                </a>
                <a
                  href="#nasil-calisir"
                  className="px-7 py-3.5 rounded-2xl text-sm font-semibold text-gray-700 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all hover:scale-105"
                >
                  Nasıl çalışır?
                </a>
              </div>

              <div className="flex flex-wrap gap-4 justify-center lg:justify-start mt-8 text-xs text-gray-500">
                <span className="flex items-center gap-1.5"><Monitor size={13} /> Online {cfg.sessionLabel}</span>
                <span className="flex items-center gap-1.5"><MapPin size={13} /> Yüz yüze</span>
                <span className="flex items-center gap-1.5"><CalendarCheck size={13} /> Esnek saatler</span>
              </div>
            </div>

            {/* Provider cards */}
            <div className="flex-shrink-0 w-full max-w-sm space-y-3">
              {isLoading ? (
                [1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-2xl shadow-sm p-5 animate-pulse h-28" />
                ))
              ) : (
                providers.map((p) => {
                  const bio = p.bio ? p.bio.replace(/<[^>]*>/g, '').trim() : null
                  return (
                    <Link
                      key={p.id}
                      to={`/providers/${p.id}`}
                      className="group block bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-[var(--color-primary)] transition-all duration-200 p-4"
                    >
                      <div className="flex items-start gap-3">
                        <Avatar name={p.fullName} avatarUrl={p.avatarUrl} size={48} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-bold text-gray-900 leading-snug group-hover:text-[var(--color-primary)] transition-colors">
                              {p.fullName}
                            </p>
                            {p.hourlyRate && (
                              <p className="text-sm font-extrabold flex-shrink-0" style={{ color: 'var(--color-primary)' }}>
                                ₺{p.hourlyRate.toLocaleString('tr-TR')}
                              </p>
                            )}
                          </div>
                          {bio && (
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2 leading-relaxed">{bio}</p>
                          )}
                          {p.specializations.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {p.specializations.map((s) => (
                                <span
                                  key={s}
                                  className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                                  style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
                                >
                                  {s}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <span
                          className="block w-full text-center text-xs font-bold py-2 rounded-xl text-white transition-opacity group-hover:opacity-90"
                          style={{ background: 'var(--color-primary)' }}
                        >
                          Rezervasyon Yap
                        </span>
                      </div>
                    </Link>
                  )
                })
              )}
            </div>

          </div>
        </div>
      </section>

      {/* ── Categories ──────────────────────────────────────────────────────── */}
      {cfg.categories.length > 0 && (
        <section id="kategoriler" className="py-16 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">
                Hangi Konuda Yardım İstiyorsun?
              </h2>
              <p className="text-gray-500">Uzmanlık alanlarına göre {cfg.sessionLabel} al</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {cfg.categories.map((cat) => {
                const matched = findProvidersForCategory(cat.label, cat.slug)
                const isSingle = matched.length === 1
                const href = isSingle ? `/providers/${matched[0].id}` : '#ogretmenlerimiz'
                const isExternal = !isSingle
                return isExternal ? (
                  <a
                    key={cat.slug}
                    href={href}
                    className="group flex flex-col items-center gap-2 p-4 rounded-2xl border border-gray-100 hover:border-transparent hover:shadow-md transition-all bg-white text-center"
                  >
                    <span className="text-2xl">{cat.icon}</span>
                    <span className="text-xs font-semibold text-gray-700 leading-snug">{cat.label}</span>
                    {matched.length > 1 && (
                      <span className="text-[9px] text-gray-400">{matched.length} {cfg.providerLabel}</span>
                    )}
                  </a>
                ) : (
                  <Link
                    key={cat.slug}
                    to={href}
                    className="group flex flex-col items-center gap-2 p-4 rounded-2xl border border-gray-100 hover:border-transparent hover:shadow-md transition-all bg-white text-center"
                  >
                    <span className="text-2xl">{cat.icon}</span>
                    <span className="text-xs font-semibold text-gray-700 leading-snug">{cat.label}</span>
                    {isSingle && (
                      <span className="text-[9px] text-gray-400 truncate max-w-full px-1">
                        {matched[0].fullName.split(' ')[0]}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── Teachers ────────────────────────────────────────────────────────── */}
      <section id="ogretmenlerimiz" className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">
              {cfg.providersHeading}
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Alanında uzman, sonuç odaklı {cfg.providerLabel}lerimizle tanışın
            </p>
          </div>

          {/* Provider cards grid */}
          <div className={`grid gap-5 mb-10 ${
            providers.length === 1
              ? 'grid-cols-1 max-w-sm mx-auto'
              : providers.length === 2
                ? 'grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto'
                : 'grid-cols-1 sm:grid-cols-3'
          }`}>
            {isLoading ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 animate-pulse">
                  <div className="w-20 h-20 rounded-2xl bg-gray-100 mx-auto mb-4" />
                  <div className="h-4 bg-gray-100 rounded w-2/3 mx-auto mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-1/2 mx-auto mb-4" />
                  <div className="h-3 bg-gray-100 rounded mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-4/5" />
                </div>
              ))
            ) : (
              providers.map((p) => {
                return (
                  <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center flex flex-col">
                    <div className="flex justify-center mb-3">
                      <Avatar name={p.fullName} avatarUrl={p.avatarUrl} size={80} />
                    </div>
                    <h3 className="font-bold text-gray-900 text-base mb-0.5">{p.fullName}</h3>
                    <p className="text-xs text-gray-500 mb-2">{cfg.heroProviderTitle}</p>
                    {p.specializations.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 justify-center mb-3">
                        {p.specializations.map((s) => (
                          <span
                            key={s}
                            className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                            style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                    {p.hourlyRate && (
                      <p className="text-xs text-gray-400 mb-3">
                        <span className="text-lg font-extrabold text-gray-900">
                          ₺{p.hourlyRate.toLocaleString('tr-TR')}
                        </span> / saat
                      </p>
                    )}
                    <Link
                      to={`/providers/${p.id}`}
                      className="block w-full py-2.5 rounded-xl text-xs font-bold text-white transition-opacity hover:opacity-90 mt-auto"
                      style={{ background: 'var(--color-primary)' }}
                    >
                      Profilini Gör
                    </Link>
                  </div>
                )
              })
            )}
          </div>

          {/* Feature cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {cfg.featureCards.map(({ title, desc, iconKey }) => {
              const Icon = ICON_MAP[iconKey]
              return (
                <div key={title} className="flex gap-4 p-5 rounded-2xl border border-gray-100 bg-white">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--color-primary-light)' }}
                  >
                    <Icon size={20} style={{ color: 'var(--color-primary)' }} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm mb-1">{title}</h3>
                    <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>


      {/* ── How it works ────────────────────────────────────────────────────── */}
      <section id="nasil-calisir" className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">Nasıl Çalışır?</h2>
            <p className="text-gray-500">4 adımda {cfg.sessionLabel} başla</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {cfg.howItWorks.map((item, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 text-center shadow-sm border border-gray-100">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3 mx-auto"
                  style={{ background: 'var(--color-primary-light)' }}
                >
                  {item.icon}
                </div>
                <div className="text-xs font-bold mb-1.5" style={{ color: 'var(--color-primary)' }}>
                  Adım {i + 1}
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-1">{item.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ──────────────────────────────────────────────────────── */}
      {providers.length > 0 && (
        <section className="py-14 px-4" style={{ background: 'var(--color-primary)' }}>
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
              İlk {cfg.sessionLabel.charAt(0).toUpperCase() + cfg.sessionLabel.slice(1)}i Hemen Planla
            </h2>
            <p className="text-white/75 mb-7 text-sm sm:text-base">
              Müsait saatleri gör, birkaç tıkla rezervasyonunu tamamla.
            </p>
            <a
              href="#ogretmenlerimiz"
              className="inline-block bg-white font-bold text-sm px-8 py-3.5 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:scale-105"
              style={{ color: 'var(--color-primary)' }}
            >
              {cfg.browseLabel} →
            </a>
          </div>
        </section>
      )}

      {/* ── FAQ ─────────────────────────────────────────────────────────────── */}
      <section id="sss" className="py-16 px-4 bg-white">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">
              Sıkça Sorulan Sorular
            </h2>
          </div>
          <div className="space-y-3">
            {cfg.faq.map((item, i) => (
              <FAQItem key={i} q={item.q} a={item.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="bg-gray-900 text-gray-400 py-10 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-8 mb-8">
            <div>
              <Logo size="md" className="text-white mb-3 block" />
              <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
                {cfg.heroSubtitle}
              </p>
            </div>
            <div className="flex gap-12">
              <div>
                <h4 className="text-white font-semibold text-sm mb-3">Hızlı Erişim</h4>
                <ul className="space-y-2 text-sm">
                  {providers.length > 0 && (
                    <li>
                      <a href="#ogretmenlerimiz" className="hover:text-white transition-colors">
                        Rezervasyon Yap
                      </a>
                    </li>
                  )}
                  <li><Link to="/login" className="hover:text-white transition-colors">Giriş Yap</Link></li>
                  <li><a href="#sss" className="hover:text-white transition-colors">SSS</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-semibold text-sm mb-3">Yasal</h4>
                <ul className="space-y-2 text-sm">
                  <li><Link to="/kvkk" className="hover:text-white transition-colors">KVKK</Link></li>
                  <li><Link to="/gizlilik" className="hover:text-white transition-colors">Gizlilik Politikası</Link></li>
                  <li><Link to="/kullanim-kosullari" className="hover:text-white transition-colors">Kullanım Koşulları</Link></li>
                  <li><Link to="/iptal-iade" className="hover:text-white transition-colors">İptal ve İade</Link></li>
                  <li><Link to="/mesafeli-satis-sozlesmesi" className="hover:text-white transition-colors">Mesafeli Satış Sözleşmesi</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-semibold text-sm mb-3">İletişim</h4>
                <ul className="space-y-2 text-sm">
                  <li><Link to="/iletisim" className="hover:text-white transition-colors">İletişim Sayfası</Link></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
            <span>© {new Date().getFullYear()} · Tüm hakları saklıdır.</span>
            <a href="https://pekinteknoloji.com" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors font-medium">
              Bu site Pekin Teknoloji tarafından hazırlanmıştır.
            </a>
            <span className="flex items-center gap-1.5"><MapPin size={11} /> Yeni Selanik Pasajı No:3/6, Beyoğlu / İstanbul</span>
          </div>
        </div>
      </footer>

    </div>
  )
}
