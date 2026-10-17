import { logger } from '#server/utils/logger'

export default defineEventHandler(async (event) => {
  const log = logger.withTag('admin:users:update')

  // 1. Проверяем авторизацию и права администратора
  const session = await requireUserSession(event)
  // if (session.user.role_name !== 'admin') {
  //   throw createError({
  //     statusCode: 403,
  //     message: 'У вас нет прав для выполнения этой операции',
  //   })
  // }

  // 2. Получаем ID пользователя из параметров URL
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Не указан ID пользователя',
    })
  }

  const body = await readBody(event)
  const userId = Number(id)

  const updateData: {
    user_name?: string
    role_id?: number
    avatar_path?: string | null
  } = {}

  // 3. Если передано имя, добавляем его в обновление (с проверкой на строку)
  if (body.user_name !== undefined && body.user_name !== null) {
    updateData.user_name = String(body.user_name).trim()
  }

  // 4. Если передано имя роли, находим её ID без учета регистра
  if (body.role_name) {
    const targetRole = await prisma.roles.findFirst({
      where: {
        role_name: {
          equals: String(body.role_name).trim(),
          mode: 'insensitive' // Позволяет находить 'admin', 'Admin' и 'ADMIN'
        }
      }
    })

    if (!targetRole) {
      throw createError({
        statusCode: 400,
        message: `Указанная роль "${body.role_name}" не найдена в системе`,
      })
    }

    updateData.role_id = targetRole.role_id
  }

  // 5. Если передан новый путь к аватару (или null для удаления)
  if (body.avatar_path !== undefined) {
    updateData.avatar_path = body.avatar_path
  }

  try {
    // 6. Обновляем пользователя в базе данных
    const updatedUser = await prisma.users.update({
      where: { user_id: userId },
      data: updateData,
      include: {
        role: {
          select: { role_name: true }
        }
      }
    })

    log.success(`Администратор #${session.user.user_id} обновил данные пользователя ID: ${userId}`)

    return {
      success: true,
      user: {
        user_id: updatedUser.user_id,
        user_name: updatedUser.user_name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role_name: updatedUser.role.role_name,
        avatar_path: updatedUser.avatar_path
      }
    }
  } catch (err: unknown) {
    log.error(`Не удалось обновить пользователя ID: ${userId}`, { cause: err })
    throw createError({
      statusCode: 500,
      message: 'Ошибка сервера при обновлении данных пользователя',
      cause: err
    })
  }
})
