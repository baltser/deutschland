import { logger } from '#server/utils/logger'
import { emailQueue } from '#server/queues/email.queue'

export async function sendVerificationEmail(toEmail: string, token: string, userName?: string) {
  const log = logger.withTag('mail:enqueue')

  try {
    // Ставим задачу в очередь BullMQ
    const job = await emailQueue.add('send-verification-email', {
      toEmail,
      token,
      userName
    })

    log.success(`📥 Письмо для ${toEmail} успешно добавлено в очередь BullMQ (ID задачи: ${job.id})`)
    return { success: true, jobId: job.id }
  } catch (err: unknown) {
    log.error(`❌ Ошибка при постановке письма в очередь для ${toEmail}:`, { cause: err })
    throw err
  }
}
