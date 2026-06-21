export default function KullanımKosullariPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Kullanım Koşulları</h1>
      <p className="text-sm text-gray-400 mb-10">Son güncelleme: Haziran 2026</p>

      <div className="space-y-8 text-gray-700 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">1. Hizmetin Kapsamı</h2>
          <p>sevdailematematik², öğrenciler ile matematik öğretmenleri arasında ders rezervasyonu yapılmasına aracılık eden bir platformdur. Platform, öğretmen ile öğrenci arasındaki sözleşmenin tarafı değildir; yalnızca teknik aracılık hizmeti sunar.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">2. Üyelik Koşulları</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Hesap bilgilerinin doğru ve güncel tutulmasından kullanıcı sorumludur.</li>
            <li>Hesap güvenliğinizden siz sorumlusunuz; şifrenizi kimseyle paylaşmayınız.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">3. Rezervasyon ve Ödeme</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Ödeme, KuveytTürk Bankası Sanal POS altyapısı üzerinden 3D Secure ile alınır; ödeme tamamlandığında rezervasyon otomatik olarak onaylanır.</li>
            <li><strong>Grup dersleri:</strong> Satın alınan grup dersi rezervasyonları kesindir; iptal ve ücret iadesi yapılmaz.</li>
            <li><strong>Bireysel dersler:</strong> Ücret iadesi yapılmaz. Ders başlangıcından en az 24 saat önce talep edilmesi koşuluyla yalnızca tarih/saat değişikliği yapılabilir. 24 saatten az süre kala tarih değişikliği de kabul edilmez.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">4. Öğretmen Sorumlulukları</h2>
          <p>Öğretmenler, profil bilgilerinin doğruluğundan, belirtilen uzmanlık alanlarından ve ders süresi ile ücretlendirmeden bizzat sorumludur. Yanıltıcı bilgi paylaşımı hesap askıya alınmasına neden olabilir.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">5. Yasak İçerik ve Davranışlar</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Platform dışında ödeme yapmaya zorlamak veya yönlendirmek</li>
            <li>Hakaret, taciz ve ayrımcı içerik paylaşımı</li>
            <li>Sahte değerlendirme bırakmak</li>
            <li>Başkasının kimlik bilgilerini kullanmak</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">6. Sorumluluk Sınırı</h2>
          <p>sevdailematematik², öğretmen ile öğrenci arasındaki ders içeriği, kalitesi veya sonuçlarından sorumlu tutulamaz. Platform, teknik altyapı kesintilerinden kaynaklanabilecek olası kayıplar için azami ücret iadesi sağlar.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">7. Değişiklikler</h2>
          <p>Platform, bu koşulları önceden bildirimde bulunmak kaydıyla değiştirme hakkını saklı tutar. Değişiklikler yayımlandığı tarihten itibaren geçerlidir.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">8. İletişim</h2>
          <p><a href="mailto:destek@sevdailematematik.com" className="underline text-indigo-600">destek@sevdailematematik.com</a></p>
        </section>
      </div>
    </div>
  )
}
