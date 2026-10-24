// server/api/auth/mail/verify.post.ts
import { z } from 'zod'
import { getRedisClient } from '#server/utils/redis'
import { sendVerificationEmail } from '#server/utils/mail'
import { ensureDefaultEmailTemplate } from '#server/utils/emailTemplates'

const bodySchema = z.object({
  email: z.email('Введите корректный email')
})

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const userId = Number(session.user.user_id)

  const body = await readValidatedBody(event, (b) => bodySchema.parse(b))
  const newEmail = body.email.trim().toLowerCase()

  // 1. Проверяем, не занят ли email другим аккаунтом
  const existingUser = await prisma.users.findUnique({ where: { email: newEmail } })
  if (existingUser && existingUser.user_id !== userId) {
    throw createError({
      statusCode: 409,
      message: 'Этот email уже используется другим пользователем'
    })
  }

  // 2. Записываем новый email в БД и СБРАСЫВАЕМ статус верификации в null
  const updatedUser = await prisma.users.update({
    where: { user_id: userId },
    data: {
      email: newEmail,
      email_verified_at: null
    },
    include: { role: { select: { role_name: true } } }
  })
    console.log('updatedUser', updatedUser)
  // 3. Обновляем сессию (email_verified_at ЖЕЛЕЗОБЕТОННО = null)
  await setUserSession(event, {
    user: {
      user_id: updatedUser.user_id,
      user_name: updatedUser.user_name,
      phone: updatedUser.phone,
      email: updatedUser.email,
      email_verified_at: null,
      role_id: updatedUser.role_id,
      role_name: updatedUser.role.role_name,
      avatar_path: updatedUser.avatar_path || null,
      activated_at: updatedUser.activated_at
        ? new Date(updatedUser.activated_at).toISOString()
        : null
    }
  })

  // 4. Генерируем токен и отправляем письмо
  await ensureDefaultEmailTemplate()
  const redis = getRedisClient()
  const token = crypto.randomUUID()
  await redis.set(`verify-email:${token}`, String(userId), 'EX', 86400)

  try {
    await sendVerificationEmail(newEmail, token, updatedUser.user_name || undefined)
  } catch (err) {
    throw createError({
      statusCode: 500,
      message: 'Не удалось отправить письмо с подтверждением',
      cause: err
    })
  }

  return { success: true, message: 'Ссылка с подтверждением отправлена на ваш email' }
})
