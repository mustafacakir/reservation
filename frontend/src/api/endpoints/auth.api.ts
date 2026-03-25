import { apiClient } from '../client'
import type { LoginResult, RegisterResult } from '@/types/auth.types'

export const authApi = {
  register: (data: { email: string; password: string; firstName: string; lastName: string }) =>
    apiClient.post<RegisterResult>('/auth/register', data).then((r) => r.data),

  login: (data: { email: string; password: string }) =>
    apiClient.post<LoginResult>('/auth/login', data).then((r) => r.data),

  refresh: (refreshToken: string) =>
    apiClient.post<{ accessToken: string }>('/auth/refresh', { refreshToken }).then((r) => r.data),

  logout: () => apiClient.post('/auth/logout').then((r) => r.data),
}
