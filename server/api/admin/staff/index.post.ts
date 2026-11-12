import { z } from 'zod'
import { staffManagementService } from '#server/services/admin/staff-management.service'
import type { UserRole } from '@prisma/client'
import type { CreateStaffResponse } from '#server/types/admin'

const createStaffSchema = z.object({
  phone: z.string().min(10, 'Введите корректный номер телефона'),
  user_name: z.string().optional(),
  role_name: z.enum(['admin', 'installer'], {
    message: 'Роль должна быть либо admin, либо installer'
  })
})

export default defineEventHandler(async (event): Promise<CreateStaffResponse> => {
  const currentUser = event.context.user
  const body = await readBody(event)
  const parseResult = createStaffSchema.safeParse(body)

  if (!parseResult.success) {
    throw createError({
      statusCode: 400,
      message: parseResult.error.issues[0]?.message || 'Неверный формат данных'
    })
  }

  const { phone, user_name, role_name } = parseResult.data

  const resultUser = await staffManagementService.createOrPromoteStaff(
    currentUser.user_id,
    phone,
    role_name as UserRole,
    user_name
  )

  return {
    success: true,
    user: resultUser
  }
})
