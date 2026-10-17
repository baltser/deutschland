import { logger } from '#server/utils/logger'

export default defineEventHandler(async () => {
  const log = logger.withTag('admin:users')

  try {
    const users = await prisma.users.findMany({
      where: {
        role: {
          role_name: {
            not: 'client' // 👈 Исключаем клиентов, оставляем только сотрудников (админов и монтажников)
          }
        }
      },
      select: {
        user_id: true,
        user_name: true,
        email: true,
        phone: true,
        avatar_path: true,
        activated_at: true,
        role: {
          select: {
            role_name: true
          }
        }
      },
      orderBy: {
        user_id: 'desc',
      },
    })

    log.info(`Запрошен список сотрудников. Всего найдено: ${users.length}`)

    return {
      success: true,
      users: users.map(user => ({
        ...user,
        role_name: user.role.role_name
      }))
    }
  } catch (err: unknown) {
    log.error('Ошибка при получении списка сотрудников:', { cause: err })
    throw createError({
      statusCode: 500,
      message: 'Не удалось получить список пользователей',
      cause: err
    })
  }
})
