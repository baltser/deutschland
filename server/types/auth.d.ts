import '#auth-utils'

declare module '#auth-utils' {
  interface User {
    id: string | number
    name: string
    email: string
    ruleName?: string
    rule_name?: string
    avatar?: string | null
  }
}
