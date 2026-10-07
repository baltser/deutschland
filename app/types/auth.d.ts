declare module '#auth-utils' {
  interface User {
    id: number | string
    name: string
    email: string
    rule_name?: string
    ruleName?: string
    created_at?: string
    createdAt?: string
  }
}

declare module 'nuxt-auth-utils' {
  interface User {
    id: number | string
    name: string
    email: string
    rule_name?: string
    ruleName?: string
    created_at?: string
    createdAt?: string
  }
}
