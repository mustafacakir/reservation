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
import GizlilikPolitikasiPage from '@/pages/public/GizlilikPolitikasiPage'
import KullanımKosullariPage from '@/pages/public/KullanımKosullariPage'
import KvkkPage from '@/pages/public/KvkkPage'

// Client pages
import BrowseProvidersPage from '@/pages/client/BrowseProvidersPage'
import MyBookingsPage from '@/pages/client/MyBookingsPage'
import BookingFlowPage from '@/pages/client/BookingFlowPage'
import PaymentResultPage from '@/pages/client/PaymentResultPage'

// Provider pages
import ProviderDashboard from '@/pages/provider/DashboardPage'
import AvailabilityPage from '@/pages/provider/AvailabilityPage'
import MyServicesPage from '@/pages/provider/MyServicesPage'
import ProfilePage from '@/pages/provider/ProfilePage'
import ManualBookingPage from '@/pages/provider/ManualBookingPage'

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
      { path: 'providers', element: <BrowseProvidersPage /> },
      { path: 'providers/:id', element: <ProviderProfilePage /> },
      { path: 'gizlilik', element: <GizlilikPolitikasiPage /> },
      { path: 'kullanim-kosullari', element: <KullanımKosullariPage /> },
      { path: 'kvkk', element: <KvkkPage /> },
    ],
  },
  {
    path: '/client',
    element: <ProtectedRoute allowedRoles={['Client', 'ServiceProvider']}><ClientLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <Navigate to="browse" replace /> },
      { path: 'browse', element: <BrowseProvidersPage /> },
      { path: 'bookings', element: <MyBookingsPage /> },
      { path: 'book/:providerId/:serviceId', element: <BookingFlowPage /> },
      { path: 'payment-result', element: <PaymentResultPage /> },
    ],
  },
  {
    path: '/provider',
    element: <ProtectedRoute allowedRoles={['ServiceProvider']}><ProviderLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <ProviderDashboard /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'availability', element: <AvailabilityPage /> },
      { path: 'services', element: <MyServicesPage /> },
      { path: 'rezervasyon-ekle', element: <ManualBookingPage /> },
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
