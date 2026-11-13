import { userManagementService } from '#server/services/admin/user-management.service'

export default defineEventHandler(async (event) => {

  const adminUserId = event.context.user?.user_id || 1
  const userId = Number(getRouterParam(event, 'id'))

  if (!userId || Number.isNaN(userId)) {
    throw createError({ statusCode: 400, message: 'Некорректный ID пользователя' })
  }

  return await userManagementService.deleteUser(adminUserId, userId)
})
