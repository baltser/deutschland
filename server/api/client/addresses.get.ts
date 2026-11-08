import { prisma } from '#server/utils/prisma'
import { logger } from '#server/utils/logger'
import type { ClientAddressesResponse } from '#server/types/client'

export default defineEventHandler(async (event): Promise<ClientAddressesResponse> => {
  const log = logger.withTag('client:addresses')

  // 1. Безопасно получаем пользователя, которого уже проверил и положил в контекст middleware
  const user = event.context.user
  const user_id = Number(user?.user_id)

  if (!user_id) {
    throw createError({
      statusCode: 400,
      message: 'Не удалось определить ID пользователя в сессии',
    })
  }

  try {
    // 2. Сразу выполняем бизнес-логику (загрузку объектов/камер) без лишних проверок ролей
    const clientAddresses = await prisma.clients_x_addresses.findMany({
      where: { user_id },
      include: {
        address: {
          include: {
            devices: {
              where: {
                device_type: 'CAMERA',
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
