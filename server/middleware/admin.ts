export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname

  // Проверяем, защищаем ли мы админский префикс
  if (path.startsWith('/api/admin/')) {
    const session = await getUserSession(event)

    if (!session || !session.user || session.user.role_name !== 'admin') {
      throw createError({
        statusCode: 403,
        message: 'Доступ запрещен. Требуются права администратора.'
      })
    }
  }
})
