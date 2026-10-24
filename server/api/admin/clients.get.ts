import { logger } from '#server/utils/logger'
import { prisma } from '#server/utils/prisma'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session || !session.user || session.user.role_name !== 'admin') {
    throw createError({ statusCode: 403, message: 'Доступ запрещен' })
  }

  const log = logger.withTag('admin:clients')

  try {
    const clients = await prisma.users.findMany({
      where: {
        role_name: 'client'
      },
      select: {
        user_id: true,
        user_name: true,
        email: true,
        phone: true,
        avatar_path: true,
        activated_at: true,
        role_name: true,
        addresses: {
          include: {
            address: true
          }
        }
      },
      orderBy: {
        user_id: 'desc',
      },
    })

    log.info(`Запрошен список клиентов. Всего найдено: ${clients.length}`)

    return {
      success: true,
      clients
    }
  } catch (err: unknown) {
    log.error('Ошибка при получении списка клиентов:', { cause: err })
    throw createError({
      statusCode: 500,
      message: 'Не удалось получить список клиентов',
      cause: err
    })
  }
})
