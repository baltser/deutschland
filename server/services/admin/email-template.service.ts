import { templateRepository } from '#server/repositories/prisma/template.repository'
import { logger } from '#server/utils/logger'

const log = logger.withTag('services:admin:email-templates')

export const emailTemplateService = {
  /**
   * Получение списка всех шаблонов писем
   */
  async getAllTemplates() {
    try {
      const templates = await templateRepository.findAll()
      log.info(`Запрошен список шаблонов писем. Всего найдено: ${templates.length}`)
      return templates
    } catch (err: unknown) {
      log.error('Ошибка при получении шаблонов писем:', { cause: err })
      throw createError({
        statusCode: 500,
        message: 'Не удалось загрузить шаблоны писем'
      })
    }
  },

  /**
   * Обновление шаблона письма по slug
   */
  async updateTemplate(slug: string, adminUserId: number, data: { title: string; subject: string; body_html: string }) {
    try {
      const updatedTemplate = await templateRepository.update(slug, {
        title: data.title,
        subject: data.subject,
        body_html: data.body_html
      })

      log.success(`Шаблон письма "${slug}" успешно обновлен администратором ID: ${adminUserId}`)
      return updatedTemplate
    } catch (err: unknown) {
      log.error(`Ошибка при обновлении шаблона ${slug}:`, { cause: err })
      throw createError({
        statusCode: 500,
        message: 'Не удалось обновить шаблон в базе данных'
      })
    }
  }
}
