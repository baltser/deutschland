import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { logger } from '#server/utils/logger.ts'
import { Prisma } from '@prisma/client'
import type { UserProfile } from '#server/types/profile'

const updateProfileSchema = z.object({
  user_name: z.string().min(2, 'Имя должно содержать не менее 2 символов').optional(),
  email: z
    .email('Введите корректный email')
    .optional()
    .nullable()
    .transform((val) => (val === '' ? null : val)),
  password: z
    .string()
    .min(6, 'Пароль должен быть не менее 6 символов')
    .optional()
    .nullable()
    .transform((val) => (val === '' ? null : val))
})

export default defineEventHandler(async (event): Promise<UserProfile> => {
  const log = logger.withTag('client:profile:update')

  // 1. Берем пользователя из контекста, который подготовил middleware
  const user = event.context.user
  const userId = Number(user.user_id)

  let body
  try {
    body = await readValidatedBody(event, (b) => updateProfileSchema.parse(b))
  } catch (err: unknown) {
    const validationError = err as { issues?: Array<{ message: string }> }
    const firstMessage = validationError.issues?.[0]?.message

    throw createError({
      statusCode: 400,
      message: firstMessage || 'Ошибка валидации данных'
    })
  }

  try {
    const currentUser = await prisma.users.findUnique({
      where: { user_id: userId },
      select: { user_name: true, email: true }
    })

    const updateData: Record<string, unknown> = {}

    if (body.user_name !== undefined && body.user_name !== currentUser?.user_name) {
      updateData.user_name = body.user_name
    }

    // Если email изменился — обновляем его И сбрасываем подтверждение в null
    if (body.email !== undefined && body.email !== currentUser?.email) {
      updateData.email = body.email
      updateData.email_verified_at = null
    }

    if (body.password) {
      updateData.password = await bcrypt.hash(body.password, 10)
    }

    const selectFields = {
      user_id: true,
      user_name: true,
      phone: true,
      email: true,
      email_verified_at: true,
      avatar_path: true,
      activated_at: true,
      role_name: true
    }

    if (Object.keys(updateData).length === 0) {
      const existingUser = await prisma.users.findUnique({
        where: { user_id: userId },
        select: selectFields
      })
      if (!existingUser) throw createError({ statusCode: 404, message: 'Пользователь не найден' })
      return existingUser
    }

    const updatedUser = await prisma.users.update({
      where: { user_id: userId },
      data: updateData,
      select: selectFields
    })

    // Синхронизируем сессию
    await setUserSession(event, {
      user: {
        user_id: updatedUser.user_id,
        role_name: updatedUser.role_name,
        user_name: updatedUser.user_name || null,
        avatar_path: updatedUser.avatar_path || null
      }
    })

    log.success(`Профиль и/или пароль успешно обновлены для пользователя ID: ${updatedUser.user_id}`)

    return updatedUser
  } catch (err: unknown) {
    log.error(`Ошибка при обновлении профиля пользователя ID ${userId}:`, err)

    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw createError({
        statusCode: 400,
        message: 'Этот адрес электронной почты уже используется другим пользователем.'
      })
    }

    const httpError = err as { statusCode?: number }
    if (httpError.statusCode) {
      throw err
    }

    throw createError({
      statusCode: 500,
      message: 'Не удалось обновить профиль в базе данных'
    })
  }
})
