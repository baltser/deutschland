import { z } from 'zod'
import { emailTemplateService } from '#server/services/admin/email-template.service'
import type { EmailTemplateUpdateResponse, UpdateEmailTemplateBody } from '#server/types/admin'

const updateSchema = z.object({
  title: z.string().min(1, 'Название обязательно'),
  subject: z.string().min(1, 'Тема письма обязательна'),
  body_html: z.string().min(1, 'HTML-код не может быть пустым')
})

export default defineEventHandler(async (event): Promise<EmailTemplateUpdateResponse> => {
  const user = event.context.user
  const slug = getRouterParam(event, 'slug')

  if (!slug) {
    throw createError({
      statusCode: 400,
      message: 'Не указан идентификатор шаблона (slug)'
    })
  }

  const body = await readBody<UpdateEmailTemplateBody>(event)
  const parseResult = updateSchema.safeParse(body)

  if (!parseResult.success) {
    throw createError({
      statusCode: 400,
      message: parseResult.error.issues[0]?.message || 'Ошибка валидации данных'
    })
  }

  const updatedTemplate = await emailTemplateService.updateTemplate(
    slug,
    user.user_id,
    parseResult.data
  )

  return {
    success: true,
    message: 'Шаблон успешно обновлен',
    template: updatedTemplate
  }
})
