import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { logger } from '#server/utils/logger'
import { normalizeAndValidatePhone } from '#server/utils/phone'

const loginSchema = z.object({
  phone: z.string().min(10, 'Введите номер телефона'),
  password: z.string().min(1, 'Введите пароль')
})

export default defineEventHandler(async (event) => {
  const log = logger.withTag('auth:login')

  const body = await readBody(event)
  const parseResult = loginSchema.safeParse(body)

  if (!parseResult.success) {
    throw createError({
      statusCode: 400,
      message: parseResult.error.issues[0]?.message || 'Неверный формат данных'
    })
  }

  const { password } = parseResult.data

  // Нормализуем и проверяем телефон
  const phone = normalizeAndValidatePhone(parseResult.data.phone)

  // 1. Ищем пользователя по номеру телефона вместе с ролью
  const user = await prisma.users.findFirst({
    where: { phone },
    include: { role: true }
  })

  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'Неверный номер телефона или пароль'
    })
  }

  // 2. Проверяем пароль
  const isValidPassword = await bcrypt.compare(password, user.password!)
  if (!isValidPassword) {
    throw createError({
      statusCode: 401,
      message: 'Неверный номер телефона или пароль'
    })
  }

  // 3. Устанавливаем сессию строго по нашему интерфейсу
  await setUserSession(event, {
    user: {
      user_id: user.user_id,
      phone: user.phone,
      user_name: user.user_name,
      email: user.email || null,
      role_id: user.role_id,
      role_name: user.role.role_name,
      avatar_path: user.avatar_path || null
    }
  })

  log.success(`✅ Успешный вход: ${user.phone} (ID: ${user.user_id})`)

  return {
    success: true,
    user: {
      user_id: user.user_id,
      user_name: user.user_name,
      phone: user.phone,
      role_id: user.role_id,
      avatar_path: user.avatar_path || null
    }
  }
})
