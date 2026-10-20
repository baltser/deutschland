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

  const sessionUser = session.user as { user_id?: number; id?: number; role_name?: string }
  const userId = sessionUser.user_id || sessionUser.id
  const roleName = sessionUser.role_name

  if (!userId) {
    throw createError({
      statusCode: 400,
      message: 'Не удалось определить ID пользователя в сессии',
    })
  }

  try {
    let addresses = []

    // Если пользователь — администратор, отдаем вообще все адреса в системе
    if (roleName === 'admin') {
      addresses = await prisma.addresses.findMany({
        include: {
          devices: {
            where: {
              device_type: 'CAMERA', // Администратор видит только камеры в этом разделе
            },
          },
        },
      })
    } else {
      // Если это обычный клиент, ищем только привязанные к нему адреса
      const clientAddresses = await prisma.clients_x_addresses.findMany({
        where: { user_id: Number(userId) },
        include: {
          address: {
            include: {
              devices: {
                where: {
                  device_type: 'CAMERA', // Клиент видит только камеры
                },
              },
            },
          },
        },
      })

      addresses = clientAddresses.map((item) => item.address)
    }

    return {
      success: true,
      addresses,
    }
  } catch (err: unknown) {
    console.error('Ошибка при загрузке объектов:', err)
    throw createError({
      statusCode: 500,
      message: 'Не удалось загрузить объекты',
    })
  }
})
