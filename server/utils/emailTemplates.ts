export const DEFAULT_VERIFICATION_TEMPLATE = {
  slug: 'email_verification',
  title: 'Подтверждение регистрации',
  subject: 'Подтверждение email адреса',
  body_html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 20px;">
    <img src="{{appUrl}}/logo.png" alt="Логотип" style="max-width: 150px; height: auto;">
  </div>

  <h2 style="color: #333;">Подтверждение регистрации на сайте "Двор на замок"</h2>
  <p style="color: #555; font-size: 15px;">Здравствуйте, {{userName}}! ✨</p>

  <p style="color: #555; font-size: 15px;">Для подтверждения email перейдите по ссылке:</p>
  <p><a href="{{verificationLink}}" style="color: #00dc82; font-weight: bold;">{{verificationLink}}</a></p>

  <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
  <small style="color: #888;">Если вы не регистрировались, проигнорируйте это письмо.</small>
</body>
</html>`
}

/**
 * Автоматически создает дефолтный шаблон в базе, если его еще нет
 */
export async function ensureDefaultEmailTemplate() {
  const existing = await prisma.email_templates.findUnique({
    where: { slug: DEFAULT_VERIFICATION_TEMPLATE.slug }
  })

  if (!existing) {
    await prisma.email_templates.create({
      data: DEFAULT_VERIFICATION_TEMPLATE
    })
  }
}

/**
 * Подставляет значения переменных в шаблон по тегам {{variableName}}
 */
export function renderEmailTemplate(template: string, variables: Record<string, string>): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => {
    return variables[key] !== undefined ? variables[key] : `{{${key}}}`
  })
}
