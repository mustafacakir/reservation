export interface CategoryItem {
  icon: string
  label: string
  slug: string
}

export interface HowItWorksStep {
  icon: string
  title: string
  desc: string
}

export interface TestimonialItem {
  name: string
  role: string
  avatar: string
  text: string
  rating: number
}

export interface SectorStats {
  icon: string
  value: string
  label: string
}

export interface SectorFaq {
  q: string
  a: string
}

export interface SectorFeatureCard {
  title: string
  desc: string
  iconKey: 'award' | 'calendar-check' | 'book-open' | 'heart' | 'shield' | 'target' | 'trending-up' | 'video' | 'zap' | 'badge-check' | 'users'
}

export interface SectorConfig {
  key: string
  label: string
  emoji: string
  heroTitle: string
  heroSubtitle: string
  heroSearchPlaceholder: string
  browseLabel: string
  providerLabel: string
  providersLabel: string
  providersHeading: string
  clientLabel: string
  sessionLabel: string
  heroProviderTitle: string
  navCategoriesLabel: string
  decorativeSymbols: string[]
  stats: SectorStats[]
  categories: CategoryItem[]
  howItWorks: HowItWorksStep[]
  featureCards: SectorFeatureCard[]
  faq: SectorFaq[]
  testimonials: TestimonialItem[]
  footerCtaTitle: string
  footerCtaSubtitle: string
  cssVars: {
    primary: string
    primaryDark: string
    primaryLight: string
    accent: string
    heroGradientFrom: string
    heroGradientTo: string
  }
}

// ── Sektörler ──────────────────────────────────────────────────────────────────

const education: SectorConfig = {
  key: 'tutoring',
  label: 'Özel Ders',
  emoji: '📚',
  heroTitle: 'Alanında uzman öğretmenlerle ders yap',
  heroSubtitle: 'Birebir veya grup derslerle, ihtiyacına uygun öğretmeni seç ve kolayca rezervasyon yap.',
  heroSearchPlaceholder: 'Öğretmen ara…',
  browseLabel: 'Öğretmenleri Gör',
  providerLabel: 'öğretmen',
  providersLabel: 'öğretmen',
  providersHeading: 'Öğretmenlerimiz',
  clientLabel: 'öğrenci',
  sessionLabel: 'ders',
  heroProviderTitle: 'Özel Ders Öğretmeni',
  navCategoriesLabel: 'Dersler',
  decorativeSymbols: ['∑', '√', 'π', '∞', '∫', '÷'],
  stats: [
    { icon: '📚', value: '9.800+', label: 'Tamamlanan ders' },
    { icon: '⭐', value: '4,9 / 5', label: 'Ortalama puan' },
    { icon: '💻', value: '7/24', label: 'Online destek' },
  ],
  categories: [
    { icon: '🏫', label: 'İlkokul', slug: 'ilkokul' },
    { icon: '📐', label: 'Ortaokul', slug: 'ortaokul' },
    { icon: '📏', label: 'Lise', slug: 'lise' },
    { icon: '📊', label: 'TYT Hazırlık', slug: 'tyt' },
    { icon: '📈', label: 'AYT Hazırlık', slug: 'ayt' },
    { icon: '🎓', label: 'DGS / ÖSYM', slug: 'dgs' },
    { icon: '📝', label: 'ALES', slug: 'ales' },
    { icon: '🏛️', label: 'KPSS', slug: 'kpss' },
  ],
  howItWorks: [
    { icon: '📅', title: 'Müsait Saati Seç', desc: 'Takvimden sana uygun gün ve saati seç.' },
    { icon: '✅', title: 'Rezervasyon Yap', desc: 'Hesabınla giriş yap, dersi onayla.' },
    { icon: '💳', title: 'Güvenli Öde', desc: 'Kartınla güvenli şekilde ödeme yap.' },
    { icon: '📚', title: 'Derse Katıl', desc: 'Online veya yüz yüze — sana uygun.' },
  ],
  featureCards: [
    { title: 'Uzman & Deneyimli', desc: 'Yıllara dayanan deneyimle tüm seviyelerde başarılı sonuçlar.', iconKey: 'award' },
    { title: 'Esnek Randevu', desc: 'Hafta içi, hafta sonu, sabah veya akşam — sana uygun saatte.', iconKey: 'calendar-check' },
    { title: 'Kişisel Program', desc: 'Seviye tespiti sonrası sana özel müfredat ve çalışma planı.', iconKey: 'book-open' },
  ],
  faq: [
    { q: 'Dersler online mı, yüz yüze mi?', a: 'Her iki seçenek de mevcuttur. Rezervasyon sırasında tercihini belirtebilirsin.' },
    { q: 'İlk derste ne yapılır?', a: 'İlk ders tanışma ve seviye tespiti odaklıdır. Hedefleriniz belirlenir, kişiselleştirilmiş bir çalışma planı oluşturulur.' },
    { q: 'Ders ücreti nasıl belirleniyor?', a: 'Her ders türünün sabit bir ücreti vardır. Rezervasyon öncesinde fiyatı şeffaf şekilde görebilirsiniz. Gizli ücret yoktur.' },
    { q: 'Rezervasyonumu iptal edebilir miyim?', a: 'Ders başlangıcından 24 saat öncesine kadar ücretsiz iptal yapabilirsiniz.' },
    { q: 'Hangi sınavlara hazırlanabilirim?', a: 'TYT, AYT, DGS, ALES, KPSS ve YKS sınavlarına yönelik hazırlık programları sunulmaktadır.' },
  ],
  testimonials: [
    { name: 'Elif K.', role: 'TYT Öğrencisi', avatar: 'EK', text: 'TYT matematikte çok ciddi bir ilerleme kaydettim. Konuları çok net anlatıyor. Kesinlikle tavsiye ederim!', rating: 5 },
    { name: 'Mehmet A.', role: 'Lise 11. Sınıf', avatar: 'MA', text: 'Matematik derslerinden sonra hem notlarım düzeldi hem de matematiği sevdim. Harika bir öğretmen!', rating: 5 },
    { name: 'Zeynep T.', role: 'KPSS Adayı', avatar: 'ZT', text: 'Online dersler çok verimli geçiyor. Konu anlatımı sade ve akılda kalıcı. Teşekkürler!', rating: 5 },
    { name: 'Burak Y.', role: 'Ortaokul 8. Sınıf Velisi', avatar: 'BY', text: 'Oğlumun LGS hazırlığı için başladık. Çok sabırlı ve anlayışlı bir öğretmen. Çok memnunuz.', rating: 5 },
    { name: 'Seda M.', role: 'AYT Öğrencisi', avatar: 'SM', text: 'Beklentilerimin çok üzerinde bir ders aldım. Problem çözme teknikleri mükemmel.', rating: 5 },
    { name: 'Hasan Ç.', role: 'DGS Adayı', avatar: 'HÇ', text: 'Ders programı tam ihtiyacıma yönelik hazırlandı. Sonuçtan çok memnunum, tavsiye ederim.', rating: 5 },
  ],
  footerCtaTitle: 'Siz de öğretmen misiniz?',
  footerCtaSubtitle: 'Öğrencilerinize kolayca ulaşın. Kendi saatlerinizi ve ücretinizi belirleyin.',
  cssVars: {
    primary: '#4f46e5',
    primaryDark: '#3730a3',
    primaryLight: '#e0e7ff',
    accent: '#818cf8',
    heroGradientFrom: '#eef2ff',
    heroGradientTo: '#ffffff',
  },
}

const psychology: SectorConfig = {
  key: 'psychology',
  label: 'Psikoloji & Terapi',
  emoji: '🧠',
  heroTitle: 'Sizi anlayan bir uzmanla tanışın',
  heroSubtitle: 'Deneyimli psikolog ve terapistlerle online veya yüz yüze seans rezervasyonu yapın.',
  heroSearchPlaceholder: 'Psikolog ara…',
  browseLabel: 'Uzmanları Gör',
  providerLabel: 'psikolog',
  providersLabel: 'psikolog',
  providersHeading: 'Uzmanlarımız',
  clientLabel: 'danışan',
  sessionLabel: 'seans',
  heroProviderTitle: 'Klinik Psikolog',
  navCategoriesLabel: 'Uzmanlık Alanları',
  decorativeSymbols: ['∞', '○', '◇', '♡', '◎', '△'],
  stats: [
    { icon: '🧑‍⚕️', value: '800+', label: 'Deneyimli uzman' },
    { icon: '📅', value: '40.000+', label: 'Tamamlanan seans' },
    { icon: '⭐', value: '4,9 / 5', label: 'Ortalama puan' },
  ],
  categories: [
    { icon: '💭', label: 'Kaygı & Panik', slug: 'anxiety' },
    { icon: '😔', label: 'Depresyon', slug: 'depression' },
    { icon: '👫', label: 'Çift Terapisi', slug: 'couples' },
    { icon: '👨‍👩‍👧', label: 'Aile Terapisi', slug: 'family' },
    { icon: '😤', label: 'Stres & Tükenmişlik', slug: 'stress' },
    { icon: '🌙', label: 'Uyku Sorunları', slug: 'sleep' },
    { icon: '🧠', label: 'BDT', slug: 'cbt' },
    { icon: '🌿', label: 'Mindfulness', slug: 'mindfulness' },
  ],
  howItWorks: [
    { icon: '🔍', title: 'Uzman Seç', desc: 'Uzmanlık alanı ve uygunluğa göre filtrele.' },
    { icon: '👤', title: 'Profili İncele', desc: 'Yaklaşım ve deneyimi öğren.' },
    { icon: '📅', title: 'Seans Planla', desc: 'Online veya yüz yüze uygun saati seç.' },
    { icon: '💚', title: 'İlerlemeye Başla', desc: 'Uzmanınla tanış ve ilk adımı at.' },
  ],
  featureCards: [
    { title: 'Gizlilik & Güven', desc: 'KVKK uyumlu, tamamen gizli ve güvenli danışmanlık süreci.', iconKey: 'shield' },
    { title: 'Online veya Yüz Yüze', desc: 'Evinizden çıkmadan veya klinikte — siz karar verin.', iconKey: 'video' },
    { title: 'Kişiselleştirilmiş Yaklaşım', desc: 'Sizin ihtiyaçlarınıza özel terapi planı oluşturulur.', iconKey: 'heart' },
  ],
  faq: [
    { q: 'Seanslar gizli midir?', a: 'Evet, tüm görüşmeler KVKK kapsamında gizli tutulmaktadır. Bilgileriniz üçüncü şahıslarla paylaşılmaz.' },
    { q: 'İlk seansta ne beklenmeli?', a: 'İlk seans tanışma ve ihtiyaç değerlendirmesidir. Kendinizi anlatmanız beklenir, herhangi bir yargılama yoktur.' },
    { q: 'Online seans yüz yüze kadar etkili mi?', a: 'Araştırmalar online terapinin birçok alanda yüz yüze kadar etkili olduğunu göstermektedir.' },
    { q: 'Seansı iptal edebilir miyim?', a: '24 saat öncesine kadar ücretsiz iptal yapabilirsiniz.' },
    { q: 'Acil durumda ne yapmalıyım?', a: 'Acil psikolojik kriz durumunda 182 (ALO Psikiyatri) hattını veya 112\'yi arayabilirsiniz.' },
  ],
  testimonials: [
    { name: 'Elif T.', role: 'Pazarlama Yöneticisi', avatar: 'ET', text: 'Psikolog bulmak eskiden çok zordu. Burada gerçekten bağ kurduğum birini bir öğleden sonraya buldum.', rating: 5 },
    { name: 'Can M.', role: 'Yazılım Mühendisi', avatar: 'CM', text: 'Online seans seçeneği uzaktan çalışma hayatıma mükemmel uyuyor. Kesinlikle tavsiye ederim.', rating: 5 },
    { name: 'Zeynep A.', role: 'Öğretmen', avatar: 'ZA', text: 'Rezervasyon çok kolay ve hatırlatmalar çok işe yarıyor. Düzenli kalmama yardımcı oldu.', rating: 5 },
  ],
  footerCtaTitle: 'Siz de psikolog musunuz?',
  footerCtaSubtitle: 'Pratiğinizi online yönetin. Müsaitliğinizi belirleyin ve danışan tabanınızı büyütün.',
  cssVars: {
    primary: '#0d9488',
    primaryDark: '#0f766e',
    primaryLight: '#ccfbf1',
    accent: '#2dd4bf',
    heroGradientFrom: '#f0fdfa',
    heroGradientTo: '#ffffff',
  },
}

const fitness: SectorConfig = {
  key: 'fitness',
  label: 'Fitness & Sağlık',
  emoji: '💪',
  heroTitle: 'Kişisel antrenörünle hedefine ulaş',
  heroSubtitle: 'Sertifikalı antrenörler ve koçlarla tanış, sana özel program oluştur ve harekete geç.',
  heroSearchPlaceholder: 'Antrenör ara…',
  browseLabel: 'Antrenörleri Gör',
  providerLabel: 'antrenör',
  providersLabel: 'antrenör',
  providersHeading: 'Antrenörlerimiz',
  clientLabel: 'danışan',
  sessionLabel: 'antrenman',
  heroProviderTitle: 'Kişisel Antrenör',
  navCategoriesLabel: 'Antrenmanlar',
  decorativeSymbols: ['⚡', '◈', '△', '✦', '◉', '★'],
  stats: [
    { icon: '🏋️', value: '1.200+', label: 'Sertifikalı antrenör' },
    { icon: '🔥', value: '60.000+', label: 'Tamamlanan antrenman' },
    { icon: '⭐', value: '4,8 / 5', label: 'Ortalama puan' },
  ],
  categories: [
    { icon: '🏋️', label: 'Ağırlık Antrenmanı', slug: 'weight-training' },
    { icon: '🏃', label: 'Koşu & Cardio', slug: 'running' },
    { icon: '🧘', label: 'Yoga', slug: 'yoga' },
    { icon: '🚴', label: 'Bisiklet & HIIT', slug: 'cycling' },
    { icon: '🥊', label: 'Boks & Savunma', slug: 'boxing' },
    { icon: '🤸', label: 'Pilates', slug: 'pilates' },
    { icon: '🏊', label: 'Yüzme', slug: 'swimming' },
    { icon: '🍎', label: 'Beslenme', slug: 'nutrition' },
  ],
  howItWorks: [
    { icon: '🔍', title: 'Antrenör Seç', desc: 'Branş, hedef ve müsaitliğe göre filtrele.' },
    { icon: '👤', title: 'Profili İncele', desc: 'Sertifikaları ve müşteri sonuçlarını gör.' },
    { icon: '📅', title: 'Antrenman Planla', desc: 'Gym, açık alan veya online — istediğin saati seç.' },
    { icon: '💪', title: 'Antren & Dönüştür', desc: 'Düzenli çalış, ilerlemeni takip et.' },
  ],
  featureCards: [
    { title: 'Sertifikalı Uzmanlar', desc: 'Tüm antrenörler sertifikalı ve deneyimli profesyonellerdir.', iconKey: 'badge-check' },
    { title: 'Kişisel Program', desc: 'Hedefine ve fiziksel durumuna özel antrenman planı hazırlanır.', iconKey: 'target' },
    { title: 'İlerlemeyi Takip Et', desc: 'Her antrenmandan sonra ilerlemeni kaydet ve motive kal.', iconKey: 'trending-up' },
  ],
  faq: [
    { q: 'Online antrenman yüz yüze kadar etkili mi?', a: 'Doğru teknikle yapıldığında online antrenman çok etkilidir. Antrenörünüz her an geri bildirim verir.' },
    { q: 'İlk seansta ne olur?', a: 'İlk seans form analizi ve hedef belirleme odaklıdır. Kişisel antrenman planınız oluşturulur.' },
    { q: 'Ekipman gerekli mi?', a: 'Antrenörünüzle önceden görüşerek gereken ekipmanları öğrenebilirsiniz. Birçok antrenman minimal ekipmanla yapılabilir.' },
    { q: 'Kaç seansta sonuç alınır?', a: 'Hedefe ve başlangıç noktanıza göre değişir. Çoğu kişi 4-8 haftada belirgin farklılık fark eder.' },
    { q: 'Antrenmanı iptal edebilir miyim?', a: '24 saat öncesine kadar ücretsiz iptal yapabilirsiniz.' },
  ],
  testimonials: [
    { name: 'Burak Y.', role: 'Ofis Çalışanı', avatar: 'BY', text: '4 ayda 12 kg verdim. Rezervasyon sistemi tutarlı kalmamı çok kolaylaştırdı.', rating: 5 },
    { name: 'Deniz K.', role: 'Serbest Çalışan', avatar: 'DK', text: 'Online yoga seansları yüz yüze kadar etkili. Esnekliği çok seviyorum.', rating: 5 },
    { name: 'Mira S.', role: 'Sporcu', avatar: 'MS', text: 'Dakikalar içinde sertifikalı bir beslenme uzmanı buldum. Performansım değişti.', rating: 5 },
  ],
  footerCtaTitle: 'Siz de antrenör müsünüz?',
  footerCtaSubtitle: 'Müşteri tabanınızı büyütün ve seanslarınızı kolayca yönetin.',
  cssVars: {
    primary: '#ea580c',
    primaryDark: '#c2410c',
    primaryLight: '#ffedd5',
    accent: '#fb923c',
    heroGradientFrom: '#fff7ed',
    heroGradientTo: '#ffffff',
  },
}

const legal: SectorConfig = {
  key: 'legal',
  label: 'Hukuki Danışmanlık',
  emoji: '⚖️',
  heroTitle: 'Alanında uzman avukatla danış',
  heroSubtitle: 'Deneyimli avukat ve hukuk danışmanlarıyla online veya yüz yüze randevu alın.',
  heroSearchPlaceholder: 'Avukat veya uzmanlık alanı ara…',
  browseLabel: 'Avukatları Gör',
  providerLabel: 'avukat',
  providersLabel: 'avukat',
  providersHeading: 'Avukatlarımız',
  clientLabel: 'müvekkil',
  sessionLabel: 'danışmanlık',
  heroProviderTitle: 'Avukat',
  navCategoriesLabel: 'Hizmet Alanları',
  decorativeSymbols: ['§', '¶', '©', '®', '⚖', '▪'],
  stats: [
    { icon: '⚖️', value: '500+', label: 'Deneyimli avukat' },
    { icon: '📋', value: '25.000+', label: 'Tamamlanan danışmanlık' },
    { icon: '⭐', value: '4,8 / 5', label: 'Ortalama puan' },
  ],
  categories: [
    { icon: '🏠', label: 'Gayrimenkul', slug: 'real-estate' },
    { icon: '💼', label: 'Ticaret Hukuku', slug: 'business' },
    { icon: '👪', label: 'Aile Hukuku', slug: 'family' },
    { icon: '⚖️', label: 'Ceza Hukuku', slug: 'criminal' },
    { icon: '💡', label: 'Fikri Mülkiyet', slug: 'ip' },
    { icon: '🌐', label: 'Vatandaşlık & Vize', slug: 'immigration' },
    { icon: '📋', label: 'İş Hukuku', slug: 'employment' },
    { icon: '🤝', label: 'Sözleşmeler', slug: 'contracts' },
  ],
  howItWorks: [
    { icon: '🔍', title: 'Avukat Seç', desc: 'Uzmanlık alanı ve uygunluğa göre filtrele.' },
    { icon: '👤', title: 'Profili İncele', desc: 'Deneyim, uzmanlık ve yorumları gör.' },
    { icon: '📅', title: 'Randevu Al', desc: 'Yüz yüze veya video görüşme için uygun saati seç.' },
    { icon: '⚖️', title: 'Uzman Görüşünü Al', desc: 'Avukatınızla gizli ve profesyonel görüşme yapın.' },
  ],
  featureCards: [
    { title: 'Deneyimli Profesyoneller', desc: 'Tüm avukatlar baro kaydı olan, alanında deneyimli uzmanlar.', iconKey: 'award' },
    { title: 'Gizlilik Güvencesi', desc: 'Avukat-müvekkil gizliliği kapsamında tüm görüşmeler korunur.', iconKey: 'shield' },
    { title: 'Esnek Danışmanlık', desc: 'Online veya yüz yüze, size uygun saatte danışmanlık alın.', iconKey: 'calendar-check' },
  ],
  faq: [
    { q: 'Online danışmanlık hukuki geçerliliği var mı?', a: 'Hukuki danışmanlık online olarak alınabilir. Resmi belgeler için avukatınız size yönlendirme yapacaktır.' },
    { q: 'İlk görüşmede ne konuşulur?', a: 'Durumunuzu aktarırsınız, avukat olası adımları ve riskleri değerlendirerek görüşünü paylaşır.' },
    { q: 'Ücret nasıl belirleniyor?', a: 'Her danışmanlığın sabit ücreti vardır. Ek dava ve temsil ücretleri avukatınızla ayrıca görüşülür.' },
    { q: 'Randevuyu iptal edebilir miyim?', a: '24 saat öncesine kadar ücretsiz iptal yapabilirsiniz.' },
    { q: 'Aynı konuda birden fazla avukatla görüşebilir miyim?', a: 'Evet, farklı görüşler almak için birden fazla avukatla danışma yapabilirsiniz.' },
  ],
  testimonials: [
    { name: 'Ali R.', role: 'İşletme Sahibi', avatar: 'AR', text: 'Sözleşme konusunda net bir görüş aldım. Rezervasyon ve görüşme süreci çok pürüzsüzdü.', rating: 5 },
    { name: 'Selin B.', role: 'Ev Alıcısı', avatar: 'SB', text: 'Gayrimenkul avukatım her detayı anlattı. Hızlı rezervasyon, kapsamlı danışmanlık.', rating: 5 },
    { name: 'Kerem T.', role: 'Girişimci', avatar: 'KT', text: 'Dakikalar içinde startup hukukunda uzman birini buldum. Çok faydalı oldu.', rating: 5 },
  ],
  footerCtaTitle: 'Siz de avukat mısınız?',
  footerCtaSubtitle: 'Pratiğinizi online\'a taşıyın. Uzmanlığınıza ihtiyaç duyan müvekkillere ulaşın.',
  cssVars: {
    primary: '#1d4ed8',
    primaryDark: '#1e3a8a',
    primaryLight: '#dbeafe',
    accent: '#60a5fa',
    heroGradientFrom: '#eff6ff',
    heroGradientTo: '#ffffff',
  },
}

const coaching: SectorConfig = {
  key: 'coaching',
  label: 'Koçluk & Danışmanlık',
  emoji: '🎯',
  heroTitle: 'Hedeflerine ulaşmak için doğru rehber',
  heroSubtitle: 'Deneyimli yaşam ve kariyer koçlarıyla birebir online seans al, hayatında gerçek değişimi yarat.',
  heroSearchPlaceholder: 'Koç ara…',
  browseLabel: 'Koçları Gör',
  providerLabel: 'koç',
  providersLabel: 'koç',
  providersHeading: 'Koçlarımız',
  clientLabel: 'danışan',
  sessionLabel: 'oturum',
  heroProviderTitle: 'Yaşam & Kariyer Koçu',
  navCategoriesLabel: 'Hizmetler',
  decorativeSymbols: ['★', '✦', '◆', '▲', '●', '◉'],
  stats: [
    { icon: '🎯', value: '600+', label: 'Sertifikalı koç' },
    { icon: '⭐', value: '4,9 / 5', label: 'Ortalama puan' },
    { icon: '🚀', value: '15.000+', label: 'Başarıya ulaşan danışan' },
  ],
  categories: [
    { icon: '🎯', label: 'Kariyer Koçluğu', slug: 'career' },
    { icon: '💡', label: 'Yaşam Koçluğu', slug: 'life' },
    { icon: '🧘', label: 'Mindset & Farkındalık', slug: 'mindset' },
    { icon: '💼', label: 'Liderlik & Yönetim', slug: 'leadership' },
    { icon: '💰', label: 'Finansal Koçluk', slug: 'financial' },
    { icon: '🚀', label: 'Girişimcilik Koçluğu', slug: 'entrepreneurship' },
    { icon: '❤️', label: 'İlişki Koçluğu', slug: 'relationship' },
    { icon: '⚡', label: 'Üretkenlik & Zaman', slug: 'productivity' },
  ],
  howItWorks: [
    { icon: '🎯', title: 'Hedefini Belirle', desc: 'Ne değiştirmek istediğini düşün.' },
    { icon: '👤', title: 'Koç Seç', desc: 'Uzmanlık alanı ve yaklaşıma göre filtrele.' },
    { icon: '📅', title: 'Oturum Planla', desc: 'Online görüşme için uygun saati seç.' },
    { icon: '🚀', title: 'Harekete Geç', desc: 'Koçunla birlikte somut adımlar at.' },
  ],
  featureCards: [
    { title: 'Sonuç Odaklı', desc: 'Her oturum somut hedeflerle ilerler, ilerlemeniz ölçülür.', iconKey: 'target' },
    { title: 'Kişiselleştirilmiş Program', desc: 'Sadece size özgü koçluk planı ve eylem adımları.', iconKey: 'users' },
    { title: 'Sürekli Destek', desc: 'Oturumlar arası destek ve hesap verebilirlik sistemi.', iconKey: 'zap' },
  ],
  faq: [
    { q: 'Koçluk terapiden farkı nedir?', a: 'Koçluk geleceğe odaklanır ve hedef belirlemeye yardımcı olur. Terapi geçmiş ve ruhsal iyileşme odaklıdır.' },
    { q: 'Kaç oturumda sonuç alınır?', a: 'Hedeflere göre değişir. Çoğu danışan 4-6 oturumda belirgin değişimler yaşar.' },
    { q: 'Oturumlar nasıl gerçekleşiyor?', a: 'Oturumlar online video görüşme ile gerçekleşir. Dilediğiniz yerden katılabilirsiniz.' },
    { q: 'Oturumu iptal edebilir miyim?', a: '24 saat öncesine kadar ücretsiz iptal yapabilirsiniz.' },
    { q: 'Koçumla oturumlar arası iletişim kurabilir miyim?', a: 'Platform üzerinden mesajlaşabilir ve notlar paylaşabilirsiniz.' },
  ],
  testimonials: [
    { name: 'Berk A.', role: 'Yönetici', avatar: 'BA', text: 'Kariyer koçum sayesinde 6 ayda maaşımı %40 artırdım ve hayalimdeki şirkete geçtim.', rating: 5 },
    { name: 'Sinem K.', role: 'Girişimci', avatar: 'SK', text: 'Girişimimi kurarken koçum somut adımlar atmamı sağladı. Gerçek dönüşüm bu.', rating: 5 },
    { name: 'Emre D.', role: 'Freelancer', avatar: 'ED', text: 'Üretkenlik koçumla çalışma sistemim tamamen değişti. Artık çok daha verimli çalışıyorum.', rating: 5 },
  ],
  footerCtaTitle: 'Siz de koç musunuz?',
  footerCtaSubtitle: 'Danışan tabanınızı büyütün. Profesyonel bir platform üzerinden koçluk hizmetinizi sunun.',
  cssVars: {
    primary: '#d97706',
    primaryDark: '#b45309',
    primaryLight: '#fef3c7',
    accent: '#fbbf24',
    heroGradientFrom: '#fffbeb',
    heroGradientTo: '#ffffff',
  },
}

// ── Lookup ─────────────────────────────────────────────────────────────────────

const SECTOR_CONFIGS: Record<string, SectorConfig> = {
  tutoring: education,
  education: education,
  'ozel-ders': education,
  psychology: psychology,
  therapy: psychology,
  psikoloji: psychology,
  terapi: psychology,
  fitness: fitness,
  sport: fitness,
  antrenman: fitness,
  legal: legal,
  law: legal,
  hukuk: legal,
  avukat: legal,
  coaching: coaching,
  consulting: coaching,
  kocluk: coaching,
  coach: coaching,
  danismanlik: coaching,
}

export const ALL_SECTORS: SectorConfig[] = [education, psychology, fitness, legal, coaching]

const DEFAULT_SECTOR = education

export function getSectorConfig(sector?: string | null): SectorConfig {
  if (!sector) return DEFAULT_SECTOR
  return SECTOR_CONFIGS[sector.toLowerCase()] ?? DEFAULT_SECTOR
}
