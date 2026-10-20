import { prisma } from '#server/utils/prisma'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session || !session.user) {
    throw createError({ statusCode: 401, message: 'Необходима авторизация' })
  }

  const sessionUser = session.user as { role_name?: string }
  if (!['admin', 'installer'].includes(sessionUser.role_name || '')) {
    throw createError({ statusCode: 403, message: 'Недостаточно прав' })
  }

  try {
    // Получаем абсолютно все адреса и все устройства к ним
    const addresses = await prisma.addresses.findMany({
      include: {
        devices: true,
      },
    })

    return {
      success: true,
      addresses,
    }
  } catch (err) {
    console.error('Ошибка загрузки устройств для монтажника:', err)
    throw createError({ statusCode: 500, message: 'Ошибка сервера' })
  }
})
