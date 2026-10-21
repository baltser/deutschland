declare module '#auth-utils' {
  interface User {
    user_id: number
    user_name?: string | null
    phone: string
    email?: string | null
    email_verified_at?: string | Date | null
    role_id: number
    role_name: string
    avatar_path?: string | null
    activated_at?: string | Date | null
  }
}

declare module 'nuxt-auth-utils' {
  interface User {
    user_id: number
    user_name?: string | null
    phone: string
    email?: string | null
    email_verified_at?: string | Date | null
    role_id: number
    role_name: string
    avatar_path?: string | null
    activated_at?: string | Date | null
  }
}
