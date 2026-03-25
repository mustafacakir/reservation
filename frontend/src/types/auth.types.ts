export type UserRole = 'SuperAdmin' | 'Admin' | 'ServiceProvider' | 'Client'

export interface LoginResult {
  userId: string
  fullName: string
  role: UserRole
  accessToken: string
  refreshToken: string
}

export interface RegisterResult {
  userId: string
  accessToken: string
  refreshToken: string
}
