// server/api/auth/mail/verify.get.ts
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

  // 1. Проставляем дату подтверждения
  const updatedUser = await prisma.users.update({
    where: { user_id: userId },
    data: { email_verified_at: new Date() },
    include: { role: { select: { role_name: true } } }
  })

  // 2. Обновляем сессию с ISO-строкой даты
  await setUserSession(event, {
    user: {
      user_id: updatedUser.user_id,
      user_name: updatedUser.user_name,
      phone: updatedUser.phone,
      email: updatedUser.email,
      email_verified_at: updatedUser.email_verified_at
        ? new Date(updatedUser.email_verified_at).toISOString()
        : null,
      role_id: updatedUser.role_id,
      role_name: updatedUser.role.role_name,
      avatar_path: updatedUser.avatar_path || null,
      activated_at: updatedUser.activated_at
        ? new Date(updatedUser.activated_at).toISOString()
        : null
    }
  })

  await redis.del(`verify-email:${token}`)
  log.success(`✅ Email успешно подтвержден для пользователя ID: ${updatedUser.user_id}`)

  const appUrl = config.public.appUrl || 'http://localhost:3000'
  return sendRedirect(event, `${appUrl}/profile?email_verified=true`)
})
