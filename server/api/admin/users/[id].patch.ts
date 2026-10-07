export default defineEventHandler(async (event) => {
  // 1. Проверяем авторизацию и права администратора
  // const session = await requireUserSession(event)
  // if (session.user.rule_name !== 'admin') {
  //   throw createError({
  //     statusCode: 403,
  //     statusMessage: 'У вас нет прав для выполнения этой операции',
  //   })
  // }

  // 2. Получаем ID из параметров URL
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!body.ruleName) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Не указана новая роль',
    })
  }

  // 3. Обновляем роль пользователя в БД
  // Примечание: Если у вас id в схеме Prisma числовой (Int), используйте Number(id)
  const updatedUser = await prisma.user.update({
    where: { id: String(id) },
    data: {
      ruleName: body.ruleName,
    },
    select: {
      id: true,
      name: true,
      email: true,
      ruleName: true,
      createdAt: true,
    },
  })

  return updatedUser
})
