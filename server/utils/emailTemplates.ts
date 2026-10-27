export const DEFAULT_VERIFICATION_TEMPLATE = {
  slug: 'email_verification',
  title: 'Подтверждение регистрации',
  subject: 'Подтверждение email адреса',
  body_html: `<!DOCTYPE html>
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333333; background-color: #ffffff;">

  <!-- Логотип -->
  <div style="text-align: center; margin-bottom: 24px;">
    <img src="cid:logo@dnz" alt="Логотип" style="max-width: 140px; height: auto;" />
  </div>

  <h2 style="color: #111827; font-size: 20px; font-weight: bold; margin-bottom: 16px;">
    Подтверждение регистрации
  </h2>

  <p style="color: #4b5563; font-size: 15px; line-height: 1.5;">
    Здравствуйте, {{userName}}! ✨
  </p>

  <p style="color: #4b5563; font-size: 15px; line-height: 1.5; margin-bottom: 24px;">
    Для завершения регистрации и подтверждения вашего email-адреса нажмите на кнопку ниже:
  </p>

  <!-- Кнопка действия -->
  <div style="text-align: center; margin: 32px 0;">
    <a
      href="{{verificationLink}}"
      target="_blank"
      style="display: inline-block; background-color: #00dc82; color: #ffffff; font-size: 15px; font-weight: bold; text-decoration: none; padding: 12px 28px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"
    >
      Подтвердить Email
    </a>
  </div>

  <!-- Резервная текстовая ссылка, если кнопка не нажимается -->
  <p style="color: #6b7280; font-size: 13px; line-height: 1.4; margin-top: 24px;">
    Если кнопка выше не работает, скопируйте и вставьте следующую ссылку в адресную строку браузера:
    <br>
    <a href="{{verificationLink}}" style="color: #00dc82; word-break: break-all;">{{verificationLink}}</a>
  </p>

  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 28px 0 20px 0;">

  <p style="color: #9ca3af; font-size: 12px; margin: 0;">
    Если вы не регистрировались на сайте «Двор на замок», просто проигнорируйте это письмо.
  </p>

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
