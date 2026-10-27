export type UserRole = 'admin' | 'installer' | 'manager' | 'client'

declare module '#auth-utils' {
  interface User {
    user_id: number
    user_name: string | null
    role_name: string
    avatar_path: string | null
  }
}


// 1. Единый базовый контракт пользователя (для сессии и ответов API)
export interface SessionUser {
  user_id: number
  user_name: string | null
  role_name: UserRole | string
  avatar_path: string | null
}

// 2. Данные для авторизации / логина
export interface LoginCredentials {
  phone: string
  password: string
}

// 3. Универсальный ответ при успешном входе или верификации
export interface AuthResponse {
  success: boolean
  message?: string
  user: SessionUser
}

// 4. Ответ при запросе текущей сессии
export interface SessionResponse {
  user: SessionUser | null
}

// 5. Ответ при инициализации регистрации через uCaller[cite: 4]
export interface RegisterInitResponse {
  success: boolean
  message: string
  ucallerId?: string
}
// --- LOGOUT ---
export interface LogoutResponse {
  success: boolean
}
// export interface RegisterVerifyResponse {
//   success: boolean
//   message: string
//   user: SessionUser
// }
