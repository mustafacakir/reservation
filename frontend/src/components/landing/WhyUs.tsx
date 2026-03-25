const features = [
  {
    icon: '🎯',
    title: 'Uzman Öğretmenler',
    desc: 'Her öğretmen kendi alanında deneyimli. İlkokuldan üniversiteye, DGS\'den KPSS\'ye uzman eşleştirme.',
  },
  {
    icon: '📅',
    title: 'Esnek Saatler',
    desc: 'Öğretmenin müsait saatlerini anlık görün, dilediğiniz vakitte tek tıkla rezervasyon yapın.',
  },
  {
    icon: '💳',
    title: 'Şeffaf Fiyatlandırma',
    desc: 'Gizli ücret yok. Ders ücreti önceden bellidir, ödeme güvenli şekilde gerçekleşir.',
  },
  {
    icon: '🔄',
    title: 'Kolay İptal',
    desc: '24 saat öncesine kadar ücretsiz iptal. Planlarınız değişirse sorun yaşamazsınız.',
  },
  {
    icon: '⭐',
    title: 'Değerlendirmeli Sistem',
    desc: 'Gerçek öğrencilerin yorumları sayesinde doğru öğretmeni kolayca seçin.',
  },
  {
    icon: '📱',
    title: 'Her Cihazdan Erişim',
    desc: 'Telefon, tablet veya bilgisayardan kolayca giriş yapın, derslerinizi yönetin.',
  },
]

export default function WhyUs() {
  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">
            Neden <span style={{ color: 'var(--color-primary)' }}>sevdailematematik²</span>?
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            Öğrencilerimiz için en iyi öğrenme deneyimini sunmak için tasarlandık.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="group p-6 rounded-2xl border border-gray-100 hover:border-transparent hover:shadow-lg transition-all bg-white"
              style={{ '--hover-bg': 'var(--color-primary-light)' } as React.CSSProperties}
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-4"
                style={{ background: 'var(--color-primary-light)' }}
              >
                {f.icon}
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
