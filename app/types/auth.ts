export type UserRole = 'admin' | 'installer' | 'manager' | 'client'

// Данные пользователя в активной сессии
export interface SessionUser {
  user_id: number
  user_name: string
  role_name: UserRole | string
  avatar_path?: string | null
}

// Данные для авторизации
export interface LoginCredentials {
  phone: string
  password: string
}
