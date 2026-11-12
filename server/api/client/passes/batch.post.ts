import { z } from 'zod'
import { passIssueService } from '#server/services/passes/pass-issue.service'

const batchBodySchema = z.object({
  carNumber: z.string().min(1, 'Госномер обязателен'),
  totalHours: z.number().positive('Количество часов должно быть больше 0'),
  comment: z.string().optional().nullable(),
  deviceIds: z.array(z.number()).min(1, 'Не выбраны устройства')
})

export default defineEventHandler(async (event) => {
  const user = event.context.user
  const body = await readValidatedBody(event, batchBodySchema.parse)

  return await passIssueService.issuePasses(user.user_id, body)
})
