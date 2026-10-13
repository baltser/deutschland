import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { logger } from '#server/utils/logger'

const loginSchema = z.object({
  email: z.email('Некорректный формат email'),
  password: z.string().min(1, 'Введите пароль')
})

export default defineEventHandler(async (event) => {
  const log = logger.withTag('auth:login')

  // 1. Читаем JSON body (не multipart!)
  const body = await readBody(event)
  const parseResult = loginSchema.safeParse(body)

  if (!parseResult.success) {
    throw createError({
      statusCode: 400,
      message: parseResult.error.issues[0]?.message || 'Неверный формат данных'
    })
  }

  const { email, password } = parseResult.data

  // 2. Ищем пользователя и его роль
  const user = await prisma.users.findUnique({
    where: { email },
    include: { role: true }
  })

  if (!user || user.deleted_at) {
    throw createError({
      statusCode: 401,
      message: 'Неверный email или пароль'
    })
  }

  // 3. Проверяем флаг активности (подтверждена ли почта)
  if (!user.is_active) {
    throw createError({
      statusCode: 403,
      message: 'Пожалуйста, подтвердите вашу электронную почту перед входом.'
    })
  }

  // 4. Проверяем пароль
  const isValidPassword = await bcrypt.compare(password, user.password)
  if (!isValidPassword) {
    throw createError({
      statusCode: 401,
      message: 'Неверный email или пароль'
    })
  }

  // 5. Устанавливаем сессию (без лишних полей, строго по нашей модели)
  await setUserSession(event, {
    user: {
      user_id: user.user_id,
      user_name: user.user_name,
      email: user.email,
      role_id: user.role_id,
      role_name: user.role.role_name,
      avatar_path: user.avatar_path || null,
      is_active: user.is_active
    }
  })

  log.success(`✅ Успешный вход: ${user.email} (ID: ${user.user_id})`)

  return {
    success: true,
    user: {
      user_id: user.user_id,
      user_name: user.user_name,
      email: user.email,
      role_id: user.role_id,
      avatar_path: user.avatar_path || null
    }
  }
})
