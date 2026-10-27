import type { SessionResponse } from '#server/types/auth'

export default defineEventHandler(async (event): Promise<SessionResponse> => {
  const session = await getUserSession(event)

  if (!session.user) {
    return { user: null }
  }

  return {
    user: {
      user_id: session.user.user_id,
      user_name: session.user.user_name || null,
      role_name: session.user.role_name,
      avatar_path: session.user.avatar_path || null
    }
  }
})
