const GA_MEASUREMENT_ID = 'G-7LXM0STXEH'
const CONSENT_KEY = 'cookie-consent'

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

function gtag(...args: unknown[]) {
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push(args)
}

let initialized = false

/**
 * Injects gtag.js unconditionally on every page load (so Google's tag-verification tools can
 * detect it), using Consent Mode to keep analytics storage/cookies OFF until the user accepts
 * the cookie banner. Safe to call regardless of consent status.
 */
export function initGoogleAnalytics() {
  if (initialized || typeof window === 'undefined') return
  initialized = true

  window.gtag = gtag
  gtag('consent', 'default', {
    ad_storage: 'denied',
    analytics_storage: hasStoredConsent() ? 'granted' : 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  })

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`
  document.head.appendChild(script)

  gtag('js', new Date())
  gtag('config', GA_MEASUREMENT_ID)
}

/** Call after the user accepts the cookie banner to unlock analytics storage/cookies. */
export function grantAnalyticsConsent() {
  gtag('consent', 'update', { analytics_storage: 'granted' })
}

/** Reports a client-side route change as a page_view (gtag's auto page_view only fires once on script load). */
export function trackPageView(path: string) {
  if (!initialized || !window.gtag) return
  window.gtag('event', 'page_view', { page_path: path })
}

export function hasStoredConsent(): boolean {
  try {
    const saved = localStorage.getItem(CONSENT_KEY)
    return !!(saved && JSON.parse(saved).accepted)
  } catch {
    return false
  }
}
