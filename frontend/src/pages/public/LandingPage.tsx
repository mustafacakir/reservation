import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Star, CalendarCheck, BookOpen, Award, ChevronDown, ChevronUp, MapPin, Monitor } from 'lucide-react'
import { providersApi } from '@/api/endpoints/providers.api'
import { useTenantStore } from '@/store/tenant.store'
import Logo from '@/components/landing/Logo'

// ── Types ─────────────────────────────────────────────────────────────────────

const SUBJECTS = [
  { icon: '🏫', label: 'İlkokul Matematiği' },
  { icon: '📐', label: 'Ortaokul Matematiği' },
  { icon: '📏', label: 'Lise Matematiği' },
  { icon: '📊', label: 'TYT Matematik' },
  { icon: '📈', label: 'AYT Matematik' },
  { icon: '🎓', label: 'DGS Matematik' },
  { icon: '📝', label: 'ALES Matematik' },
  { icon: '🏛️', label: 'KPSS Matematik' },
]

const HOW_IT_WORKS = [
  { icon: '📅', step: '1', title: 'Müsait Saati Seç', desc: 'Takvimden sana uygun gün ve saati seç.' },
  { icon: '✅', step: '2', title: 'Rezervasyon Yap', desc: 'Hesabınla giriş yap, dersi onayla.' },
  { icon: '💳', step: '3', title: 'Güvenli Öde', desc: 'Kartınla güvenli şekilde ödeme yap.' },
  { icon: '📚', step: '4', title: 'Derse Katıl', desc: 'Online veya yüz yüze — sana uygun.' },
]

const REVIEWS = [
  {
    name: 'Elif K.',
    grade: 'TYT Öğrencisi',
    avatar: 'EK',
    rating: 5,
    text: 'Sevda Öğretmen sayesinde TYT matematikte çok ciddi bir ilerleme kaydettim. Konuları çok net anlatıyor, sorularımı hiç bırakmıyor. Kesinlikle tavsiye ederim!',
  },
  {
    name: 'Mehmet A.',
    grade: 'Lise 11. Sınıf',
    avatar: 'MA',
    rating: 5,
    text: 'Daha önce matematik dersinde sürekli zorlanıyordum, Sevda Öğretmen ile başladıktan sonra hem notlarım düzeldi hem de matematiği sevdim. Harika bir öğretmen!',
  },
  {
    name: 'Zeynep T.',
    grade: 'KPSS Adayı',
    avatar: 'ZT',
    rating: 5,
    text: 'Online dersler çok verimli geçiyor. Konu anlatımı sade ve akılda kalıcı. KPSS matematik puanımı 15 puandan 28\'e çıkardım, çok teşekkürler!',
  },
  {
    name: 'Burak Y.',
    grade: 'Ortaokul 8. Sınıf',
    avatar: 'BY',
    rating: 5,
    text: 'Oğlumun LGS hazırlığı için başladık. Çok sabırlı ve anlayışlı bir öğretmen. Her dersten sonra oğlum daha güvenli geliyor eve. Gerçekten memnunuz.',
  },
  {
    name: 'Seda M.',
    grade: 'AYT Öğrencisi',
    avatar: 'SM',
    rating: 5,
    text: 'AYT matematik için başvurdum, beklentilerimin çok üzerinde bir ders aldım. Problem çözme teknikleri mükemmel, çok teşekkür ederim.',
  },
  {
    name: 'Hasan Ç.',
    grade: 'DGS Adayı',
    avatar: 'HÇ',
    rating: 5,
    text: 'DGS\'ye hazırlanırken başladım. Ders programı tam ihtiyacıma yönelik hazırlandı. Sonuçtan çok memnunum, tavsiye ederim.',
  },
]

const FAQS = [
  {
    q: 'Dersler online mı, yüz yüze mi?',
    a: 'Her iki seçenek de mevcuttur. İstanbul\'da yüz yüze ders alabilir ya da online bağlanabilirsiniz. Rezervasyon sırasında tercihini belirtebilirsin.',
  },
  {
    q: 'Hangi sınavlara hazırlanabilirim?',
    a: 'TYT, AYT, DGS, ALES ve KPSS sınavlarına yönelik özel hazırlık programları sunulmaktadır. Ayrıca ilkokul, ortaokul ve lise düzeyinde destek ders de verilmektedir.',
  },
  {
    q: 'Ders ücreti nasıl belirleniyor?',
    a: 'Her ders türünün sabit bir ücreti vardır. Rezervasyon öncesinde fiyatı şeffaf şekilde görebilirsiniz. Gizli ücret yoktur.',
  },
  {
    q: 'Rezervasyonumu iptal edebilir miyim?',
    a: 'Ders başlangıcından 24 saat öncesine kadar ücretsiz iptal yapabilirsiniz. "Rezervasyonlarım" sayfasından kolayca iptal edebilirsiniz.',
  },
  {
    q: 'İlk derste ne yapılır?',
    a: 'İlk ders tanışma ve seviye tespiti odaklıdır. Hedefleriniz belirlenir, kişiselleştirilmiş bir çalışma planı oluşturulur.',
  },
]

// ── Components ────────────────────────────────────────────────────────────────

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

function FAQItem({ faq }: { faq: typeof FAQS[0] }) {
  const [open, setOpen] = useState(false)
  return (
    <div
      className="border rounded-2xl overflow-hidden transition-all"
      style={open ? { borderColor: 'var(--color-primary)', boxShadow: '0 0 0 2px var(--color-primary-light, #ede9fe)' } : { borderColor: '#f3f4f6' }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left gap-4"
      >
        <span className="font-semibold text-gray-900 text-sm sm:text-base">{faq.q}</span>
        {open
          ? <ChevronUp size={18} className="flex-shrink-0 text-gray-400" />
          : <ChevronDown size={18} className="flex-shrink-0 text-gray-400" />
        }
      </button>
      {open && (
        <div className="px-5 pb-4">
          <p className="text-sm text-gray-600 leading-relaxed">{faq.a}</p>
        </div>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const { slug } = useTenantStore()

  const { data, isLoading } = useQuery({
    queryKey: ['landing-teacher', slug],
    queryFn: () => providersApi.search({ page: 1, pageSize: 1 }),
    enabled: !!slug,
    staleTime: 1000 * 60 * 5,
  })

  const teacher = data?.items[0] ?? null
  const bioText = teacher?.bio ? teacher.bio.replace(/<[^>]*>/g, '').trim() : null

  return (
    <div className="min-h-screen bg-white">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-16 pb-20 px-4" style={{ background: 'linear-gradient(160deg, var(--color-primary-light, #ede9fe) 0%, #fff 60%)' }}>
        {/* Decorative symbols */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden>
          {['∑', '√', 'π', '∞', '∫', '÷'].map((s, i) => (
            <span
              key={i}
              className="absolute font-black text-5xl sm:text-7xl opacity-[0.04]"
              style={{
                color: 'var(--color-primary)',
                fontFamily: 'Georgia, serif',
                top: `${10 + i * 15}%`,
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
                style={{ background: 'var(--color-primary-light, #ede9fe)', color: 'var(--color-primary)' }}
              >
                <MapPin size={12} /> İstanbul · Online & Yüz Yüze
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight mb-4">
                Matematikte<br />
                <span style={{ color: 'var(--color-primary)' }}>Başarıya Giden</span><br />
                Yol Buradan Başlıyor
              </h1>

              <p className="text-base sm:text-lg text-gray-600 mb-8 leading-relaxed max-w-lg mx-auto lg:mx-0">
                İlkokuldan üniversiteye, TYT'den KPSS'ye — uzman matematik öğretmeniyle birebir ders al, hedefine ulaş.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                {teacher ? (
                  <Link
                    to={`/providers/${teacher.id}`}
                    className="px-7 py-3.5 rounded-2xl text-sm font-bold text-white shadow-md transition-all hover:shadow-lg hover:scale-105"
                    style={{ background: 'var(--color-primary)' }}
                  >
                    Hemen Rezervasyon Yap →
                  </Link>
                ) : (
                  <Link
                    to="/register"
                    className="px-7 py-3.5 rounded-2xl text-sm font-bold text-white shadow-md transition-all hover:shadow-lg hover:scale-105"
                    style={{ background: 'var(--color-primary)' }}
                  >
                    Hemen Başla →
                  </Link>
                )}
                <a
                  href="#nasil-calisir"
                  className="px-7 py-3.5 rounded-2xl text-sm font-semibold text-gray-700 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all hover:scale-105"
                >
                  Nasıl çalışır?
                </a>
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap gap-4 justify-center lg:justify-start mt-8 text-xs text-gray-500">
                <span className="flex items-center gap-1.5"><Monitor size={13} /> Online ders</span>
                <span className="flex items-center gap-1.5"><MapPin size={13} /> İstanbul yüz yüze</span>
                <span className="flex items-center gap-1.5"><CalendarCheck size={13} /> Esnek saatler</span>
              </div>
            </div>

            {/* Teacher card */}
            <div className="flex-shrink-0 w-full max-w-xs">
              {isLoading ? (
                <div className="bg-white rounded-3xl shadow-xl p-6 animate-pulse">
                  <div className="w-28 h-28 rounded-3xl bg-gray-100 mx-auto mb-4" />
                  <div className="h-5 bg-gray-100 rounded w-2/3 mx-auto mb-2" />
                  <div className="h-4 bg-gray-100 rounded w-1/2 mx-auto mb-4" />
                  <div className="space-y-2">
                    {[1,2,3].map(i => <div key={i} className="h-3 bg-gray-100 rounded" />)}
                  </div>
                </div>
              ) : teacher ? (
                <div className="bg-white rounded-3xl shadow-xl p-6 text-center">
                  <div className="flex justify-center mb-4">
                    <Avatar name={teacher.fullName} avatarUrl={teacher.avatarUrl} size={112} />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">{teacher.fullName}</h2>
                  <p className="text-sm text-gray-500 mb-1">Matematik Öğretmeni</p>
                  {teacher.totalReviews > 0 && (
                    <div className="flex items-center justify-center gap-1 mb-3">
                      <Star size={13} className="text-amber-400 fill-amber-400" />
                      <span className="text-sm font-semibold text-gray-700">{teacher.averageRating.toFixed(1)}</span>
                      <span className="text-xs text-gray-400">({teacher.totalReviews} yorum)</span>
                    </div>
                  )}
                  {bioText && (
                    <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed mb-4">{bioText}</p>
                  )}
                  <div className="flex flex-wrap gap-1.5 justify-center mb-4">
                    {teacher.specializations.slice(0, 3).map((s) => (
                      <span
                        key={s}
                        className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                        style={{ background: 'var(--color-primary-light, #ede9fe)', color: 'var(--color-primary)' }}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                  {teacher.hourlyRate && (
                    <p className="text-xs text-gray-400 mb-4">
                      <span className="text-xl font-extrabold text-gray-900">₺{teacher.hourlyRate.toLocaleString('tr-TR')}</span> / saat
                    </p>
                  )}
                  <Link
                    to={`/providers/${teacher.id}`}
                    className="block w-full py-2.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
                    style={{ background: 'var(--color-primary)' }}
                  >
                    Rezervasyon Yap
                  </Link>
                </div>
              ) : null}
            </div>

          </div>
        </div>
      </section>

      {/* ── Subjects ── */}
      <section id="dersler" className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">Hangi Konuda Yardım İstiyorsun?</h2>
            <p className="text-gray-500">İlkokuldan üniversiteye tüm seviyelerde ders</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {SUBJECTS.map((s) => (
              <Link
                key={s.label}
                to={teacher ? `/providers/${teacher.id}` : '/register'}
                className="group flex flex-col items-center gap-2 p-4 rounded-2xl border border-gray-100 hover:border-transparent hover:shadow-md transition-all bg-white text-center"
                style={{ ['--hover-bg' as string]: 'var(--color-primary-light)' }}
              >
                <span className="text-2xl">{s.icon}</span>
                <span className="text-xs font-semibold text-gray-700 group-hover:text-[var(--color-primary)] transition-colors leading-snug">
                  {s.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why us ── */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">Neden Sevda Öğretmen?</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { Icon: Award, title: 'Uzman & Deneyimli', desc: 'Yılların deneyimiyle binlerce öğrenciye matematik öğretti.' },
              { Icon: CalendarCheck, title: 'Esnek Randevu', desc: 'Sana uygun saat ve günde, istediğin yerden ders al.' },
              { Icon: BookOpen, title: 'Kişisel Program', desc: 'Her öğrenciye özel müfredat, hedefe odaklı çalışma planı.' },
            ].map(({ Icon, title, desc }) => (
              <div key={title} className="flex gap-4 p-5 rounded-2xl border border-gray-100 bg-white">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--color-primary-light, #ede9fe)' }}
                >
                  <Icon size={20} style={{ color: 'var(--color-primary)' }} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm mb-1">{title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Reviews ── */}
      <section id="yorumlar" className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">Öğrenci Yorumları</h2>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <div className="flex">
                {[1,2,3,4,5].map(i => <Star key={i} size={15} className="text-amber-400 fill-amber-400" />)}
              </div>
              <span className="font-semibold text-gray-700">5.0</span>
              <span>· {REVIEWS.length} değerlendirme</span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {REVIEWS.map((r) => (
              <div key={r.name} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
                <div className="flex">
                  {[1,2,3,4,5].map(i => <Star key={i} size={13} className="text-amber-400 fill-amber-400" />)}
                </div>
                <p className="text-sm text-gray-600 leading-relaxed flex-1">"{r.text}"</p>
                <div className="flex items-center gap-3 pt-2 border-t border-gray-50">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    style={{ background: 'var(--color-primary)' }}
                  >
                    {r.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{r.name}</p>
                    <p className="text-xs text-gray-400">{r.grade}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="nasil-calisir" className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">Nasıl Çalışır?</h2>
            <p className="text-gray-500">4 adımda derse başla</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {HOW_IT_WORKS.map((item) => (
              <div key={item.step} className="bg-white rounded-2xl p-5 text-center shadow-sm border border-gray-100">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3 mx-auto"
                  style={{ background: 'var(--color-primary-light, #ede9fe)' }}
                >
                  {item.icon}
                </div>
                <div
                  className="text-xs font-bold mb-1.5"
                  style={{ color: 'var(--color-primary)' }}
                >
                  Adım {item.step}
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-1">{item.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      {teacher && (
        <section className="py-14 px-4" style={{ background: 'var(--color-primary)' }}>
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
              İlk Dersi Hemen Planla
            </h2>
            <p className="text-white/75 mb-7 text-sm sm:text-base">
              Müsait saatleri gör, birkaç tıkla rezervasyonunu tamamla.
            </p>
            <Link
              to={`/providers/${teacher.id}`}
              className="inline-block bg-white font-bold text-sm px-8 py-3.5 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:scale-105"
              style={{ color: 'var(--color-primary)' }}
            >
              Rezervasyon Yap →
            </Link>
          </div>
        </section>
      )}

      {/* ── FAQ ── */}
      <section id="sss" className="py-16 px-4 bg-white">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">Sıkça Sorulan Sorular</h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq, i) => <FAQItem key={i} faq={faq} />)}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-gray-900 text-gray-400 py-10 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-8 mb-8">
            <div>
              <Logo size="md" className="text-white mb-3 block" />
              <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
                İstanbul'da yüz yüze ve online matematik dersleri. İlkokuldan üniversiteye tüm seviyeler.
              </p>
            </div>
            <div className="flex gap-12">
              <div>
                <h4 className="text-white font-semibold text-sm mb-3">Hızlı Erişim</h4>
                <ul className="space-y-2 text-sm">
                  {teacher && <li><Link to={`/providers/${teacher.id}`} className="hover:text-white transition-colors">Rezervasyon Yap</Link></li>}
                  <li><Link to="/login" className="hover:text-white transition-colors">Giriş Yap</Link></li>
                  <li><a href="#sss" className="hover:text-white transition-colors">SSS</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-semibold text-sm mb-3">Yasal</h4>
                <ul className="space-y-2 text-sm">
                  <li><Link to="/kvkk" className="hover:text-white transition-colors">KVKK</Link></li>
                  <li><Link to="/gizlilik" className="hover:text-white transition-colors">Gizlilik</Link></li>
                  <li><Link to="/kullanim-kosullari" className="hover:text-white transition-colors">Kullanım Koşulları</Link></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-600">
            <span>© {new Date().getFullYear()} sevdailematematik. Tüm hakları saklıdır.</span>
            <span className="flex items-center gap-1.5"><MapPin size={11} /> İstanbul, Türkiye</span>
          </div>
        </div>
      </footer>

    </div>
  )
}
