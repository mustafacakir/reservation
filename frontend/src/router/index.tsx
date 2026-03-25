import { createBrowserRouter, Navigate } from 'react-router-dom'
import PublicLayout from '@/layouts/PublicLayout'
import ClientLayout from '@/layouts/ClientLayout'
import ProviderLayout from '@/layouts/ProviderLayout'
import AdminLayout from '@/layouts/AdminLayout'
import ProtectedRoute from './ProtectedRoute'

// Public pages
import LandingPage from '@/pages/public/LandingPage'
import LoginPage from '@/pages/public/LoginPage'
import RegisterPage from '@/pages/public/RegisterPage'
import ProviderProfilePage from '@/pages/public/ProviderProfilePage'

// Client pages
import BrowseProvidersPage from '@/pages/client/BrowseProvidersPage'
import MyBookingsPage from '@/pages/client/MyBookingsPage'
import BookingFlowPage from '@/pages/client/BookingFlowPage'

// Provider pages
import ProviderDashboard from '@/pages/provider/DashboardPage'
import AvailabilityPage from '@/pages/provider/AvailabilityPage'
import MyServicesPage from '@/pages/provider/MyServicesPage'

// Admin pages
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'providers/:id', element: <ProviderProfilePage /> },
    ],
  },
  {
    path: '/client',
    element: <ProtectedRoute allowedRoles={['Client']}><ClientLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <Navigate to="browse" replace /> },
      { path: 'browse', element: <BrowseProvidersPage /> },
      { path: 'bookings', element: <MyBookingsPage /> },
      { path: 'book/:providerId/:serviceId', element: <BookingFlowPage /> },
    ],
  },
  {
    path: '/provider',
    element: <ProtectedRoute allowedRoles={['ServiceProvider']}><ProviderLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <ProviderDashboard /> },
      { path: 'availability', element: <AvailabilityPage /> },
      { path: 'services', element: <MyServicesPage /> },
    ],
  },
  {
    path: '/admin',
    element: <ProtectedRoute allowedRoles={['Admin', 'SuperAdmin']}><AdminLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <AdminDashboardPage /> },
    ],
  },
])
