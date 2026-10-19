import { prisma } from '#server/utils/prisma'

export default defineEventHandler(async (event) => {
  // Проверяем авторизацию пользователя через сессию
  const session = await getUserSession(event)
  if (!session || !session.user) {
    throw createError({
      statusCode: 401,
      message: 'Необходима авторизация',
    })
  }

  // Получаем user_id из сессии (поддерживаем разные варианты структуры сессии)
  const sessionUser = session.user as { user_id?: number; id?: number }
  const userId = sessionUser.user_id || sessionUser.id

  if (!userId) {
    throw createError({
      statusCode: 400,
      message: 'Не удалось определить ID пользователя в сессии',
    })
  }

  try {
    // Находим все связи клиента с адресами через таблицу clients_x_addresses
    const clientAddresses = await prisma.clients_x_addresses.findMany({
      where: { user_id: Number(userId) },
      include: {
        address: {
          include: {
            devices: {
              where: {
                device_type: 'CAMERA', // Фильтруем устройства, оставляя только камеры для клиента
              },
            },
          },
        },
      },
    })

    // Извлекаем чистый массив адресов со списком только камер
    const addresses = clientAddresses.map((item) => item.address)

    return {
      success: true,
      addresses,
    }
  } catch (err: unknown) {
    console.error('Ошибка при загрузке адресов клиента:', err)
    throw createError({
      statusCode: 500,
      message: 'Не удалось загрузить объекты пользователя',
    })
  }
})
