export default function IptalIadePolitikasiPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">İptal ve İade Politikası</h1>
      <p className="text-sm text-gray-400 mb-10">Son güncelleme: Haziran 2026</p>

      <div className="space-y-8 text-gray-700 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">1. Genel Kural</h2>
          <p>
            sevdailematematik² platformu üzerinden gerçekleştirilen ders rezervasyonlarında iptal ve iade koşulları
            ders türüne göre farklılık göstermektedir. Ödeme KuveytTürk Sanal POS altyapısı üzerinden güvenli
            biçimde tahsil edilmektedir.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">2. Grup Dersleri</h2>
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="font-semibold text-red-800 mb-1">Grup derslerinde rezervasyon iptal edilemez.</p>
            <p className="text-red-700">
              Grup dersleri sabit takvime bağlı olup kontenjan sınırlıdır. Rezervasyon tamamlandıktan sonra
              herhangi bir nedenle iptal talebi kabul edilmez ve ücret iadesi yapılmaz.
            </p>
          </div>
          <p className="mt-3 text-gray-500">
            Öğretmen kaynaklı iptallerde destek ekibimize başvurabilirsiniz:{' '}
            <a href="mailto:destek@sevdailematematik.com" className="text-indigo-600 hover:underline">
              destek@sevdailematematik.com
            </a>
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">3. Bireysel (Birebir) Dersler</h2>
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl mb-3">
            <p className="font-semibold text-blue-800 mb-1">Bireysel derslerde ücret iadesi yapılmaz; yalnızca tarih değişimi talep edilebilir.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border border-gray-200 rounded-xl text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-4 py-3 font-semibold text-gray-800 border-b border-gray-200">Talep Zamanı</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-800 border-b border-gray-200">Tarih Değişimi</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-800 border-b border-gray-200">Ücret İadesi</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="px-4 py-3">Ders başlangıcından 24 saat veya daha fazla önce</td>
                  <td className="px-4 py-3 text-green-700 font-medium">Talep edilebilir</td>
                  <td className="px-4 py-3 text-red-700 font-medium">Yapılmaz</td>
                </tr>
                <tr>
                  <td className="px-4 py-3">Ders başlangıcına 24 saatten az kala</td>
                  <td className="px-4 py-3 text-red-700 font-medium">Talep edilemez</td>
                  <td className="px-4 py-3 text-red-700 font-medium">Yapılmaz</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-gray-500">
            Tarih değişimi talebi en fazla 1 kez kullanılabilir. Yeni tarih, öğretmenin uygun saatlerinden seçilir.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">4. Öğretmen Kaynaklı İptaller</h2>
          <p>
            Öğretmenin dersi iptal etmesi ya da derse girmemesi durumunda bireysel derslerde ödenen tutar
            <strong> tam olarak iade edilir</strong>. İade süresi, kartınızı çıkaran bankaya bağlı olarak 3–10 iş
            günü arasında değişebilir.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">5. Tarih Değişimi Talebi</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Talepler <strong>destek@sevdailematematik.com</strong> adresine e-posta ile iletilmelidir.</li>
            <li>E-postada rezervasyon numaranızı ve tercih ettiğiniz yeni tarihi belirtiniz.</li>
            <li>Talepler en geç 2 iş günü içinde değerlendirilerek tarafınıza geri dönüş yapılır.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">6. Cayma Hakkı</h2>
          <p>
            6502 sayılı Tüketicinin Korunması Hakkında Kanun'un 49. maddesi uyarınca, dijital hizmetlerde tüketicinin
            onayıyla hizmete başlanmış olması halinde cayma hakkı kullanılamaz. Rezervasyon onaylandıktan ve ders
            gerçekleştikten sonra cayma hakkı doğmamaktadır.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">7. İletişim</h2>
          <p>
            Her türlü talep ve sorularınız için:{' '}
            <a href="mailto:destek@sevdailematematik.com" className="text-indigo-600 hover:underline">
              destek@sevdailematematik.com
            </a>
          </p>
        </section>
      </div>
    </div>
  )
}
