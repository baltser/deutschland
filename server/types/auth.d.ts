import '#auth-utils'

declare module '#auth-utils' {
  interface User {
    user_id: number
    role_name: string
    phone: string
    user_name: string | null
    email: string | null
    avatar_path: string | null
  }
}
