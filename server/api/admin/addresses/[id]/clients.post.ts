import { z } from 'zod'
import { normalizeAndValidatePhone } from '#server/utils/phone'

const addClientSchema = z.object({
  phone: z.string().min(10, 'Введите корректный номер телефона'),
  user_name: z.string().optional()
})

export default defineEventHandler(async (event) => {

  const id = getRouterParam(event, 'id')
  const addressId = Number(id)

  if (isNaN(addressId)) {
    throw createError({ statusCode: 400, message: 'Некорректный ID адреса' })
  }

    const body = await readBody(event)
    const parseResult = addClientSchema.safeParse(body)

    if (!parseResult.success) {
      throw createError({
        statusCode: 400,
        message: parseResult.error.issues[0]?.message || 'Неверные данные'
      })
    }

    const phone = normalizeAndValidatePhone(parseResult.data.phone)
    const userName = parseResult.data.user_name?.trim() || 'Клиент'

    // Находим роль 'client' в базе
    const clientRole = await prisma.roles.findUnique({
      where: { role_name: 'client' }
    })

    if (!clientRole) {
      throw createError({ statusCode: 500, message: 'Роль client не найдена в базе данных' })
    }

    // Ищем пользователя по телефону
    let user = await prisma.users.findUnique({
      where: { phone }
    })

    // Если пользователь не найден — создаем нового клиента без пароля (вход по телефону)
    if (!user) {
      user = await prisma.users.create({
        data: {
          phone,
          user_name: userName,
          password: null,
          role_id: clientRole.role_id,
          activated_at: null
        }
      })
    }

    // Привязываем пользователя к адресу (если еще не привязан)
    try {
      await prisma.clients_x_addresses.create({
        data: {
          user_id: user.user_id,
          address_id: addressId
        }
      })
    } catch (e: unknown) {
      // P2002 — ошибка уникальности, значит он уже привязан к этому адресу
      const err = e as { code?: string }
      if (err.code !== 'P2002') {
        throw e
      }
    }

    return { success: true, user }


})
