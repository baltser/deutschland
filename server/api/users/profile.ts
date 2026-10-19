import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { logger } from '#server/utils/logger'

const profileSchema = z.object({
  name: z.string().min(1, 'Имя обязательно').optional(),
  email: z.email('Некорректный формат email').optional(),
  password: z.string().min(6, 'Пароль должен быть не менее 6 символов').optional()
})

export default defineEventHandler(async (event) => {
  const log = logger.withTag('auth:profile')

  // 1. Проверяем сессию авторизованного пользователя
  const session = await requireUserSession(event)
  const userId = Number(session.user.user_id)

  const rawBody = await readBody(event)

  // Очищаем пустые строки (например, если пароль не менялся и пришел как ''),
  // чтобы Zod не падал на валидации optional-полей
  const body = Object.fromEntries(
    Object.entries(rawBody).filter(([_, v]) => v !== '' && v !== null && v !== undefined)
  )

  const parseResult = profileSchema.safeParse(body)

  if (!parseResult.success) {
    throw createError({
      statusCode: 400,
      message: parseResult.error.issues[0]?.message || 'Ошибка валидации данных'
    })
  }

  const { name, email, password } = parseResult.data
  const updateData: {
    user_name?: string
    email?: string
    password?: string
  } = {}

  if (name) updateData.user_name = name

  if (email) {
    // Проверяем, не занят ли email кем-то другим
    const existingUser = await prisma.users.findUnique({ where: { email } })
    if (existingUser && existingUser.user_id !== userId) {
      throw createError({
        statusCode: 409,
        message: 'Этот email уже используется другим пользователем'
      })
    }
    updateData.email = email
  }

  if (password) {
    updateData.password = await bcrypt.hash(password, 10)
  }

  // Если вообще нечего обновлять
  if (Object.keys(updateData).length === 0) {
    return {
      success: true,
      message: 'Нет данных для обновления'
    }
  }

  // 2. Обновляем данные в базе данных через модель users
  try {
    const updatedUser = await prisma.users.update({
      where: { user_id: userId },
      data: updateData,
      include: {
        role: { select: { role_name: true } }
      }
    })

    // 3. Синхронизируем изменения с текущей сессией
    await setUserSession(event, {
      user: {
        user_id: updatedUser.user_id,
        user_name: updatedUser.user_name,
        phone: updatedUser.phone,
        email: updatedUser.email,
        role_id: updatedUser.role_id,
        role_name: updatedUser.role.role_name,
        avatar_path: updatedUser.avatar_path || null,
        activated_at: updatedUser.activated_at || null
      }
    })

    log.success(`✅ Профиль успешно обновлен для пользователя ID: ${userId}`)

    return {
      success: true,
      user: {
        user_id: updatedUser.user_id,
        user_name: updatedUser.user_name,
        email: updatedUser.email,
        role_name: updatedUser.role.role_name,
        avatar_path: updatedUser.avatar_path,
        activated_at: updatedUser.activated_at
      }
    }
  } catch (err: unknown) {
    log.error('Ошибка при обновлении профиля:', { cause: err })
    throw createError({
      statusCode: 500,
      message: 'Не удалось обновить профиль в базе данных',
      cause: err
    })
  }
})
