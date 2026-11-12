import { prisma } from '#server/utils/prisma'
import type { Prisma } from '@prisma/client'

export const templateRepository = {

  /** Получение всех шаблонов писем, отсортированных по дате обновления */
  async findAll() {
    return prisma.email_templates.findMany({
      orderBy: { updated_at: 'desc' }
    })
  },

  /** Получение шаблона письма по его уникальному слагу (slug)  */
  async findBySlug(slug: string) {
    return prisma.email_templates.findUnique({
      where: { slug }
    })
  },

  /** Обновление шаблона письма по слагу (slug) */

  async update(slug: string, data: Prisma.email_templatesUpdateInput) {
    return prisma.email_templates.update({
      where: { slug },
      data
    })
  },

  /** На всякий случай (вдруг пригодится) — создание нового шаблона   */
  async create(data: Prisma.email_templatesCreateInput) {
    return prisma.email_templates.create({
      data
    })
  }
}
