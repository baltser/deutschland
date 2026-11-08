export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname

  // Проверяем только защищенные API-маршруты
  const isAdminRoute = path.startsWith('/api/admin/')
  const isClientOrProfileRoute = path.startsWith('/api/client/') || path.startsWith('/api/profile/')

  if (isAdminRoute || isClientOrProfileRoute) {
    const session = await getUserSession(event)

    if (!session?.user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
        message: 'Необходима авторизация.'
      })
    }

    const role = session.user.role_name

    // Проверка прав для админки
    if (isAdminRoute && role !== 'admin') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden',
        message: 'Доступ запрещен. Требуются права администратора.'
      })
    }

    // Проверка прав для клиента и профиля
    if (isClientOrProfileRoute && role !== 'admin' && role !== 'client') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden',
        message: 'Доступ разрешен только для клиентов и администраторов.'
      })
    }

    // 🔥 Сохраняем объект пользователя в контекст запроса!
    // Теперь любой эндпоинт сможет взять его готовым, не вызывая getUserSession заново.
    event.context.user = session.user
  }
})
