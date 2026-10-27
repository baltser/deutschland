import { z } from 'zod'
import { logger } from '#server/utils/logger'
import { normalizeAndValidatePhone } from '#server/utils/phone'
import { prisma } from '#server/utils/prisma'
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
  const log = logger.withTag('admin:users:create')

  // Проверяем сессию администратора[cite: 13]
  const session = await requireUserSession(event)
  if (session.user.role_name !== 'admin') {
    throw createError({
      statusCode: 403,
      message: 'У вас нет прав для выполнения этой операции',
    })
  }

  const body = await readBody(event)
  const parseResult = createStaffSchema.safeParse(body)

  if (!parseResult.success) {
    throw createError({
      statusCode: 400,
      message: parseResult.error.issues[0]?.message || 'Неверный формат данных'
    })
  }

  const phone = normalizeAndValidatePhone(parseResult.data.phone)
  const userName = parseResult.data.user_name?.trim() || 'Сотрудник'
  const roleName = parseResult.data.role_name as UserRole

  // 1. Проверяем, существует ли уже пользователь с таким телефоном[cite: 13]
  const existingUser = await prisma.users.findUnique({
    where: { phone }
  })

  if (existingUser) {
    throw createError({
      statusCode: 409,
      message: 'Пользователь с таким номером телефона уже зарегистрирован в системе'
    })
  }

  // 2. Создаем сотрудника напрямую с ролью из enum[cite: 13]
  const newUser = await prisma.users.create({
    data: {
      phone,
      user_name: userName,
      role_name: roleName,
      password: null,
      activated_at: null
    }
  })

  log.success(`Администратор #${session.user.user_id} создал сотрудника ${newUser.phone} (${roleName})`)

  return {
    success: true,
    user: {
      user_id: newUser.user_id,
      user_name: newUser.user_name,
      phone: newUser.phone,
      role_name: newUser.role_name
    }
  }
})
