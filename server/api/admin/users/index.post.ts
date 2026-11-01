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

  // Проверяем сессию администратора
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
  const userName = parseResult.data.user_name?.trim() || undefined
  const roleName = parseResult.data.role_name as UserRole

  // 1. Проверяем, существует ли уже пользователь с таким телефоном
  const existingUser = await prisma.users.findUnique({
    where: { phone }
  })

  if (existingUser) {
    // Если пользователь уже зарегистрирован как сотрудник (admin, installer, manager) — ошибка
    if (['admin', 'installer', 'manager'].includes(existingUser.role_name)) {
      throw createError({
        statusCode: 409,
        message: 'Сотрудник с таким номером телефона уже зарегистрирован в системе'
      })
    }

    // Если пользователь существует, но он клиент (или другая не-staff роль),
    // «повышаем» его до сотрудника и при необходимости обновляем имя
    const updatedUser = await prisma.users.update({
      where: { user_id: existingUser.user_id },
      data: {
        role_name: roleName,
        ...(userName ? { user_name: userName } : {})
      }
    })

    log.success(`Администратор #${session.user.user_id} назначил существующего клиента ${updatedUser.phone} сотрудником (${roleName})`)

    return {
      success: true,
      user: {
        user_id: updatedUser.user_id,
        user_name: updatedUser.user_name,
        phone: updatedUser.phone,
        role_name: updatedUser.role_name
      }
    }
  }

  // 2. Если пользователя вообще не было — создаем нового сотрудника с нуля
  const newUser = await prisma.users.create({
    data: {
      phone,
      user_name: userName || 'Сотрудник',
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
