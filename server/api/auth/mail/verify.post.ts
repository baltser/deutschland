import { z } from 'zod'
import { getRedisClient } from '#server/utils/redis'
import { sendVerificationEmail } from '#server/utils/mail'
import { ensureDefaultEmailTemplate } from '#server/utils/emailTemplates'
import { logger } from '#server/utils/logger'

const bodySchema = z.object({
  email: z.email('Введите корректный email')
})

export default defineEventHandler(async (event) => {
  const log = logger.withTag('auth:mail:verify')
  const session = await requireUserSession(event)
  const userId = Number(session.user.user_id)

  let body
  try {
    body = await readValidatedBody(event, (b) => bodySchema.parse(b))
  } catch (err: unknown) {
    const validationError = err as { issues?: Array<{ message: string }> }
    const firstMessage = validationError.issues?.[0]?.message

    throw createError({
      statusCode: 400,
      message: firstMessage || 'Ошибка валидации данных'
    })
  }

  const newEmail = body.email.trim().toLowerCase()

  // 1. Проверяем, не занят ли email другим аккаунтом
  const existingUser = await prisma.users.findUnique({ where: { email: newEmail } })
  if (existingUser && existingUser.user_id !== userId) {
    throw createError({
      statusCode: 409,
      message: 'Этот email уже используется другим пользователем'
    })
  }

  // 2. Записываем новый email в БД и сбрасываем статус верификации в null
  const updatedUser = await prisma.users.update({
    where: { user_id: userId },
    data: {
      email: newEmail,
      email_verified_at: null
    },
    select: {
      user_id: true,
      user_name: true
    }
  })

  log.success(`Email успешно обновлен для пользователя ID: ${updatedUser.user_id}`)

  // 3. Генерируем токен и отправляем письмо
  await ensureDefaultEmailTemplate()
  const redis = getRedisClient()
  const token = crypto.randomUUID()
  await redis.set(`verify-email:${token}`, String(userId), 'EX', 86400)

  try {
    await sendVerificationEmail(newEmail, token, updatedUser.user_name || undefined)
  } catch (err) {
    log.error(`Не удалось отправить письмо с подтверждением для ID ${userId}:`, err)
    throw createError({
      statusCode: 500,
      message: 'Не удалось отправить письмо с подтверждением',
      cause: err
    })
  }

  return { success: true, message: 'Ссылка с подтверждением отправлена на ваш email' }
})
