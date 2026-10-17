import { z } from 'zod'
import { logger } from '#server/utils/logger'
import { normalizeAndValidatePhone } from '#server/utils/phone'

const createStaffSchema = z.object({
  phone: z.string().min(10, 'Введите корректный номер телефона'),
  user_name: z.string().optional(),
  role_name: z.enum(['admin', 'installer'], {
    message: 'Роль должна быть либо admin, либо installer'
  })
})

export default defineEventHandler(async (event) => {
  const log = logger.withTag('admin:users:create')

  // Проверяем сессию администратора
  const session = await requireUserSession(event)

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
  const { role_name } = parseResult.data

  // 1. Проверяем, существует ли уже пользователь с таким телефоном
  const existingUser = await prisma.users.findUnique({
    where: { phone }
  })

  if (existingUser) {
    throw createError({
      statusCode: 409,
      message: 'Пользователь с таким номером телефона уже зарегистрирован в системе'
    })
  }

  // 2. Находим роль в базе данных
  const role = await prisma.roles.findUnique({
    where: { role_name }
  })

  if (!role) {
    throw createError({
      statusCode: 500,
      message: `Роль "${role_name}" не найдена в системе`
    })
  }

  // 3. Создаем предзаписанного сотрудника (без пароля, activated_at = null)
  const newUser = await prisma.users.create({
    data: {
      phone,
      user_name: userName,
      role_id: role.role_id,
      password: null,
      activated_at: null
    },
    include: {
      role: {
        select: { role_name: true }
      }
    }
  })

  log.success(`Администратор #${session.user.user_id} создал сотрудника ${newUser.phone} (${role_name})`)

  return {
    success: true,
    user: {
      user_id: newUser.user_id,
      user_name: newUser.user_name,
      phone: newUser.phone,
      role_name: newUser.role.role_name
    }
  }
})
