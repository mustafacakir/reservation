import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { useAppConfig } from './hooks/useAppConfig'
import { ToastProvider } from './components/ui/Toast'
import CookieConsentBanner from './components/ui/CookieConsentBanner'
import { initGoogleAnalytics, trackPageView } from './lib/analytics'

function AppInit() {
  useAppConfig()

  useEffect(() => {
    initGoogleAnalytics()
    let lastPath = window.location.pathname
    trackPageView(lastPath)
    return router.subscribe((state) => {
      if (state.location.pathname === lastPath) return
      lastPath = state.location.pathname
      trackPageView(lastPath)
    })
  }, [])

  return (
    <>
      <RouterProvider router={router} />
      <CookieConsentBanner />
    </>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <AppInit />
    </ToastProvider>
  )
}
