const GA_MEASUREMENT_ID = 'G-7LXM0STXEH'

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

let loaded = false

/** Injects gtag.js. Must only be called after the user has accepted cookie consent. */
export function loadGoogleAnalytics() {
  if (loaded || typeof window === 'undefined') return
  loaded = true

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`
  document.head.appendChild(script)

  window.dataLayer = window.dataLayer || []
  window.gtag = function gtag(...args: unknown[]) { window.dataLayer!.push(args) }
  window.gtag('js', new Date())
  window.gtag('config', GA_MEASUREMENT_ID)
}

export function isAnalyticsLoaded() {
  return loaded
}

/** Reports a client-side route change as a page_view (gtag's auto page_view only fires once on script load). */
export function trackPageView(path: string) {
  if (!loaded || !window.gtag) return
  window.gtag('event', 'page_view', { page_path: path })
}

const CONSENT_KEY = 'cookie-consent'

/** Loads analytics immediately if the user already consented on a previous visit. */
export function initAnalyticsFromStoredConsent() {
  try {
    const saved = localStorage.getItem(CONSENT_KEY)
    if (saved && JSON.parse(saved).accepted) loadGoogleAnalytics()
  } catch {
    // ignore malformed storage
  }
}
