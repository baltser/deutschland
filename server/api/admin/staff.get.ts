import { logger } from '#server/utils/logger'
import { prisma } from '#server/utils/prisma'
import type { StaffListResponse } from '#server/types/admin'

export default defineEventHandler(async (event): Promise<StaffListResponse> => {
  const session = await getUserSession(event)
  if (!session || !session.user || session.user.role_name !== 'admin') {
    throw createError({ statusCode: 403, message: 'Доступ запрещен' })
  }

  const log = logger.withTag('admin:staff')

  try {
    const staff = await prisma.users.findMany({
      where: {
        role_name: {
          not: 'client'
        }
      },
      select: {
        user_id: true,
        user_name: true,
        email: true,
        phone: true,
        avatar_path: true,
        activated_at: true,
        role_name: true
      },
      orderBy: {
        user_id: 'desc',
      },
    })

    log.info(`Запрошен список сотрудников. Всего найдено: ${staff.length}`)

    return {
      success: true,
      users: staff
    }
  } catch (err: unknown) {
    log.error('Ошибка при получении списка сотрудников:', { cause: err })
    throw createError({
      statusCode: 500,
      message: 'Не удалось получить список сотрудников',
      cause: err
    })
  }
})
