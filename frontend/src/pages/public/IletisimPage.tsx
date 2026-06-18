import { Mail, MapPin, Globe, Phone } from 'lucide-react'

export default function IletisimPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">İletişim</h1>
      <p className="text-sm text-gray-400 mb-10">Sorularınız için bize ulaşın.</p>

      <div className="grid sm:grid-cols-2 gap-6 mb-12">
        <a
          href="mailto:destek@sevdailematematik.com"
          className="flex items-start gap-4 p-5 bg-white border border-gray-200 rounded-2xl hover:border-indigo-300 hover:shadow-sm transition-all"
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--color-primary-light)' }}>
            <Mail size={18} style={{ color: 'var(--color-primary)' }} />
          </div>
          <div>
            <p className="font-semibold text-gray-800 text-sm">E-posta</p>
            <p className="text-sm text-gray-500 mt-0.5">destek@sevdailematematik.com</p>
            <p className="text-xs text-gray-400 mt-1">En geç 2 iş günü içinde yanıt</p>
          </div>
        </a>

        <div className="flex items-start gap-4 p-5 bg-white border border-gray-200 rounded-2xl">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--color-primary-light)' }}>
            <MapPin size={18} style={{ color: 'var(--color-primary)' }} />
          </div>
          <div>
            <p className="font-semibold text-gray-800 text-sm">Adres</p>
            <p className="text-sm text-gray-500 mt-0.5">Kemankeş Karamustafa Hayvar Han İçi Sk.</p>
            <p className="text-sm text-gray-500">Yeni Selanik Pasajı No:3 İç Kapı No:6</p>
            <p className="text-sm text-gray-500">Beyoğlu / İstanbul / Türkiye</p>
          </div>
        </div>

        <a
          href="tel:+905415740545"
          className="flex items-start gap-4 p-5 bg-white border border-gray-200 rounded-2xl hover:border-indigo-300 hover:shadow-sm transition-all"
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--color-primary-light)' }}>
            <Phone size={18} style={{ color: 'var(--color-primary)' }} />
          </div>
          <div>
            <p className="font-semibold text-gray-800 text-sm">Telefon</p>
            <p className="text-sm text-gray-500 mt-0.5">0541 574 05 45</p>
          </div>
        </a>

        <div className="flex items-start gap-4 p-5 bg-white border border-gray-200 rounded-2xl">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--color-primary-light)' }}>
            <Globe size={18} style={{ color: 'var(--color-primary)' }} />
          </div>
          <div>
            <p className="font-semibold text-gray-800 text-sm">Web Sitesi</p>
            <p className="text-sm text-gray-500 mt-0.5">www.sevdailematematik.com</p>
            <p className="text-sm text-gray-400 mt-1">Vergi No: 7260274780</p>
          </div>
        </div>
      </div>

      <div className="p-6 bg-gray-50 rounded-2xl border border-gray-200">
        <h2 className="font-semibold text-gray-800 mb-4">Sık Sorulan Sorular</h2>
        <div className="space-y-4">
          {[
            {
              q: 'Rezervasyonumu nasıl iptal edebilirim?',
              a: 'Ders başlangıcından en az 12 saat önce destek@sevdailematematik.com adresine e-posta göndererek iptal talebinde bulunabilirsiniz.',
            },
            {
              q: 'Ödeme güvenli mi?',
              a: 'Evet. Tüm ödemeler KuveytTürk Bankası\'nın 3D Secure altyapısı üzerinden şifreli olarak işlenir. Kart bilgileriniz sitemizde saklanmaz.',
            },
            {
              q: 'İade ne zaman hesabıma geçer?',
              a: 'Onaylanan iadeler 3–10 iş günü içinde ödeme yaptığınız kart hesabına yansır.',
            },
          ].map((item) => (
            <div key={item.q} className="border-b border-gray-200 pb-4 last:border-0 last:pb-0">
              <p className="font-medium text-gray-800 text-sm mb-1">{item.q}</p>
              <p className="text-gray-500 text-sm">{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
