export type UserRole = 'admin' | 'installer' | 'manager' | 'client'

// Базовый профиль пользователя (для личного кабинета и сессии)
export interface UserProfile {
  user_id: number
  user_name: string | null
  phone: string
  email: string | null
  email_verified_at: string | Date | null
  avatar_path: string | null
  role_name: UserRole
  activated_at: string | Date | null
  created_at: string | Date
}

// Сотрудник (Администратор или Монтажник) для таблицы /admin/staff
export interface StaffUser {
  user_id: number
  user_name: string | null
  phone: string
  email: string | null
  avatar_path: string | null
  activated_at: string | Date | null
  role_name: 'admin' | 'installer' | 'manager'
}

// Клиент с привязанными объектами для таблицы /admin/clients
export interface ClientAddressRelation {
  address_id: number
  address?: {
    address_id: number
    address_name: string
  } | null
}

export interface ClientUser {
  user_id: number
  user_name: string | null
  phone: string
  email: string | null
  avatar_path: string | null
  activated_at: string | Date | null
  addresses?: ClientAddressRelation[]
}
