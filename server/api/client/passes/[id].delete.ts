import { passRevokeService } from '#server/services/passes/pass-revoke.service'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  const rawId = getRouterParam(event, 'id')

  if (!rawId) {
    throw createError({ statusCode: 400, message: 'Некорректный ID пропуска' })
  }

  return await passRevokeService.revokePass(
    rawId,
    user.user_id,
    user.role_name === 'admin'
  )
})
