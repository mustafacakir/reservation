import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { useAppConfig } from './hooks/useAppConfig'
import { ToastProvider } from './components/ui/Toast'
import CookieConsentBanner from './components/ui/CookieConsentBanner'

function AppInit() {
  useAppConfig()
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
