import { prisma } from '#server/utils/prisma'
import { logger } from '#server/utils/logger'

export async function ensureDefaultAdminUser() {
  const log = logger.withTag('admin-seed')

  // 1. Ищем роль администратора по точному списку системных названий (используем role_name)
  const adminRole = await prisma.roles.findFirst({
    where: {
      OR: [
        { role_name: { equals: 'admin', mode: 'insensitive' } },
        { role_name: { equals: 'administrator', mode: 'insensitive' } },
        { role_name: { equals: 'администратор', mode: 'insensitive' } }
      ]
    }
  })

  if (!adminRole) {
    log.warn('⚠️ Роль администратора не найдена в таблице roles, пропуск создания дефолтного админа.')
    return
  }

  // 2. Проверяем, есть ли уже хотя бы один пользователь с этой ролью
  const existingAdmin = await prisma.users.findFirst({
    where: { role_id: adminRole.role_id }
  })

  if (!existingAdmin) {
    const adminPhone = process.env.ADMIN_PHONE || '79000000001'
    const adminName = process.env.ADMIN_NAME || 'System Administrator'

    // Проверяем, не занят ли этот телефон
    const phoneConflict = await prisma.users.findUnique({
      where: { phone: adminPhone }
    })

    if (!phoneConflict) {
      await prisma.users.create({
        data: {
          user_name: adminName,
          phone: adminPhone,
          role_id: adminRole.role_id,
          activated_at: null
        }
      })
      log.success(`✅ Создан дефолтный администратор. Телефон: ${adminPhone}`)
    } else {
      log.info(`ℹ️ Пользователь с телефоном ${adminPhone} уже существует, пропускаем создание.`)
    }
  } else {
    log.info('ℹ️ Администратор в системе уже присутствует.')
  }
}
