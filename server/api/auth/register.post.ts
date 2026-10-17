import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { logger } from '#server/utils/logger'
import { normalizeAndValidatePhone } from '#server/utils/phone'

const registerSchema = z.object({
  phone: z.string().min(10, 'Введите номер телефона'),
  password: z.string().min(6, 'Пароль должен быть не менее 6 символов')
})

export default defineEventHandler(async (event) => {
  const log = logger.withTag('auth:register')

  const body = await readBody(event)
  const parseResult = registerSchema.safeParse(body)

  if (!parseResult.success) {
    throw createError({
      statusCode: 400,
      message: parseResult.error.issues[0]?.message || 'Неверный формат данных'
    })
  }

  const phone = normalizeAndValidatePhone(parseResult.data.phone)
  const { password } = parseResult.data

// 1. Ищем пользователя по номеру телефона
  const existingUser = await prisma.users.findFirst({
    where: { phone },
    include: { role: true }
  })

  if (!existingUser) {
    throw createError({
      statusCode: 403,
      message: 'Номер телефона не найден в системе. Обратитесь к администратору.'
    })
  }

  // 2. Универсальная проверка: если у пользователя УЖЕ есть пароль, значит аккаунт активен
  if (existingUser.activated_at !== null) {
    throw createError({
      statusCode: 409,
      message: 'Этот аккаунт уже активирован. Пожалуйста, выполните вход.'
    })
  }

  // 3. Хешируем пароль и активируем аккаунт
  const hashedPassword = await bcrypt.hash(password, 10)

  const updatedUser = await prisma.users.update({
    where: { user_id: existingUser.user_id },
    data: {
      password: hashedPassword,
      activated_at: new Date()
    },
    include: { role: true }
  })

  // 4. Сразу авторизуем пользователя
  await setUserSession(event, {
    user: {
      user_id: updatedUser.user_id,
      phone: updatedUser.phone,
      user_name: updatedUser.user_name || 'Клиент',
      email: updatedUser.email || null,
      role_id: updatedUser.role_id,
      role_name: updatedUser.role.role_name,
      avatar_path: updatedUser.avatar_path || null
    }
  })

  log.success(`✅ Клиент успешно активировал аккаунт: ${updatedUser.phone}`)

  return {
    success: true,
    message: 'Регистрация прошла успешно!',
    user: {
      user_id: updatedUser.user_id,
      user_name: updatedUser.user_name,
      phone: updatedUser.phone,
      role: updatedUser.role.role_name
    }
  }
})
