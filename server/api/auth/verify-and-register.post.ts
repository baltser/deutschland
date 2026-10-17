import { getRedisClient } from '#server/utils/redis'
import { normalizeAndValidatePhone } from '#server/utils/phone'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { code } = body

  if (!code) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Укажите код подтверждения'
    })
  }

  // Нормализуем и проверяем телефон
  const phone = normalizeAndValidatePhone(body.phone)

  const redis = getRedisClient()
  const rawData = await redis.get(`pending_reg:${phone}`)

  if (!rawData) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Время действия кода истекло. Запросите звонок повторно.'
    })
  }

  const pendingData = JSON.parse(rawData)

  // Проверяем 4 цифры из звонка uCaller
  if (String(pendingData.code) !== String(code).trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Неверный код подтверждения из звонка'
    })
  }

  // Удаляем использованный черновик из Redis
  await redis.del(`pending_reg:${phone}`)

  // 1. Находим предзаписанного администратором пользователя по ID из черновика
  const existingUser = await prisma.users.findUnique({
    where: { user_id: pendingData.user_id },
    include: { role: true }
  })

  if (!existingUser) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Пользователь не найден в системе. Обратитесь к администратору.'
    })
  }

  // 2. Обновляем существующего пользователя: сохраняем хэш пароля и активируем аккаунт
  const updatedUser = await prisma.users.update({
    where: { user_id: existingUser.user_id },
    data: {
      password: pendingData.password,
      activated_at: new Date(), // 👈 Фиксируем успешную активацию
      ...(pendingData.email && { email: pendingData.email })
    },
    include: {
      role: true
    }
  })

  // 3. Авторизуем пользователя через nuxt-auth-utils (создаем сессию)
  await setUserSession(event, {
    user: {
      user_id: updatedUser.user_id,
      phone: updatedUser.phone,
      user_name: updatedUser.user_name || "Клиент",
      email: updatedUser.email,
      role_id: updatedUser.role_id,
      role_name: updatedUser.role.role_name,
      avatar_path: updatedUser.avatar_path
    }
  })

  return {
    success: true,
    message: 'Регистрация прошла успешно!'
  }
})
