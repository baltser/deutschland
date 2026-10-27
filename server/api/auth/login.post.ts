import { z } from 'zod'
import bcrypt from 'bcryptjs'
import type {AuthResponse} from "#server/types/auth.ts";

const loginSchema = z.object({
  phone: z.string().min(10, 'Введите корректный номер телефона'),
  password: z.string().min(1, 'Введите пароль')
})

export default defineEventHandler(async (event): Promise<AuthResponse> => {
  const body = await readValidatedBody(event, (b) => loginSchema.parse(b))
  const cleanPhone = body.phone.trim()

  const user = await prisma.users.findUnique({
    where: { phone: cleanPhone }
  })

  if (!user || !user.password) {
    throw createError({
      statusCode: 401,
      message: 'Неверный номер телефона или пароль'
    })
  }

  const isPasswordValid = await bcrypt.compare(body.password, user.password)
  if (!isPasswordValid) {
    throw createError({
      statusCode: 401,
      message: 'Неверный номер телефона или пароль'
    })
  }

  const sessionUser = {
    user_id: user.user_id,
    role_name: user.role_name,
    user_name: user.user_name || null,
    avatar_path: user.avatar_path || null
  }

  await setUserSession(event, { user: sessionUser })

  return {
    success: true,
    user: sessionUser
  }
})
