export default function IptalIadePolitikasiPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">İptal ve İade Politikası</h1>
      <p className="text-sm text-gray-400 mb-10">Son güncelleme: Haziran 2025</p>

      <div className="space-y-8 text-gray-700 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">1. Genel Kural</h2>
          <p>
            sevdailematematik² platformu üzerinden gerçekleştirilen ders rezervasyonlarında iptal ve iade talepleri
            aşağıdaki koşullara göre değerlendirilmektedir. Ödeme KuveytTürk Sanal POS altyapısı üzerinden
            güvenli biçimde tahsil edilmekte olup iade işlemleri aynı ödeme kanalı aracılığıyla yapılmaktadır.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">2. İptal Koşulları</h2>
          <div className="overflow-x-auto">
            <table className="w-full border border-gray-200 rounded-xl text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-4 py-3 font-semibold text-gray-800 border-b border-gray-200">İptal Zamanı</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-800 border-b border-gray-200">İade Durumu</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="px-4 py-3">Ders başlangıcından 24 saat veya daha fazla önce</td>
                  <td className="px-4 py-3 text-green-700 font-medium">Tam iade (%100)</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="px-4 py-3">Ders başlangıcından 12–24 saat önce</td>
                  <td className="px-4 py-3 text-yellow-700 font-medium">Kısmi iade (%50)</td>
                </tr>
                <tr>
                  <td className="px-4 py-3">Ders başlangıcına 12 saatten az kala</td>
                  <td className="px-4 py-3 text-red-700 font-medium">İade yapılmaz</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">3. Öğretmen Kaynaklı İptaller</h2>
          <p>
            Öğretmenin dersi iptal etmesi ya da derse girmemesi durumunda ödenen tutar <strong>tam olarak iade edilir</strong>.
            İade süresi, ödemenin banka hesabınıza yansıması için kartınızı çıkaran bankaya bağlı olarak 3–10 iş günü
            arasında değişebilir.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">4. İade Süreci</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>İade talepleri <strong>destek@sevdailematematik.com</strong> adresine e-posta ile iletilmelidir.</li>
            <li>E-postada rezervasyon numaranızı ve iptal gerekçenizi belirtiniz.</li>
            <li>Talepler en geç 2 iş günü içinde değerlendirilerek tarafınıza geri dönüş yapılır.</li>
            <li>Onaylanan iadeler 3–10 iş günü içinde ödeme yaptığınız kart hesabına aktarılır.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">5. Cayma Hakkı</h2>
          <p>
            6502 sayılı Tüketicinin Korunması Hakkında Kanun'un 49. maddesi uyarınca, dijital hizmetlerde tüketicinin
            onayıyla hizmete başlanmış olması halinde cayma hakkı kullanılamaz. Rezervasyon onaylandıktan ve ders
            gerçekleştikten sonra cayma hakkı doğmamaktadır. Ders henüz gerçekleşmemişse yukarıdaki iptal koşulları
            geçerlidir.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">6. İletişim</h2>
          <p>
            İptal ve iade talepleriniz için:{' '}
            <a href="mailto:destek@sevdailematematik.com" className="text-indigo-600 hover:underline">
              destek@sevdailematematik.com
            </a>
          </p>
        </section>
      </div>
    </div>
  )
}
