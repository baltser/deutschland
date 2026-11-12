import { z } from 'zod'
import { registrationService } from '#server/services/auth/registration.service'
import type { RegisterInitResponse } from '#server/types/auth'

const initSchema = z.object({
  phone: z.string().min(10, 'Введите номер телефона'),
  password: z.string().min(6, 'Пароль должен быть не менее 6 символов')
})

export default defineEventHandler(async (event): Promise<RegisterInitResponse> => {
  const body = await readValidatedBody(event, (b) => initSchema.parse(b))

  return await registrationService.initRegistration(body.phone, body.password)
})
