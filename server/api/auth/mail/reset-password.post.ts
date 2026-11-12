import { z } from 'zod'
import { emailVerificationService } from '#server/services/auth/email-verification.service'

const bodySchema = z.object({
  email: z.email('Введите корректный email')
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, (b) => bodySchema.parse(b))

  return await emailVerificationService.requestPasswordReset(body.email)
})
