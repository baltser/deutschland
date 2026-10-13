import nodemailer from 'nodemailer'
import { logger } from '#server/utils/logger'

export async function sendVerificationEmail(toEmail: string, token: string) {
  const config = useRuntimeConfig()
  const log = logger.withTag('mail')

  const appUrl = config.public.appUrl || 'http://localhost:3000'
  const verificationLink = `${appUrl}/api/auth/verify?token=${token}`

  const transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    auth: {
      user: config.smtp.user,
      pass: config.smtp.pass,
    },
  })

  const mailOptions = {
    from: config.smtp.from,
    to: toEmail,
    subject: 'Подтверждение регистрации',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #333;">Добро пожаловать!</h2>
        <p style="color: #555; font-size: 16px; line-height: 1.5;">
          Спасибо за регистрацию. Для завершения создания аккаунта и подтверждения вашей электронной почты, пожалуйста, нажмите на кнопку ниже:
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationLink}"
             style="background-color: #00dc82; color: #ffffff; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 6px; display: inline-block;">
            Подтвердить Email
          </a>
        </div>
        <p style="color: #888; font-size: 12px; line-height: 1.4;">
          Ссылка действительна в течение 24 часов.<br>
          Если кнопка выше не работает, скопируйте и вставьте следующую ссылку в браузер:<br>
          <a href="${verificationLink}" style="color: #00dc82;">${verificationLink}</a>
        </p>
      </div>
    `
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    log.success(`Письмо подтверждения успешно отправлено на ${toEmail} (ID: ${info.messageId})`)
    return info
  } catch (err: unknown) {
    log.error(`Ошибка при отправке письма на ${toEmail}:`, { cause: err })
    throw err
  }
}
