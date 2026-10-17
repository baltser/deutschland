import '#auth-utils'

declare module '#auth-utils' {
  interface User {
    user_id: number
    phone: string
    user_name?: string | null
    email?: string | null
    role_id: number
    role_name: string // Имя роли для проверок прав
    avatar_path?: string | null
    activated_at?: Date | null
  }
}
