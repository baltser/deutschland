import type { UserRole } from './auth'

// Полный профиль пользователя (для личного кабинета и ответов API)
export interface UserProfile {
  user_id: number
  user_name: string | null
  phone: string
  email: string | null
  email_verified_at: string | Date | null
  avatar_path: string | null
  role_name: UserRole
  activated_at: string | Date | null
}


// Тело запроса для обновления профиля (PATCH)
export interface UpdateProfileBody {
  user_name?: string
  email?: string | null
  password?: string | null
}

// Ответ при успешной загрузке аватара
export interface AvatarUploadResponse {
  success: boolean
  avatarUrl: string | null
}
