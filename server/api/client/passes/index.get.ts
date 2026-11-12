import { passQueryService } from '#server/services/passes/pass-query.service'

export default defineEventHandler(async () => {
  const active = await passQueryService.getActivePassesGrouped()
  return { active }
})
