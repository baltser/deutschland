import { logger } from '#server/utils/logger'

export default defineEventHandler(async () => {
  const log = logger.withTag('admin:users')

  // Опционально: проверяем, что пользователь авторизован и имеет права администратора
  // const session = await requireUserSession(event)

  // Пример проверки по роли (если role_id администратора, например, 1)
  // if (session.user.role_id !== 1) {
  //   throw createError({ statusCode: 403, message: 'Доступ запрещен' })
  // }

  try {
    const users = await prisma.users.findMany({
      select: {
        user_id: true,
        user_name: true,
        email: true,
        phone: true,
        is_active: true,
        avatar_path: true,
        // Достаем название роли из связанной таблицы roles
        role: {
          select: {
            role_name: true
          }
        }
      },
      orderBy: {
        user_id: 'desc', // Сортируем по ID по убыванию (новые сверху)
      },
    })

    log.info(`Запрошен список пользователей. Всего найдено: ${users.length}`)

    return {
      success: true,
      users: users.map(user => ({
        ...user,
        role_name: user.role.role_name // «поднимаем» имя роли наверх для удобства во фронтенде
      }))
    }
  } catch (err: unknown) {
    log.error('Ошибка при получении списка пользователей:', { cause: err })
    throw createError({
      statusCode: 500,
      message: 'Не удалось получить список пользователей',
      cause: err
    })
  }
})
