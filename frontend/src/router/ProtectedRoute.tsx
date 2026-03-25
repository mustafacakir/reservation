import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import type { UserRole } from '@/types/auth.types'

interface Props {
  children: React.ReactNode
  allowedRoles?: UserRole[]
}

export default function ProtectedRoute({ children, allowedRoles }: Props) {
  const { isAuthenticated, role } = useAuthStore()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    const redirectMap: Record<string, string> = {
      Client: '/client/browse',
      ServiceProvider: '/provider',
      Admin: '/admin',
      SuperAdmin: '/admin',
    }
    return <Navigate to={redirectMap[role] ?? '/'} replace />
  }

  return <>{children}</>
}
