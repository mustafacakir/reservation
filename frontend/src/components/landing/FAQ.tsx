import { useState } from 'react'

const faqs = [
  {
    q: 'Nasıl rezervasyon yapabilirim?',
    a: 'Öğretmen sayfasına gidin, ders türünü ve uygun saati seçin. Hesabınızla giriş yaparak rezervasyonu tamamlayabilirsiniz. Tüm süreç 2 dakikadan kısa sürer.',
  },
  {
    q: 'Dersler online mı, yüz yüze mi?',
    a: 'Öğretmenlerimiz hem online hem de yüz yüze ders seçeneği sunabilmektedir. Öğretmen profil sayfasında bu bilgiyi görebilirsiniz.',
  },
  {
    q: 'Rezervasyonumu iptal edebilir miyim?',
    a: 'Evet, ders başlangıcından en az 24 saat önce ücretsiz iptal yapabilirsiniz. İptal talebinizi "Rezervasyonlarım" sayfasından iletebilirsiniz.',
  },
  {
    q: 'Öğretmen seçiminde neye dikkat etmeliyim?',
    a: 'Öğretmenin uzmanlık alanı, fiyatı ve öğrenci yorumlarını incelemenizi öneririz. Her öğretmenin profil sayfasında detaylı bilgi ve değerlendirmeler yer almaktadır.',
  },
  {
    q: 'Ödeme nasıl yapılır?',
    a: 'Rezervasyon onaylandıktan sonra güvenli ödeme sistemi üzerinden kredi/banka kartıyla ödeme yapabilirsiniz. Ödeme bilgileriniz şifreli olarak korunur.',
  },
  {
    q: 'Öğretmene not ya da mesaj gönderebilir miyim?',
    a: 'Rezervasyon sırasında öğretmene özel not bırakabilirsiniz. Odaklanmak istediğiniz konuları ve seviyenizi belirtmeniz dersin verimliliğini artırır.',
  },
]

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section id="sss" className="py-20 px-4 bg-white">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">
            Sıkça Sorulan Sorular
          </h2>
          <p className="text-gray-500">Aklınızdaki soruların cevapları burada.</p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="border border-gray-100 rounded-2xl overflow-hidden transition-all"
              style={open === i ? { borderColor: 'var(--color-primary)', boxShadow: '0 0 0 2px var(--color-primary-light)' } : {}}
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-4 text-left"
              >
                <span className="font-semibold text-gray-900 text-sm sm:text-base">{faq.q}</span>
                <span
                  className="flex-shrink-0 ml-4 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-all"
                  style={open === i
                    ? { background: 'var(--color-primary)', color: 'white' }
                    : { background: 'var(--color-primary-light)', color: 'var(--color-primary)' }
                  }
                >
                  {open === i ? '−' : '+'}
                </span>
              </button>
              {open === i && (
                <div className="px-6 pb-5">
                  <p className="text-sm text-gray-600 leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
