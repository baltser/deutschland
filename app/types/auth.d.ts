declare module '#auth-utils' {
  interface User {
    id: string | number
    name: string
    email: string
    ruleName?: string
    rule_name?: string
    avatar?: string | null
    createdAt?: string
    created_at?: string
  }
}

declare module 'nuxt-auth-utils' {
  interface User {
    id: string | number
    name: string
    email: string
    ruleName?: string
    rule_name?: string
    avatar?: string | null
    createdAt?: string
    created_at?: string
  }
}
