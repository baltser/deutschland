// server/utils/mail.ts
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

  const transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    auth: {
      user: config.smtp.user,
      pass: config.smtp.pass,
    },
  })

  try {
    const info = await transporter.sendMail({
      from: config.smtp.from,
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
