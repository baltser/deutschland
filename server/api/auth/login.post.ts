import { z } from 'zod'
import { authService } from '#server/services/auth/auth.service'
import type { AuthResponse } from '#server/types/auth'

const loginSchema = z.object({
  phone: z.string().min(10, 'Введите корректный номер телефона'),
  password: z.string().min(1, 'Введите пароль')
})

export default defineEventHandler(async (event): Promise<AuthResponse> => {
  const body = await readValidatedBody(event, (b) => loginSchema.parse(b))

  // Cравнение хэшей и ошибок — внутри сервиса
  const sessionUser = await authService.login(body.phone, body.password)

  // Установка сессии Nitro Auth остается на уровне эндпоинта
  await setUserSession(event, { user: sessionUser })

  return {
    success: true,
    user: sessionUser
  }
})
