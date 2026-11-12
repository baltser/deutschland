import { emailTemplateService } from '#server/services/admin/email-template.service'
import type { EmailTemplatesListResponse } from '#server/types/admin'

export default defineEventHandler(async (): Promise<EmailTemplatesListResponse> => {
  const templates = await emailTemplateService.getAllTemplates()

  return {
    success: true,
    templates
  }
})
