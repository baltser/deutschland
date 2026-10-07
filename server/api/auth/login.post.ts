import bcrypt from 'bcryptjs'
import { z } from 'zod'

const bodySchema = z.object({
  email: z.string().email('Некорректный формат email'),
  password: z.string().min(1, 'Пароль обязателен'),
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, b => bodySchema.parse(b))

  const clientIp = getRequestIP(event) || 'unknown'
  const userAgent = getRequestHeader(event, 'user-agent') || 'unknown'

  logger.info(`Попытка входа: ${body.email}`, { ip: clientIp, userAgent })

  // prisma доступен автоматически без импортов
  const user = await prisma.user.findUnique({
    where: { email: body.email },
  })

  if (!user) {
    logger.warn(`Неудачная попытка входа (пользователь не найден): ${body.email}`, { ip: clientIp })

    throw createError({
      statusCode: 401,
      statusMessage: 'Неверный email или пароль',
    })
  }

  const isPasswordValid = await bcrypt.compare(body.password, user.password)

  if (!isPasswordValid) {
    logger.warn(`Неудачная попытка входа (неверный пароль): ${body.email}`, { ip: clientIp })

    throw createError({
      statusCode: 401,
      statusMessage: 'Неверный email или пароль',
    })
  }

  await setUserSession(event, {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      rule_name: user.ruleName,
      created_at: user.createdAt.toISOString(),
    },
  })

  logger.info(`✅ Успешный вход: ${user.email}`, { userId: user.id })

  return {
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      rule_name: user.ruleName,
    },
  }
})
