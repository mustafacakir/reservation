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

export interface SectorConfig {
  key: string
  heroTitle: string
  heroSubtitle: string
  heroSearchPlaceholder: string
  browseLabel: string
  providerLabel: string          // singular: "tutor", "therapist", "trainer"
  providersLabel: string         // plural
  clientLabel: string            // singular: "student", "client", "patient"
  stats: SectorStats[]
  categories: CategoryItem[]
  howItWorks: HowItWorksStep[]
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

const education: SectorConfig = {
  key: 'tutoring',
  heroTitle: 'Matematik öğrenmek artık çok daha kolay',
  heroSubtitle:
    'Alanında uzman matematik öğretmenlerini keşfet, uygun saatini bul ve hemen ders rezervasyonu yap.',
  heroSearchPlaceholder: 'Öğretmen ara…',
  browseLabel: 'Öğretmenleri Gör',
  providerLabel: 'öğretmen',
  providersLabel: 'öğretmen',
  clientLabel: 'öğrenci',
  stats: [
    { icon: '📚', value: '9.800+', label: 'Tamamlanan ders' },
    { icon: '⭐', value: '4,9 / 5', label: 'Ortalama puan' },
    { icon: '💻', value: '7/24', label: 'Online destek' },
  ],
  categories: [],
  howItWorks: [
    { icon: '🔍', title: 'Öğretmeni Seç', desc: 'Müfredat, deneyim ve fiyata göre filtrele.' },
    { icon: '📅', title: 'Saat Rezerve Et', desc: 'Müsait saatleri gör, tek tıkla rezervasyon yap.' },
    { icon: '💻', title: 'Derse Katıl', desc: 'Online ya da yüz yüze — sana uygun şekilde.' },
    { icon: '🎓', title: 'Başarıya Ulaş', desc: 'Düzenli derslerle notlarını ve özgüvenini artır.' },
  ],
  testimonials: [
    {
      name: 'Ayşe K.',
      role: 'Lise öğrencisi',
      avatar: 'AK',
      text: 'Matematik notum 2 ayda çok arttı. Ders almak bu kadar kolay olabilirdi bilmiyordum.',
      rating: 5,
    },
    {
      name: 'Mehmet D.',
      role: 'Üniversite öğrencisi',
      avatar: 'MD',
      text: 'Calculus için harika bir hoca buldum. Esnek saatler sayesinde yoğun programıma uydu.',
      rating: 5,
    },
    {
      name: 'Sara L.',
      role: 'Veli',
      avatar: 'SL',
      text: 'Kızımın matematiğe olan güveni inanılmaz arttı. Hoca eşleştirmesi çok isabetli oldu.',
      rating: 5,
    },
  ],
  footerCtaTitle: 'Siz de öğretmen misiniz?',
  footerCtaSubtitle: 'Binlerce öğrenciye ulaşın. Kendi saatlerinizi ve ücretinizi siz belirleyin.',
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
  heroTitle: 'Find your therapist',
  heroSubtitle:
    'Browse licensed psychologists and counselors. Book a confidential session at a time that works for you.',
  heroSearchPlaceholder: 'Search by specialty, therapist name…',
  browseLabel: 'Browse Therapists',
  providerLabel: 'therapist',
  providersLabel: 'therapists',
  clientLabel: 'client',
  stats: [
    { icon: '🧑‍⚕️', value: '800+', label: 'Licensed therapists' },
    { icon: '📅', value: '40 000+', label: 'Sessions completed' },
    { icon: '⭐', value: '4.9 / 5', label: 'Average rating' },
    { icon: '🌿', value: '30+', label: 'Specializations' },
  ],
  categories: [
    { icon: '💭', label: 'Anxiety', slug: 'anxiety' },
    { icon: '😔', label: 'Depression', slug: 'depression' },
    { icon: '👫', label: 'Couples Therapy', slug: 'couples' },
    { icon: '👨‍👩‍👧', label: 'Family Therapy', slug: 'family' },
    { icon: '😤', label: 'Stress & Burnout', slug: 'stress' },
    { icon: '🌙', label: 'Sleep & Insomnia', slug: 'sleep' },
    { icon: '🧠', label: 'CBT', slug: 'cbt' },
    { icon: '🌿', label: 'Mindfulness', slug: 'mindfulness' },
  ],
  howItWorks: [
    { icon: '🔍', title: 'Search', desc: 'Filter by specialty, approach, and availability.' },
    { icon: '👤', title: 'Review Profile', desc: 'Learn about their background and therapeutic approach.' },
    { icon: '📅', title: 'Book a Session', desc: 'Select an in-person or online slot that fits you.' },
    { icon: '💚', title: 'Begin Your Journey', desc: 'Meet your therapist and take the first step.' },
  ],
  testimonials: [
    {
      name: 'Elif T.',
      role: 'Marketing manager',
      avatar: 'ET',
      text: 'Finding a therapist used to feel daunting. Here I found someone I truly connect with in one afternoon.',
      rating: 5,
    },
    {
      name: 'Can M.',
      role: 'Software engineer',
      avatar: 'CM',
      text: 'The online session option fits perfectly into my remote-work schedule. Highly recommend.',
      rating: 5,
    },
    {
      name: 'Zeynep A.',
      role: 'Teacher',
      avatar: 'ZA',
      text: 'Booking is seamless and reminders are great. Helped me stay consistent with my therapy.',
      rating: 5,
    },
  ],
  footerCtaTitle: 'Are you a therapist?',
  footerCtaSubtitle: 'Manage your practice online. Set your availability and grow your client base.',
  cssVars: {
    primary: '#059669',
    primaryDark: '#047857',
    primaryLight: '#d1fae5',
    accent: '#34d399',
    heroGradientFrom: '#ecfdf5',
    heroGradientTo: '#ffffff',
  },
}

const fitness: SectorConfig = {
  key: 'fitness',
  heroTitle: 'Find your personal trainer',
  heroSubtitle:
    'Connect with certified personal trainers and coaches. Book a session and start your fitness journey today.',
  heroSearchPlaceholder: 'Search by specialty, trainer name…',
  browseLabel: 'Browse Trainers',
  providerLabel: 'trainer',
  providersLabel: 'trainers',
  clientLabel: 'client',
  stats: [
    { icon: '🏋️', value: '1 200+', label: 'Certified trainers' },
    { icon: '🔥', value: '60 000+', label: 'Sessions completed' },
    { icon: '⭐', value: '4.8 / 5', label: 'Average rating' },
    { icon: '🎯', value: '50+', label: 'Disciplines' },
  ],
  categories: [
    { icon: '🏋️', label: 'Weight Training', slug: 'weight-training' },
    { icon: '🏃', label: 'Running', slug: 'running' },
    { icon: '🧘', label: 'Yoga', slug: 'yoga' },
    { icon: '🚴', label: 'Cycling', slug: 'cycling' },
    { icon: '🥊', label: 'Boxing', slug: 'boxing' },
    { icon: '🤸', label: 'Pilates', slug: 'pilates' },
    { icon: '🏊', label: 'Swimming', slug: 'swimming' },
    { icon: '🍎', label: 'Nutrition', slug: 'nutrition' },
  ],
  howItWorks: [
    { icon: '🔍', title: 'Search', desc: 'Filter by discipline, goal, and schedule.' },
    { icon: '👤', title: 'Review Profile', desc: 'Check certifications, client results, and reviews.' },
    { icon: '📅', title: 'Book a Session', desc: 'Pick a time slot — gym, outdoor, or online.' },
    { icon: '💪', title: 'Train & Transform', desc: 'Show up, work hard, and track your progress.' },
  ],
  testimonials: [
    {
      name: 'Burak Y.',
      role: 'Office worker',
      avatar: 'BY',
      text: 'Lost 12 kg in 4 months with my trainer. The booking system made it easy to stay consistent.',
      rating: 5,
    },
    {
      name: 'Deniz K.',
      role: 'Freelancer',
      avatar: 'DK',
      text: 'Online sessions with my yoga instructor are just as effective as in-person. Love the flexibility.',
      rating: 5,
    },
    {
      name: 'Mira S.',
      role: 'Athlete',
      avatar: 'MS',
      text: 'Found a certified sports nutritionist in minutes. Game changer for my performance.',
      rating: 5,
    },
  ],
  footerCtaTitle: 'Are you a trainer?',
  footerCtaSubtitle: 'Build your client base and manage your sessions effortlessly.',
  cssVars: {
    primary: '#dc2626',
    primaryDark: '#b91c1c',
    primaryLight: '#fee2e2',
    accent: '#f87171',
    heroGradientFrom: '#fff1f2',
    heroGradientTo: '#ffffff',
  },
}

const legal: SectorConfig = {
  key: 'legal',
  heroTitle: 'Book a legal consultation',
  heroSubtitle:
    'Connect with experienced lawyers and legal advisors. Get expert guidance for your situation, on your schedule.',
  heroSearchPlaceholder: 'Search by practice area, lawyer name…',
  browseLabel: 'Browse Lawyers',
  providerLabel: 'lawyer',
  providersLabel: 'lawyers',
  clientLabel: 'client',
  stats: [
    { icon: '⚖️', value: '500+', label: 'Experienced lawyers' },
    { icon: '📋', value: '25 000+', label: 'Consultations' },
    { icon: '⭐', value: '4.8 / 5', label: 'Average rating' },
    { icon: '📌', value: '40+', label: 'Practice areas' },
  ],
  categories: [
    { icon: '🏠', label: 'Real Estate', slug: 'real-estate' },
    { icon: '💼', label: 'Business Law', slug: 'business' },
    { icon: '👪', label: 'Family Law', slug: 'family' },
    { icon: '⚖️', label: 'Criminal Law', slug: 'criminal' },
    { icon: '💡', label: 'IP & Patents', slug: 'ip' },
    { icon: '🌐', label: 'Immigration', slug: 'immigration' },
    { icon: '📋', label: 'Employment', slug: 'employment' },
    { icon: '🤝', label: 'Contracts', slug: 'contracts' },
  ],
  howItWorks: [
    { icon: '🔍', title: 'Search', desc: 'Filter by practice area, language, and availability.' },
    { icon: '👤', title: 'Review Profile', desc: 'Check experience, bar admissions, and client reviews.' },
    { icon: '📅', title: 'Book a Consultation', desc: 'Select an in-person or video call slot.' },
    { icon: '⚖️', title: 'Get Expert Advice', desc: 'Speak confidentially with your legal advisor.' },
  ],
  testimonials: [
    {
      name: 'Ali R.',
      role: 'Business owner',
      avatar: 'AR',
      text: 'Got clear contract advice within 24 hours of booking. The platform made the whole process straightforward.',
      rating: 5,
    },
    {
      name: 'Selin B.',
      role: 'Homebuyer',
      avatar: 'SB',
      text: 'My real estate lawyer walked me through every detail. Booking was quick and the consultation was thorough.',
      rating: 5,
    },
    {
      name: 'Kerem T.',
      role: 'Startup founder',
      avatar: 'KT',
      text: 'Found a specialist in startup law in minutes. Saved me hours of research and uncertainty.',
      rating: 5,
    },
  ],
  footerCtaTitle: 'Are you a legal professional?',
  footerCtaSubtitle: 'Expand your practice online. Reach clients who need your expertise.',
  cssVars: {
    primary: '#1d4ed8',
    primaryDark: '#1e3a8a',
    primaryLight: '#dbeafe',
    accent: '#60a5fa',
    heroGradientFrom: '#eff6ff',
    heroGradientTo: '#ffffff',
  },
}

const SECTOR_CONFIGS: Record<string, SectorConfig> = {
  tutoring: education,
  education: education,
  psychology: psychology,
  therapy: psychology,
  fitness: fitness,
  sport: fitness,
  legal: legal,
  law: legal,
}

const DEFAULT_SECTOR = education

export function getSectorConfig(sector?: string | null): SectorConfig {
  if (!sector) return DEFAULT_SECTOR
  return SECTOR_CONFIGS[sector.toLowerCase()] ?? DEFAULT_SECTOR
}
