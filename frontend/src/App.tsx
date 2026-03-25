import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { useAppConfig } from './hooks/useAppConfig'

function AppInit() {
  useAppConfig()
  return <RouterProvider router={router} />
}

export default function App() {
  return <AppInit />
}
