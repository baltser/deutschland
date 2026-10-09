export default defineEventHandler(async (_event) => {
  // 1. Проверяем, что пользователь авторизован
  // const session = await requireUserSession(event)

  // 2. Проверяем права администратора
  // if (session.user) {
  //   throw createError({
  //     statusCode: 403,
  //     statusMessage: 'У вас нет прав для просмотра этого раздела',
  //   })
  // }

  // 3. Возвращаем список пользователей
  return await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      ruleName: true,
      avatar: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })
})
