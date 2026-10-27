import { z } from 'zod'
import { getRedisClient } from '#server/utils/redis'
import { normalizeAndValidatePhone } from '#server/utils/phone'
import type { AuthResponse } from '#server/types/auth'

const verifySchema = z.object({
  phone: z.string().min(10, 'Введите номер телефона'),
  code: z.string().length(4, 'Код должен содержать 4 цифры')
})

export default defineEventHandler(async (event): Promise<AuthResponse> => {
  const body = await readValidatedBody(event, (b) => verifySchema.parse(b))
  const phone = normalizeAndValidatePhone(body.phone)
  const code = body.code.trim()

  const redis = getRedisClient()
  const rawData = await redis.get(`pending_reg:${phone}`)

  if (!rawData) {
    throw createError({
      statusCode: 400,
      message: 'Время действия кода истекло. Запросите звонок повторно.'
    })
  }

  const pendingData = JSON.parse(rawData)

  if (String(pendingData.code) !== code) {
    throw createError({
      statusCode: 400,
      message: 'Неверный код подтверждения из звонка'
    })
  }

  await redis.del(`pending_reg:${phone}`)

  const existingUser = await prisma.users.findUnique({
    where: { user_id: pendingData.user_id }
  })

  if (!existingUser) {
    throw createError({
      statusCode: 404,
      message: 'Пользователь не найден в системе'
    })
  }

  const updatedUser = await prisma.users.update({
    where: { user_id: existingUser.user_id },
    data: {
      password: pendingData.password,
      activated_at: new Date()
    },
    select: {
      user_id: true,
      user_name: true,
      role_name: true,
      avatar_path: true
    }
  })

  const sessionUser = {
    user_id: updatedUser.user_id,
    user_name: updatedUser.user_name || null,
    role_name: updatedUser.role_name,
    avatar_path: updatedUser.avatar_path || null
  }

  await setUserSession(event, { user: sessionUser })

  return {
    success: true,
    message: 'Регистрация прошла успешно!',
    user: sessionUser
  }
})
