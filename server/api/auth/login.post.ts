import { z } from 'zod'
import bcrypt from 'bcryptjs'

const loginSchema = z.object({
  phone: z.string().min(10, 'Введите корректный номер телефона'),
  password: z.string().min(1, 'Введите пароль')
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, (b) => loginSchema.parse(b))
  const cleanPhone = body.phone.trim()

  // Ищем пользователя в базе данных (role_name уже находится прямо в модели users)
  const user = await prisma.users.findUnique({
    where: { phone: cleanPhone }
  })

  if (!user || !user.password) {
    throw createError({
      statusCode: 401,
      message: 'Неверный номер телефона или пароль'
    })
  }

  // Сверяем пароль через bcrypt
  const isPasswordValid = await bcrypt.compare(body.password, user.password)
  if (!isPasswordValid) {
    throw createError({
      statusCode: 401,
      message: 'Неверный номер телефона или пароль'
    })
  }

  // Записываем сессию (role_name берется напрямую из user.role_name)
  await setUserSession(event, {
    user: {
      user_id: user.user_id,
      role_name: user.role_name,
      phone: user.phone,
      user_name: user.user_name || null,
      email: user.email || null,
      avatar_path: user.avatar_path || null,
    }
  })

  return {
    success: true,
    user: {
      user_id: user.user_id,
      role_name: user.role_name,
      phone: user.phone,
      user_name: user.user_name || null,
      email: user.email || null,
      avatar_path: user.avatar_path || null
    }
  }
})
