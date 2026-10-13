import '#auth-utils'

declare module '#auth-utils' {
  interface User {
    user_id: number
    user_name: string
    email: string
    role_id: number
    role_name: string
    avatar_path?: string | null
    is_active?: boolean
  }
}
