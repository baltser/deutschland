import { z } from 'zod'
import { getRedisClient } from '#server/utils/redis'
import { sendVerificationEmail } from '#server/utils/mail'
import { ensureDefaultEmailTemplate } from '#server/utils/emailTemplates'

const bodySchema = z.object({
  email: z.email('Введите корректный email').optional().nullable()
})

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)

  if (!session.user?.user_id) {
    throw createError({ statusCode: 401, message: 'Необходима авторизация' })
  }

  const body = await readValidatedBody(event, (b) => bodySchema.parse(b)).catch(() => ({} as { email?: string | null }))
  const redis = getRedisClient()

  await ensureDefaultEmailTemplate()

  const user = await prisma.users.findUnique({
    where: { user_id: session.user.user_id },
    include: { role: { select: { role_name: true } } }
  })

  if (!user) {
    throw createError({ statusCode: 404, message: 'Пользователь не найден' })
  }

  const targetEmail = body.email || user.email

  if (!targetEmail) {
    throw createError({
      statusCode: 400,
      message: 'Укажите и сохраните электронную почту перед отправкой подтверждения'
    })
  }

  // 💡 ВСЕГДА обновляем email (если передан) и гарантированно сбрасываем статус в БД
  const updatedUser = await prisma.users.update({
    where: { user_id: user.user_id },
    data: {
      ...(body.email ? { email: body.email } : {}),
      email_verified_at: null
    },
    include: { role: { select: { role_name: true } } }
  })

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
      activated_at: updatedUser.activated_at || null
    }
  })

  const token = crypto.randomUUID()
  await redis.set(`verify-email:${token}`, String(updatedUser.user_id), 'EX', 86400)

  try {
    await sendVerificationEmail(targetEmail, token, updatedUser.user_name || undefined)
  } catch (err) {
    // Даже если почтовый сервер упал и письмо не ушло, статус в сессии и БД уже честно сброшен
    throw createError({
      statusCode: 500,
      message: 'Не удалось отправить письмо подтверждения. Попробуйте позже.',
      cause: err
    })
  }

  return { success: true, message: 'Письмо для подтверждения успешно отправлено' }
})
