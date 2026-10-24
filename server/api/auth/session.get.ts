export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)

  if (!session.user) {
    return { user: null }
  }

  return {
    user: {
      user_id: session.user.user_id,
      role_name: session.user.role_name,
      phone: session.user.phone,
      email: session.user.email || null,
      avatar_path: session.avatar_path || null
    }
  }
})
