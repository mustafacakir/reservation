export default function GizlilikPolitikasiPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Gizlilik Politikası</h1>
      <p className="text-sm text-gray-400 mb-10">Son güncelleme: Mart 2025</p>

      <div className="prose prose-gray max-w-none space-y-8 text-gray-700 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">1. Veri Sorumlusu</h2>
          <p>sevdailematematik² olarak, 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında veri sorumlusu sıfatıyla hareket etmekteyiz. Platformumuzu kullanan öğrenci ve öğretmenlerin kişisel verileri bu politika çerçevesinde işlenmektedir.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">2. Toplanan Veriler</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Ad, soyad ve e-posta adresi (hesap oluşturma)</li>
            <li>Ödeme bilgileri (iyzico altyapısı üzerinden, kart verileri tarafımızca saklanmaz)</li>
            <li>Rezervasyon geçmişi ve ders notları</li>
            <li>Profil fotoğrafı (isteğe bağlı)</li>
            <li>IP adresi ve oturum verileri</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">3. Verilerin İşlenme Amacı</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Rezervasyon hizmetinin sunulması ve yönetimi</li>
            <li>Ödeme işlemlerinin gerçekleştirilmesi</li>
            <li>Öğretmen ve öğrenci eşleştirmesi</li>
            <li>Yasal yükümlülüklerin yerine getirilmesi</li>
            <li>Hizmet kalitesinin artırılması</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">4. Verilerin Paylaşımı</h2>
          <p>Kişisel verileriniz; ödeme altyapısı sağlayıcısı iyzico, yasal zorunluluk durumlarında yetkili kamu kurumları ve hizmetin sunulması için zorunlu teknik altyapı sağlayıcıları dışında üçüncü taraflarla paylaşılmaz.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">5. Veri Güvenliği</h2>
          <p>Verileriniz TLS/SSL şifrelemesi ile korunmaktadır. Şifreler tek yönlü hash algoritması ile saklanır. Kart bilgileri sistemimizde tutulmaz; ödeme işlemleri iyzico'nun PCI-DSS sertifikalı altyapısı üzerinden gerçekleştirilir.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">6. Haklarınız</h2>
          <p>KVKK'nın 11. maddesi uyarınca; verilerinize erişim, düzeltme, silme ve işlemenin kısıtlanmasını talep etme haklarına sahipsiniz. Talepleriniz için <a href="mailto:destek@sevdailematematik.com" className="underline text-indigo-600">destek@sevdailematematik.com</a> adresine başvurabilirsiniz.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">7. İletişim</h2>
          <p>Bu politikayla ilgili sorularınız için: <a href="mailto:destek@sevdailematematik.com" className="underline text-indigo-600">destek@sevdailematematik.com</a></p>
        </section>
      </div>
    </div>
  )
}
