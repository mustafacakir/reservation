export default function KvkkPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">KVKK Aydınlatma Metni</h1>
      <p className="text-sm text-gray-400 mb-10">6698 Sayılı Kişisel Verilerin Korunması Kanunu Kapsamında</p>

      <div className="space-y-8 text-gray-700 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Veri Sorumlusu</h2>
          <p>sevdailematematik² platformu olarak, 6698 sayılı Kişisel Verilerin Korunması Kanunu'nun ("KVKK") 10. maddesi uyarınca kişisel verilerinizin işlenmesine ilişkin sizi aydınlatmak isteriz.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">İşlenen Kişisel Veriler</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Kimlik verileri:</strong> Ad, soyad</li>
            <li><strong>İletişim verileri:</strong> E-posta adresi</li>
            <li><strong>Finansal veriler:</strong> Ödeme işlem kayıtları (kart bilgileri iyzico'da saklanır)</li>
            <li><strong>İşlem güvenliği verileri:</strong> IP adresi, oturum bilgileri</li>
            <li><strong>Görsel veri:</strong> Profil fotoğrafı (isteğe bağlı)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Kişisel Verilerin İşlenme Amaçları</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Hizmet sözleşmesinin ifası (KVKK m.5/2-c)</li>
            <li>Yasal yükümlülüklerin yerine getirilmesi (KVKK m.5/2-ç)</li>
            <li>Meşru menfaat kapsamında hizmet kalitesinin artırılması (KVKK m.5/2-f)</li>
            <li>Açık rızaya dayalı pazarlama iletişimi (KVKK m.5/1)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Kişisel Verilerin Aktarımı</h2>
          <p>Kişisel verileriniz; ödeme hizmetleri için iyzico Ödeme Hizmetleri A.Ş.'ye, yasal zorunluluk halinde yetkili kamu kurum ve kuruluşlarına aktarılabilir. Yurt dışına aktarım yapılmamaktadır.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Kişisel Verilerin Saklanma Süresi</h2>
          <p>Verileriniz, hizmet ilişkisinin devamı süresince ve ilişkinin sona ermesinden itibaren yasal saklama süreleri boyunca (finansal veriler için 10 yıl) saklanır.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">KVKK Kapsamındaki Haklarınız</h2>
          <p className="mb-2">KVKK'nın 11. maddesi uyarınca aşağıdaki haklara sahipsiniz:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
            <li>İşlenmişse buna ilişkin bilgi talep etme</li>
            <li>İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme</li>
            <li>Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme</li>
            <li>Eksik veya yanlış işlenmişse düzeltilmesini isteme</li>
            <li>Silinmesini veya yok edilmesini isteme</li>
            <li>İşlemenin kısıtlanmasını talep etme</li>
            <li>İşlemeye itiraz etme</li>
            <li>Otomatik sistemler aracılığıyla aleyhinize bir sonucun ortaya çıkmasına itiraz etme</li>
            <li>Kanuna aykırı işleme nedeniyle zarara uğramanız halinde zararın giderilmesini talep etme</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Başvuru</h2>
          <p>Haklarınızı kullanmak için <a href="mailto:destek@sevdailematematik.com" className="underline text-indigo-600">destek@sevdailematematik.com</a> adresine kimliğinizi doğrulayan belgeler eşliğinde yazılı başvuruda bulunabilirsiniz. Başvurunuz en geç 30 gün içinde yanıtlanacaktır.</p>
        </section>
      </div>
    </div>
  )
}
