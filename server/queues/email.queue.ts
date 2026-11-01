import { Queue, Worker } from 'bullmq'
import { getBullMQConnection, registerQueue, registerWorker } from '~~/server/utils/bullmq'
import { logger } from '~~/server/utils/logger'
import { renderEmailTemplate, DEFAULT_VERIFICATION_TEMPLATE } from '#server/utils/emailTemplates'
import nodemailer from 'nodemailer'
import path from 'node:path'
import fs from 'node:fs'

const log = logger.withTag('queue:email')
const connection = getBullMQConnection()

export interface EmailJobData {
  toEmail: string
  token: string
  userName?: string
}

// 1. Создаем очередь писем с настройками автоповторов
export const emailQueue = new Queue<EmailJobData>('email-queue', {
  connection,
  defaultJobOptions: {
    attempts: 3, // Если отправка упала (например, упал почтовый сервер), повторить до 3 раз
    backoff: {
      type: 'exponential',
      delay: 5000, // Интервал между попытками
    },
    removeOnComplete: 100,
    removeOnFail: 200,
  }
})
registerQueue(emailQueue)

// 2. Создаем фоновый воркер, который берет задачи и отправляет письма
export const emailWorker = new Worker<EmailJobData>(
  'email-queue',
  async (job) => {
    const { toEmail, token, userName } = job.data
    log.info(`📤 [Worker] Начало отправки письма на ${toEmail} (Задача #${job.id})`)

    const config = useRuntimeConfig()
    const appUrl = config.public.appUrl || 'http://localhost:3000'
    const verificationLink = `${appUrl}/api/auth/mail/verify?token=${token}`

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

    // Путь к файлу логотипа в папке public
    let logoPath = path.resolve(process.cwd(), 'public/images/mail-logo.jpeg')
    if (!fs.existsSync(logoPath)) {
      logoPath = path.resolve(process.cwd(), '.output/public/images/mail-logo.jpeg')
    }

    // Читаем параметры SMTP
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.mail.ru',
      port: Number(process.env.SMTP_PORT) || 465,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    })

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Двор на замок" <motokawasaki@mail.ru>',
      to: toEmail,
      subject,
      html,
      attachments: [
        {
          filename: 'mail-logo.jpeg',
          path: logoPath,
          cid: 'logo@dnz',
          contentType: 'image/jpeg'
        }
      ]
    })

    log.success(`✅ [Worker] Письмо успешно отправлено на ${toEmail} (ID: ${info.messageId})`)
    return { messageId: info.messageId }
  },
  { connection }
)

emailWorker.on('failed', (job, err) => {
  log.error(`❌ [Worker] Ошибка отправки письма на ${job?.data?.toEmail} (Задача #${job?.id}):`, err)
})

registerWorker(emailWorker)
