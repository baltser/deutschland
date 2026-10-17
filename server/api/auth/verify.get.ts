import { getRedisClient } from '#server/utils/redis'
import { logger } from '#server/utils/logger'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const log = logger.withTag('auth:verify')

  const query = getQuery(event)
  const token = query.token as string

  if (!token) {
    throw createError({
      statusCode: 400,
      message: 'Токен подтверждения не передан'
    })
  }

  const redis = getRedisClient()
  const userIdStr = await redis.get(`verify:${token}`)

  if (!userIdStr) {
    throw createError({
      statusCode: 400,
      message: 'Ссылка подтверждения недействительна или срок ее действия истек'
    })
  }

  const userId = Number(userIdStr)

  // 1. Находим пользователя в базе
  const user = await prisma.users.findUnique({
    where: { user_id: userId },
    include: { role: true }
  })

  if (!user) {
    throw createError({
      statusCode: 404,
      message: 'Пользователь не найден'
    })
  }

  // 2. Активируем аккаунт, если еще не активирован
  if (!user.activated_at) {
    await prisma.users.update({
      where: { user_id: userId },
      data: { activated_at: new Date() }
    })
  }

  // 3. Удаляем использованный токен из Redis
  await redis.del(`verify:${token}`)

  // 4. Автоматически логиним пользователя (создаем сессию)
  await setUserSession(event, {
    user: {
      user_id: user.user_id,
      user_name: user.user_name,
      phone: user.phone,
      email: user.email,
      role_id: user.role_id,
      role_name: user.role.role_name,
      avatar_path: user.avatar_path || null,
      activated_at: user.activated_at,
    }
  })

  log.success(`✅ Email успешно подтвержден, пользователь авторизован: ${user.email}`)

  // 5. Перенаправляем пользователя на главную страницу (или страницу успеха)
  const appUrl = config.public.appUrl || 'http://localhost:3000'
  return sendRedirect(event, `${appUrl}/?verified=true`)
})
