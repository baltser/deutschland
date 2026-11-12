import { emailVerificationService } from '#server/services/auth/email-verification.service'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)
  const token = query.token as string

  await emailVerificationService.verifyEmail(token)

  const appUrl = config.public.appUrl || 'http://localhost:3000'
  return sendRedirect(event, `${appUrl}/profile?email_verified=true`)
})
