export function getRoleLabel(role?: string | null): string {
  switch (role) {
    case 'admin':
      return 'Администратор'
    case 'installer':
      return 'Монтажник'
    case 'client':
      return 'Клиент'
    default:
      return 'Пользователь'
  }
}
export function getRoleColor(role?: string | null): string {
  switch (role) {
    case 'admin':
      return 'error'
    case 'installer':
      return 'warning'
    case 'client':
      return 'success'
    default:
      return 'neutral'
  }
}
export function getRoleStyle(role?: string | null): string {
  switch (role) {
    case 'admin':
      return 'text-red-500 dark:text-red-400'
    case 'installer':
      return 'text-amber-500 dark:text-amber-400'
    case 'client':
      return 'text-emerald-500 dark:text-emerald-400'
    default:
      return 'text-neutral-500 dark:text-neutral-400' // Серый по умолчанию
  }
}
