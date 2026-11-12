import { staffManagementService } from '#server/services/admin/staff-management.service'
import type { UserRole } from '@prisma/client'
import type { AdminUserUpdateResponse, UpdateUserBody } from '#server/types/admin'

export default defineEventHandler(async (event): Promise<AdminUserUpdateResponse> => {
  const currentUser = event.context.user
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, message: 'Не указан ID пользователя' })
  }

  const userId = Number(id)
  const body = await readBody<UpdateUserBody>(event)

  const updateData: {
    user_name?: string
    role_name?: UserRole
    avatar_path?: string | null
  } = {}

  if (body.user_name !== undefined && body.user_name !== null) {
    updateData.user_name = String(body.user_name).trim()
  }

  if (body.role_name) {
    const normalizedRole = String(body.role_name).trim().toLowerCase()
    const validRoles: UserRole[] = ['admin', 'installer', 'manager', 'client']

    if (!validRoles.includes(normalizedRole as UserRole)) {
      throw createError({
        statusCode: 400,
        message: `Указанная роль "${body.role_name}" не найдена в системе`,
      })
    }

    updateData.role_name = normalizedRole as UserRole
  }

  if (body.avatar_path !== undefined) {
    updateData.avatar_path = body.avatar_path
  }

  const updatedUser = await staffManagementService.updateStaffUser(
    currentUser.user_id,
    userId,
    updateData
  )

  return {
    success: true,
    user: {
      user_id: updatedUser.user_id,
      user_name: updatedUser.user_name,
      email: updatedUser.email ?? null,
      phone: updatedUser.phone,
      role_name: updatedUser.role_name,
      avatar_path: updatedUser.avatar_path ?? null,
      activated_at: updatedUser.activated_at ?? null
    }
  }
})
