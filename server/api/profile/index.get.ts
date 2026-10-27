import type { UserProfile } from '#server/types/profile'

export default defineEventHandler(async (event): Promise<UserProfile> => {
  const session = await getUserSession(event)
  if (!session.user) {
    throw createError({
      statusCode: 401,
      message: 'Необходима авторизация'
    })
  }

  const user = await prisma.users.findUnique({
    where: { user_id: session.user.user_id },
    select: {
      user_id: true,
      user_name: true,
      phone: true,
      email: true,
      email_verified_at: true,
      avatar_path: true,
      role_name: true,
      activated_at: true,
    }
  })

  if (!user) {
    throw createError({
      statusCode: 404,
      message: 'Пользователь не найден'
    })
  }

  return user
})
