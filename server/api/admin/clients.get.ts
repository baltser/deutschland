import { logger } from '#server/utils/logger'

export default defineEventHandler(async () => {
  const log = logger.withTag('admin:clients')

  try {
    const clients = await prisma.users.findMany({
      where: {
        role: {
          role_name: 'client'
        }
      },
      select: {
        user_id: true,
        user_name: true,
        email: true,
        phone: true,
        avatar_path: true,
        activated_at: true,
        addresses: {
          include: {
            address: true // Подтягиваем данные самого адреса из связи clients_x_addresses
          }
        },
        role: {
          select: {
            role_name: true
          }
        }
      },
      orderBy: {
        user_id: 'desc',
      },
    })

    log.info(`Запрошен список клиентов с адресами. Всего: ${clients.length}`)

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
