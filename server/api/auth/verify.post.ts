import { z } from 'zod'
import { registrationService } from '#server/services/auth/registration.service'
import type { AuthResponse } from '#server/types/auth'

const verifySchema = z.object({
  phone: z.string().min(10, 'Введите номер телефона'),
  code: z.string().length(4, 'Код должен содержать 4 цифры')
})

export default defineEventHandler(async (event): Promise<AuthResponse> => {
  const body = await readValidatedBody(event, (b) => verifySchema.parse(b))

  // Сервис проверяет код в Redis, активирует пользователя в БД и возвращает данные пользователя
  const result = await registrationService.verifyRegistration(body.phone, body.code)

  // Устанавливаем сессию
  await setUserSession(event, { user: result.user })

  return {
    success: true,
    message: result.message,
    user: result.user
  }
})
