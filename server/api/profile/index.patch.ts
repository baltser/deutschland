import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { logger } from '#server/utils/logger.ts'
import { Prisma } from '@prisma/client'

const updateProfileSchema = z.object({
  user_name: z.string().min(2, 'Имя должно содержать не менее 2 символов').optional(),
  email: z.email('Введите корректный email').optional().nullable().transform((val) => val === '' ? null : val),
  password: z.string().min(6, 'Пароль должен быть не менее 6 символов').optional().nullable().transform((val) => val === '' ? null : val)
})

export default defineEventHandler(async (event) => {
  const log = logger.withTag('client:profile:update')

  const session = await getUserSession(event)
  if (!session.user) {
    throw createError({ statusCode: 401, message: 'Необходима авторизация' })
  }

  if (session.user.role_name !== 'client' && session.user.role_name !== 'admin') {
    throw createError({ statusCode: 403, message: 'Доступ запрещен' })
  }

  const body = await readValidatedBody(event, (b) => updateProfileSchema.parse(b))

  try {
    // Подготавливаем данные для обновления
    const updateData: any = {}
    if (body.user_name !== undefined) updateData.user_name = body.user_name
    if (body.email !== undefined) updateData.email = body.email

    // Если передан новый пароль — хэшируем его
    if (body.password) {
      updateData.password = await bcrypt.hash(body.password, 10)
    }

    // 1. Обновляем в базе данных Prisma
    const updatedUser = await prisma.users.update({
      where: { user_id: session.user.user_id },
      data: updateData,
      select: {
        user_id: true,
        user_name: true,
        email: true,
        email_verified_at: true,
        avatar_path: true,
        activated_at: true,
        role_name: true
      }
    })

    // 2. Обновляем сессию в куке
    await setUserSession(event, {
      user: {
        user_id: updatedUser.user_id,
        role_name: updatedUser.role_name,
        phone: session.user.phone,
        user_name: updatedUser.user_name || null,
        email: updatedUser.email || null,
        avatar_path: updatedUser.avatar_path || null,
      }
    })

    log.success(`Профиль и/или пароль успешно обновлены для пользователя ID: ${updatedUser.user_id}`)

    return updatedUser

  } catch (err: any) {
    log.error(`Ошибка при обновлении профиля пользователя ID ${session.user.user_id}:`, err)

    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw createError({
        statusCode: 400,
        message: 'Этот адрес электронной почты уже используется другим пользователем.'
      })
    }

    throw createError({
      statusCode: 500,
      message: 'Не удалось обновить профиль в базе данных'
    })
  }
})
