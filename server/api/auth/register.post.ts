import bcrypt from 'bcryptjs'
import { z } from 'zod'

const bodySchema = z.object({
  name: z.string().min(1, 'Имя обязательно'),
  email: z.string().email('Некорректный формат email'),
  password: z.string().min(6, 'Пароль должен быть не менее 6 символов'),
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, b => bodySchema.parse(b))

  const clientIp = getRequestIP(event) || 'unknown'
  const userAgent = getRequestHeader(event, 'user-agent') || 'unknown'

  logger.info(`Попытка регистрации: ${body.email}`, { ip: clientIp, userAgent })

  // prisma доступен автоматически без импортов
  const existingUser = await prisma.user.findUnique({
    where: { email: body.email },
  })

  if (existingUser) {
    logger.warn(`Неудачная регистрация: email ${body.email} уже зарегистрирован`, { ip: clientIp })

    throw createError({
      statusCode: 409,
      statusMessage: 'Пользователь с таким email уже существует',
    })
  }

  const hashedPassword = await bcrypt.hash(body.password, 10)

  const user = await prisma.user.create({
    data: {
      name: body.name,
      email: body.email,
      password: hashedPassword,
      ruleName: 'user',
    },
  })

  await setUserSession(event, {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      rule_name: user.ruleName,
      created_at: user.createdAt.toISOString(),
    },
  })

  logger.info(`✅ Успешная регистрация: ${user.email}`, { userId: user.id })

  setResponseStatus(event, 201)

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
