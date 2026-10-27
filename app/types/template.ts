export interface EmailTemplate {
  template_id: number
  slug: string
  title: string
  subject: string
  body_html: string
  updated_at: string | Date
}

export interface TemplatesListResponse {
  success: boolean
  templates: EmailTemplate[]
}

export interface TemplateUpdateResponse {
  success: boolean
  message: string
  template: EmailTemplate
}
