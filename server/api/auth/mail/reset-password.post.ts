import { z } from 'zod'
import { getRedisClient } from '#server/utils/redis'
import { ensureDefaultEmailTemplate } from '#server/utils/emailTemplates'

const bodySchema = z.object({
  email: z.email('Введите корректный email')
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, bodySchema.parse)
  const redis = getRedisClient()

  await ensureDefaultEmailTemplate()

  const user = await prisma.users.findUnique({
    where: { email: body.email }
  })

  // Из соображений безопасности никогда не говорим злоумышленникам, существует ли такой email в базе.
  // Если пользователя нет или у него не подтверждена почта — просто возвращаем успех.
  if (!user || !user.email_verified_at || !user.email) {
    return { success: true, message: 'Если такой email зарегистрирован и подтвержден, инструкция отправлена.' }
  }

  // Генерируем токен сброса пароля (живет 1 час)
  const token = crypto.randomUUID()
  await redis.set(`reset-password:${token}`, String(user.user_id), 'EX', 3600)

  // TODO: Здесь позже подключим отправку письма сброса пароля (по аналогии с sendVerificationEmail,
  // когда создадим шаблон сброса пароля в базе под slug 'password_reset')
  // Например: await sendPasswordResetEmail(user.email, token, user.user_name || undefined)

  return { success: true, message: 'Если такой email зарегистрирован и подтвержден, инструкция отправлена.' }
})
