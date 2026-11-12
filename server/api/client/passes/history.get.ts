import { passHistoryService } from '#server/services/passes/pass-history.service'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  const logs = await passHistoryService.getClientPassHistory(
    user.user_id,
    user.role_name === 'admin'
  )

  return {
    logs
  }
})
