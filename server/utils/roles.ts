import { logger } from '#server/utils/logger'

export async function ensureDefaultRoles() {
  const log = logger.withTag('roles:seed')

  const defaultRoles = ['user', 'admin', 'moderator']

  for (const roleName of defaultRoles) {
    try {
      await prisma.roles.upsert({
        where: { role_name: roleName },
        update: {}, // Если роль уже есть, ничего не меняем
        create: { role_name: roleName } // Если нет — создаем
      })
    } catch (err: unknown) {
      log.error(`Не удалось создать роль "${roleName}":`, { cause: err })
      throw err
    }
  }

  log.success('Базовые роли успешно проверены/созданы в базе данных')
}
