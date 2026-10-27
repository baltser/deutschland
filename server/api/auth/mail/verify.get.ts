import { getRedisClient } from '#server/utils/redis'
import { logger } from '#server/utils/logger'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const log = logger.withTag('auth:verify-email')

  const query = getQuery(event)
  const token = query.token as string

  if (!token) {
    throw createError({ statusCode: 400, message: 'Токен подтверждения не передан' })
  }

  const redis = getRedisClient()
  const userIdStr = await redis.get(`verify-email:${token}`)

  if (!userIdStr) {
    throw createError({
      statusCode: 400,
      message: 'Ссылка подтверждения недействительна или срок её действия истёк'
    })
  }

  const userId = Number(userIdStr)

  // 1. Проставляем дату подтверждения в БД
  await prisma.users.update({
    where: { user_id: userId },
    data: { email_verified_at: new Date() }
  })
  // Фронтенд получит актуальный статус через /api/profile/ при редиректе.

  await redis.del(`verify-email:${token}`)
  log.success(`✅ Email успешно подтвержден для пользователя ID: ${userId}`)

  const appUrl = config.public.appUrl || 'http://localhost:3000'
  return sendRedirect(event, `${appUrl}/profile?email_verified=true`)
})
