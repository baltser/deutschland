import nodemailer from 'nodemailer'
import { logger } from '#server/utils/logger'
import { renderEmailTemplate, DEFAULT_VERIFICATION_TEMPLATE } from '#server/utils/emailTemplates'

export async function sendVerificationEmail(toEmail: string, token: string, userName?: string) {
  const config = useRuntimeConfig()
  const log = logger.withTag('mail')

  const appUrl = config.public.appUrl || 'http://localhost:3000'
  const verificationLink = `${appUrl}/api/auth/verify?token=${token}`

  // 1. Извлекаем шаблон из базы данных
  const dbTemplate = await prisma.email_templates.findUnique({
    where: { slug: 'email_verification' }
  })

  const rawSubject = dbTemplate?.subject || DEFAULT_VERIFICATION_TEMPLATE.subject
  const rawHtml = dbTemplate?.body_html || DEFAULT_VERIFICATION_TEMPLATE.body_html

  // 2. Формируем контекст переменных
  const variables = {
    userName: userName || 'пользователь',
    verificationLink,
    appUrl
  }

  // 3. Рендерим тему и тело
  const subject = renderEmailTemplate(rawSubject, variables)
  const html = renderEmailTemplate(rawHtml, variables)

  // Читаем параметры SMTP напрямую из process.env (актуально на момент запуска в Docker)
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.mail.ru',
    port: Number(process.env.SMTP_PORT) || 465,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  })

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Двор на замок" <motokawasaki@mail.ru>',
      to: toEmail,
      subject,
      html
    })

    log.success(`Письмо подтверждения успешно отправлено на ${toEmail} (ID: ${info.messageId})`)
    return info
  } catch (err: unknown) {
    log.error(`Ошибка при отправке письма на ${toEmail}:`, { cause: err })
    throw err
  }
}
