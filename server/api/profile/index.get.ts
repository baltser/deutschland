export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user) {
    throw createError({
      statusCode: 401,
      message: 'Необходима авторизация'
    })
  }

  if (session.user.role_name !== 'client' && session.user.role_name !== 'admin') {
    throw createError({
      statusCode: 403,
      message: 'Доступ запрещен'
    })
  }

  // Забираем данные из базы, исключая несуществующее поле created_at
  const user = await prisma.users.findUnique({
    where: { user_id: session.user.user_id },
    select: {
      user_id: true,
      user_name: true,
      role_name: true,
      email: true,
      email_verified_at: true,
      avatar_path: true,
      activated_at: true
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
