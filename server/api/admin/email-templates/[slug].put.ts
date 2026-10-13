import { z } from 'zod'
import { logger } from '#server/utils/logger'

const updateSchema = z.object({
  title: z.string().min(1, 'Название обязательно'),
  subject: z.string().min(1, 'Тема письма обязательна'),
  body_html: z.string().min(1, 'HTML-код не может быть пустым')
})

interface ApiError {
  message?: string
}

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const log = logger.withTag('admin:email-templates')

  // Проверка прав администратора
  if (session.user.role_name !== 'admin') {
    throw createError({
      statusCode: 403,
      message: 'Доступ запрещен: требуются права администратора'
    })
  }

  const slug = getRouterParam(event, 'slug')
  if (!slug) {
    throw createError({
      statusCode: 400,
      message: 'Не указан идентификатор шаблона (slug)'
    })
  }

  const body = await readBody(event)
  const parseResult = updateSchema.safeParse(body)

  if (!parseResult.success) {
    throw createError({
      statusCode: 400,
      message: parseResult.error.issues[0]?.message || 'Ошибка валидации данных'
    })
  }

  const { title, subject, body_html } = parseResult.data

  try {
    const updatedTemplate = await prisma.email_templates.update({
      where: { slug },
      data: {
        title,
        subject,
        body_html
      }
    })

    log.success(`Шаблон письма "${slug}" успешно обновлен администратором ID: ${session.user.user_id}`)

    return {
      success: true,
      message: 'Шаблон успешно обновлен',
      template: updatedTemplate
    }
  } catch (err: unknown) {
    const apiErr = err as ApiError
    log.error(`Ошибка при обновлении шаблона ${slug}:`, { cause: err })
    throw createError({
      statusCode: 500,
      message: apiErr?.message || 'Не удалось обновить шаблон в базе данных'
    })
  }
})
