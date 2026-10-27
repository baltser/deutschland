import { logger } from '#server/utils/logger'
import { prisma } from '#server/utils/prisma'
import type { EmailTemplatesListResponse } from '#server/types/admin'

export default defineEventHandler(async (event): Promise<EmailTemplatesListResponse> => {
  // 1. Проверяем сессию и права администратора
  const session = await requireUserSession(event)
  const log = logger.withTag('admin:email-templates')

  if (session.user.role_name !== 'admin') {
    throw createError({
      statusCode: 403,
      message: 'Доступ запрещен: требуются права администратора'
    })
  }

  try {
    // 2. Получаем все шаблоны из базы данных, отсортированные по дате обновления
    const templates = await prisma.email_templates.findMany({
      orderBy: { updated_at: 'desc' }
    })

    log.info(`Запрошен список шаблонов писем. Всего найдено: ${templates.length}`)

    return {
      success: true,
      templates
    }
  } catch (err: unknown) {
    const apiErr = err as { message?: string }
    log.error('Ошибка при получении шаблонов писем:', { cause: err })
    throw createError({
      statusCode: 500,
      message: apiErr?.message || 'Не удалось загрузить шаблоны писем'
    })
  }
})
