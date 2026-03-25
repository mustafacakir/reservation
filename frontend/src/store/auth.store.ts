import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserRole } from '@/types/auth.types'

interface AuthState {
  userId: string | null
  fullName: string | null
  role: UserRole | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  setAuth: (data: { userId: string; fullName: string; role: UserRole; accessToken: string; refreshToken: string }) => void
  setTokens: (accessToken: string, refreshToken: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      userId: null,
      fullName: null,
      role: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: ({ userId, fullName, role, accessToken, refreshToken }) =>
        set({ userId, fullName, role, accessToken, refreshToken, isAuthenticated: true }),

      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),

      logout: () =>
        set({
          userId: null, fullName: null, role: null,
          accessToken: null, refreshToken: null, isAuthenticated: false,
        }),
    }),
    { name: 'auth-storage', partialState: (s) => ({ accessToken: s.accessToken, refreshToken: s.refreshToken, userId: s.userId, role: s.role, fullName: s.fullName, isAuthenticated: s.isAuthenticated }) },
  ),
)
