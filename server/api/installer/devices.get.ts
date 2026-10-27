import { prisma } from '#server/utils/prisma'
import { logger } from '#server/utils/logger'
import type { InstallerDevicesResponse } from '#server/types/installer'
import type { DeviceType } from '@prisma/client'

export default defineEventHandler(async (event): Promise<InstallerDevicesResponse> => {
  const log = logger.withTag('installer:devices')

  // 1. Проверяем сессию и роль монтажника (или администратора)[cite: 9]
  const session = await getUserSession(event)
  if (!session || !session.user) {
    throw createError({ statusCode: 401, message: 'Необходима авторизация' })
  }

  const { role_name } = session.user
  if (role_name !== 'installer' && role_name !== 'admin') {
    throw createError({ statusCode: 403, message: 'Доступ запрещен' })
  }

  // 2. Читаем опциональный фильтр из query (например, ?type=PANEL или ?type=CAMERA)[cite: 9]
  const query = getQuery(event)
  const deviceType = typeof query.type === 'string' ? query.type : undefined

  try {
    // 3. Монтажник видит все адреса в системе, но с отфильтрованными устройствами[cite: 9]
    const addresses = await prisma.addresses.findMany({
      include: {
        devices: {
          where: deviceType ? { device_type: deviceType as DeviceType } : undefined,
        },
      },
    })

    // Опционально: оставляем только те адреса, на которых реально есть устройства после фильтрации[cite: 9]
    const filteredAddresses = deviceType
      ? addresses.filter((addr) => addr.devices.length > 0)
      : addresses

    log.info(`Загружено объектов для монтажника: ${filteredAddresses.length}`)

    return {
      success: true,
      addresses: filteredAddresses,
    }
  } catch (err) {
    log.error('Ошибка при загрузке устройств для монтажника:', err)
    throw createError({ statusCode: 500, message: 'Не удалось загрузить оборудование' })
  }
})
