import { z } from 'zod'
import { getRedisClient } from '#server/utils/redis'
import { normalizeAndValidatePhone } from '#server/utils/phone'

const verifySchema = z.object({
  phone: z.string().min(10, 'Введите номер телефона'),
  code: z.string().length(4, 'Код должен содержать 4 цифры')
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, (b) => verifySchema.parse(b))
  const phone = normalizeAndValidatePhone(body.phone)
  const code = body.code.trim()

  // 1. Достаем черновик из Redis
  const redis = getRedisClient()
  const rawData = await redis.get(`pending_reg:${phone}`)

  if (!rawData) {
    throw createError({
      statusCode: 400,
      message: 'Время действия кода истекло. Запросите звонок повторно.'
    })
  }

  const pendingData = JSON.parse(rawData)

  // 2. Сверяем 4 цифры из звонка
  if (String(pendingData.code) !== code) {
    throw createError({
      statusCode: 400,
      message: 'Неверный код подтверждения из звонка'
    })
  }

  // 3. Сразу удаляем использованный токен из Redis (защита от reuse)
  await redis.del(`pending_reg:${phone}`)

  // 4. Находим пользователя в базе
  const existingUser = await prisma.users.findUnique({
    where: { user_id: pendingData.user_id }
  })

  if (!existingUser) {
    throw createError({
      statusCode: 404,
      message: 'Пользователь не найден в системе'
    })
  }

  // 5. Обновляем данные: сохраняем пароль и фиксируем дату активации
  const updatedUser = await prisma.users.update({
    where: { user_id: existingUser.user_id },
    data: {
      password: pendingData.password,
      activated_at: new Date()
    },
    select: {
      user_id: true,
      user_name: true,
      phone: true,
      email: true,
      role_name: true,
      avatar_path: true
    }
  })

  // 6. Устанавливаем защищенную сессию (используем актуальную структуру с role_name)
  await setUserSession(event, {
    user: {
      user_id: updatedUser.user_id,
      role_name: updatedUser.role_name,
      phone: updatedUser.phone,
      user_name: updatedUser.user_name || null,
      email: updatedUser.email || null,
      avatar_path: updatedUser.avatar_path || null
    }
  })

  return {
    success: true,
    message: 'Регистрация прошла успешно!',
    user: {
      user_id: updatedUser.user_id,
      role_name: updatedUser.role_name,
      phone: updatedUser.phone,
      user_name: updatedUser.user_name || null,
      email: updatedUser.email || null
    }
  }
})
