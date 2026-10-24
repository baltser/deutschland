import { prisma } from '#server/utils/prisma'
import { logger } from '#server/utils/logger'

export default defineEventHandler(async (event) => {
  const log = logger.withTag('client:addresses')

  // 1. Проверяем сессию
  const session = await getUserSession(event)
  if (!session || !session.user) {
    throw createError({
      statusCode: 401,
      message: 'Необходима авторизация',
    })
  }

  const { user_id, role_name } = session.user

  if (!user_id) {
    throw createError({
      statusCode: 400,
      message: 'Не удалось определить ID пользователя в сессии',
    })
  }

  // 2. Строго проверяем, что запрос делает именно клиент
  if (role_name !== 'client') {
    throw createError({
      statusCode: 403,
      message: 'Доступ разрешен только для клиентов',
    })
  }

  try {
    // 3. Загружаем адреса, привязанные к клиенту, с фильтрацией доступных ему устройств
    const clientAddresses = await prisma.clients_x_addresses.findMany({
      where: { user_id: Number(user_id) },
      include: {
        address: {
          include: {
            devices: {
              where: {
                device_type: 'CAMERA', // 👈 Возвращаем фильтр: клиент видит только разрешенный тип устройств
              },
            },
          },
        },
      },
    })

    const addresses = clientAddresses.map((item) => item.address)

    log.info(`Загружено объектов для клиента ID ${user_id}: ${addresses.length}`)

    return {
      success: true,
      addresses,
    }
  } catch (err: unknown) {
    log.error(`Ошибка при загрузке объектов для клиента ID ${user_id}:`, err)
    throw createError({
      statusCode: 500,
      message: 'Не удалось загрузить ваши объекты',
    })
  }
})
