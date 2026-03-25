import axios, { type InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/store/auth.store'
import { useTenantStore } from '@/store/tenant.store'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor: attach JWT and tenant slug
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken
  const slug = useTenantStore.getState().slug

  if (token) config.headers.Authorization = `Bearer ${token}`
  if (slug) config.headers['X-Tenant-Slug'] = slug

  return config
})

// Response interceptor: handle 401 and token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      const refreshToken = useAuthStore.getState().refreshToken
      if (!refreshToken) {
        useAuthStore.getState().logout()
        return Promise.reject(error)
      }

      try {
        const response = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL ?? '/api/v1'}/auth/refresh`,
          { refreshToken },
        )
        const { accessToken } = response.data
        useAuthStore.getState().setTokens(accessToken, refreshToken)
        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return apiClient(originalRequest)
      } catch {
        useAuthStore.getState().logout()
        return Promise.reject(error)
      }
    }

    return Promise.reject(error)
  },
)
