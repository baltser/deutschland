import { z } from 'zod'
import { logger } from '#server/utils/logger'
import { updateUserProfile } from '#server/utils/userProfile'

const profileSchema = z.object({
  name: z.string().min(1, 'Имя обязательно').optional(),
  email: z.email('Некорректный формат email').optional().nullable(),
  password: z.string().min(6, 'Пароль должен быть не менее 6 символов').optional().or(z.literal(''))
})

export default defineEventHandler(async (event) => {
  const log = logger.withTag('auth:profile')

  const session = await requireUserSession(event)
  const userId = Number(session.user.user_id)

  const rawBody = await readBody(event)
  const parseResult = profileSchema.safeParse(rawBody)

  if (!parseResult.success) {
    throw createError({
      statusCode: 400,
      message: parseResult.error.issues[0]?.message || 'Ошибка валидации данных'
    })
  }

  const { name, email, password } = parseResult.data

  try {
    // Вызываем сервисную функцию обновления
    const updatedUser = await updateUserProfile({
      userId,
      name,
      email,
      password: password || undefined
    })

    // Синхронизируем сессию (включая свежий email_verified_at)
    await setUserSession(event, {
      user: {
        user_id: updatedUser.user_id,
        user_name: updatedUser.user_name,
        phone: updatedUser.phone,
        email: updatedUser.email,
        email_verified_at: updatedUser.email_verified_at, // <-- Передаем null
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
        email_verified_at: updatedUser.email_verified_at,
        role_name: updatedUser.role.role_name,
        avatar_path: updatedUser.avatar_path,
        activated_at: updatedUser.activated_at
      }
    }
  } catch (err: unknown) {
    log.error('Ошибка при обновлении профиля:', { cause: err })
    // Пробрасываем кастомные ошибки Zod/409 дальше, а серверные оборачиваем в 50
    if ((err as { statusCode?: number; message?: string }).statusCode) throw err

    throw createError({
      statusCode: 500,
      message: 'Не удалось обновить профиль в базе данных',
      cause: err
    })
  }
})
