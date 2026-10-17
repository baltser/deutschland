import { logger } from '#server/utils/logger'

export async function ensureDefaultRoles() {
  const log = logger.withTag('roles:seed')

  const defaultRoles = ['installer', 'admin', 'client']

  for (const roleName of defaultRoles) {
    try {
      // 1. Проверяем, существует ли уже такая роль через findFirst (работает с любыми полями)
      const existingRole = await prisma.roles.findFirst({
        where: { role_name: roleName }
      })

      // 2. Если роли нет — создаем её
      if (!existingRole) {
        await prisma.roles.create({
          data: { role_name: roleName }
        })
        log.info(`Создана роль: "${roleName}"`)
      }
    } catch (err: unknown) {
      log.error(`Не удалось создать роль "${roleName}":`, { cause: err })
      throw err
    }
  }

  log.success('Базовые роли успешно проверены/созданы в базе данных')
}
