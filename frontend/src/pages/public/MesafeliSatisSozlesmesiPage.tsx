export default function MesafeliSatisSozlesmesiPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Mesafeli Satış Sözleşmesi</h1>
      <p className="text-sm text-gray-400 mb-10">Son güncelleme: Haziran 2026</p>

      <div className="space-y-8 text-gray-700 text-sm leading-relaxed">

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">MADDE 1 — TARAFLAR</h2>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <p className="font-semibold text-gray-800 mb-1">SATICI</p>
              <p><strong>Ticari Unvan:</strong> sevdailematematik²</p>
              <p><strong>Adres:</strong> Kemankeş Karamustafa Hayvar Han İçi Sk. Yeni Selanik Pasajı No:3 İç Kapı No:6, Beyoğlu / İstanbul / Türkiye</p>
              <p><strong>Vergi No:</strong> 7260274780</p>
              <p><strong>Telefon:</strong> 0541 574 05 45</p>
              <p><strong>E-posta:</strong> destek@sevdailematematik.com</p>
              <p><strong>Web Sitesi:</strong> www.sevdailematematik.com</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <p className="font-semibold text-gray-800 mb-1">ALICI (MÜŞTERİ)</p>
              <p>Platformda kayıtlı üye bilgileri esas alınır. Rezervasyon tamamlandığında alıcı bilgileri sisteme kayıtlı
                ad-soyad ve e-posta adresinden oluşmaktadır.</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">MADDE 2 — SÖZLEŞMENİN KONUSU</h2>
          <p>
            İşbu sözleşme, Alıcı'nın www.sevdailematematik.com adresindeki platform üzerinden satın aldığı
            <strong> online matematik dersi rezervasyonu</strong> hizmetine ilişkin tarafların hak ve yükümlülüklerini
            6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği hükümleri
            çerçevesinde düzenlemektedir.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">MADDE 3 — HİZMET BİLGİLERİ</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Hizmet Türü:</strong> Online birebir veya grup matematik dersi</li>
            <li><strong>Sunum Şekli:</strong> Video konferans yoluyla uzaktan (dijital hizmet)</li>
            <li><strong>Süre:</strong> Seçilen hizmet paketinde belirtilen dakika</li>
            <li><strong>Ücret:</strong> Rezervasyon sırasında gösterilen tutar (KDV dahil, TL)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">MADDE 4 — ÖDEME KOŞULLARI</h2>
          <p>
            Ödeme, KuveytTürk Bankası Sanal POS altyapısı üzerinden 3D Secure güvenlik protokolü ile tahsil edilir.
            Kart bilgileri Satıcı tarafından saklanmaz; tüm ödeme işlemleri KuveytTürk'ün güvenli altyapısında
            gerçekleştirilir. Ödeme onaylanmadan rezervasyon kesinleşmez.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">MADDE 5 — HİZMETİN İFASI</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Rezervasyon tamamlanmasının ardından Alıcı'ya e-posta ile onay gönderilir.</li>
            <li>Ders, seçilen tarih ve saatte öğretmen tarafından online olarak verilir.</li>
            <li>Hizmet ifası için internet bağlantısı ve video konferans uygulaması kullanılması gerekmektedir.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">MADDE 6 — CAYMA HAKKI</h2>
          <p>
            Mesafeli Sözleşmeler Yönetmeliği'nin 15. maddesi (ğ) bendi uyarınca; Alıcı'nın onayıyla belirli bir
            tarih veya dönem için ifası gerçekleştirilen hizmetlerde cayma hakkı kullanılamaz. Ders rezervasyonunun
            onaylanması ve dersin gerçekleşmesi halinde cayma hakkı ortadan kalkar.
          </p>
          <p className="mt-2">
            Ders henüz gerçekleşmemişse aşağıdaki Madde 7'de belirtilen koşullar geçerlidir.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">MADDE 7 — İPTAL VE İADE</h2>
          <p className="mb-3">
            İptal ve iade koşulları ders türüne göre farklıdır:
          </p>
          <div className="space-y-3">
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="font-semibold text-red-800 mb-1">Grup Dersleri</p>
              <p className="text-red-700 text-sm">
                Grup derslerinde rezervasyon iptal edilemez ve ücret iadesi yapılmaz. Öğretmen kaynaklı
                iptallerde Satıcı ile iletişime geçilmelidir.
              </p>
            </div>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <p className="font-semibold text-blue-800 mb-1">Bireysel (Birebir) Dersler</p>
              <p className="text-blue-700 text-sm">
                Bireysel derslerde ücret iadesi yapılmaz. Ders başlangıcından en az <strong>24 saat önce</strong>{' '}
                başvurulması halinde yalnızca <strong>tarih değişimi</strong> talep edilebilir.
                Tarih değişimi hakkı rezervasyon başına 1 kez kullanılabilir.
              </p>
            </div>
          </div>
          <p className="mt-3">
            Detaylı bilgi için{' '}
            <a href="/iptal-iade-politikasi" className="text-indigo-600 hover:underline">
              İptal ve İade Politikası
            </a>{' '}
            sayfasını inceleyiniz.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">MADDE 8 — GİZLİLİK VE KİŞİSEL VERİLER</h2>
          <p>
            Alıcı'ya ait kişisel veriler, 6698 sayılı KVKK kapsamında işlenmekte ve üçüncü taraflarla
            Gizlilik Politikası'nda belirtilen istisnalar dışında paylaşılmamaktadır.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">MADDE 9 — UYUŞMAZLIK ÇÖZÜMÜ</h2>
          <p>
            İşbu sözleşmeden doğan uyuşmazlıklarda Türkiye Cumhuriyeti mahkemeleri yetkili olup uygulanacak hukuk
            Türk Hukuku'dur. Tüketici hakları için İl veya İlçe Tüketici Hakem Heyetleri'ne başvurulabilir.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">MADDE 10 — YÜRÜRLÜK</h2>
          <p>
            Alıcı, rezervasyon işlemini tamamlayarak işbu sözleşmeyi elektronik ortamda okuduğunu, anladığını ve
            kabul ettiğini beyan eder. Sözleşme, ödemenin onaylanmasıyla birlikte yürürlüğe girer.
          </p>
        </section>

      </div>
    </div>
  )
}
