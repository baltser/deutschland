// server/api/auth/login.post.ts
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const loginSchema = z.object({
  phone: z.string().min(10, 'Некорректный номер телефона'),
  password: z.string().min(1, 'Введите пароль')
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parseResult = loginSchema.safeParse(body)

  if (!parseResult.success) {
    throw createError({
      statusCode: 400,
      message: parseResult.error.issues[0]?.message || 'Ошибка валидации данных'
    })
  }

  const { phone, password } = parseResult.data

  const user = await prisma.users.findUnique({
    where: { phone },
    include: { role: { select: { role_name: true } } }
  })

  // 1. Проверяем, что пользователь существует и у него есть строковый пароль в БД
  if (!user || !user.password || typeof user.password !== 'string') {
    throw createError({
      statusCode: 401,
      message: 'Неверный номер телефона или пароль'
    })
  }

// 2. Безопасно сравниваем пароль
  const isValidPassword = await bcrypt.compare(password, user.password).catch(() => false)

  if (!isValidPassword) {
    throw createError({
      statusCode: 401,
      message: 'Неверный номер телефона или пароль'
    })
  }

  // 3. Устанавливаем сессию
  await setUserSession(event, {
    user: {
      user_id: user.user_id,
      user_name: user.user_name,
      phone: user.phone,
      email: user.email,
      email_verified_at: user.email_verified_at ? new Date(user.email_verified_at).toISOString() : null,
      role_id: user.role_id,
      role_name: user.role.role_name,
      avatar_path: user.avatar_path || null,
      activated_at: user.activated_at ? new Date(user.activated_at).toISOString() : null
    }
  })

  return { success: true }
})
