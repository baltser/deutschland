import { logger } from '#server/utils/logger'
import { prisma } from '#server/utils/prisma'
import type { UserRole } from '@prisma/client'

export default defineEventHandler(async (event) => {
  const log = logger.withTag('admin:users:update')

  // 1. Проверяем авторизацию и права администратора
  const session = await requireUserSession(event)
  if (session.user.role_name !== 'admin') {
    throw createError({
      statusCode: 403,
      message: 'У вас нет прав для выполнения этой операции',
    })
  }

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
    role_name?: UserRole
    avatar_path?: string | null
  } = {}

  // 3. Если передано имя
  if (body.user_name !== undefined && body.user_name !== null) {
    updateData.user_name = String(body.user_name).trim()
  }

  // 4. Если передана роль, валидируем её по Enum UserRole
  if (body.role_name) {
    const normalizedRole = String(body.role_name).trim().toLowerCase()
    const validRoles: UserRole[] = ['admin', 'installer', 'manager', 'client']

    if (!validRoles.includes(normalizedRole as UserRole)) {
      throw createError({
        statusCode: 400,
        message: `Указанная роль "${body.role_name}" не найдена в системе`,
      })
    }

    updateData.role_name = normalizedRole as UserRole
  }

  // 5. Если передан путь к аватару
  if (body.avatar_path !== undefined) {
    updateData.avatar_path = body.avatar_path
  }

  try {
    // 6. Обновляем пользователя в базе данных (без связи с roles)
    const updatedUser = await prisma.users.update({
      where: { user_id: userId },
      data: updateData,
    })

    log.success(`Администратор #${session.user.user_id} обновил данные пользователя ID: ${userId}`)

    return {
      success: true,
      user: {
        user_id: updatedUser.user_id,
        user_name: updatedUser.user_name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role_name: updatedUser.role_name,
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
