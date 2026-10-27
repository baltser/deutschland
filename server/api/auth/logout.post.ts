import type { LogoutResponse } from '#server/types/auth'

export default defineEventHandler(async (event): Promise<LogoutResponse> => {
  await clearUserSession(event)
  return { success: true }
})
