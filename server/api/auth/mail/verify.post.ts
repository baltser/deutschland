import { z } from 'zod'
import { emailVerificationService } from '#server/services/auth/email-verification.service'

const bodySchema = z.object({
  email: z.email('Введите корректный email')
})

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const userId = Number(session.user.user_id)

  const body = await readValidatedBody(event, (b) => bodySchema.parse(b))

  return await emailVerificationService.requestEmailVerification(userId, body.email.trim().toLowerCase())
})
