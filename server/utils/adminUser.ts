import { prisma } from '#server/utils/prisma'
import { logger } from '#server/utils/logger'

export async function ensureDefaultAdminUser() {
  const log = logger.withTag('admin-seed')

  // 1. Проверяем, есть ли уже хотя бы один пользователь с ролью admin
  const existingAdmin = await prisma.users.findFirst({
    where: { role_name: 'admin' }
  })

  if (existingAdmin) {
    log.info('ℹ️ Администратор в системе уже присутствует.')
    return
  }

  const adminPhone = process.env.ADMIN_PHONE || '79000000001'
  const adminName = process.env.ADMIN_NAME || 'System Administrator'

  try {
    // 2. Используем upsert: если телефон уже есть — делаем его админом, если нет — создаем нового
    await prisma.users.upsert({
      where: { phone: adminPhone },
      update: {
        role_name: 'admin',
        user_name: adminName
      },
      create: {
        user_name: adminName,
        phone: adminPhone,
        role_name: 'admin',
        activated_at: null
      }
    })

    log.success(`✅ Дефолтный администратор успешно настроен. Телефон: ${adminPhone}`)
  } catch (err) {
    log.error('❌ Не удалось создать или обновить дефолтного администратора:', err)
    throw err
  }
}
