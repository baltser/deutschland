import { z } from 'zod'
import { normalizeAndValidatePhone } from '#server/utils/phone'
import { prisma } from '#server/utils/prisma'
import type { AddClientToAddressResponse } from '#server/types/admin'

const addClientSchema = z.object({
  phone: z.string().min(10, 'Введите корректный номер телефона'),
  user_name: z.string().optional()
})

export default defineEventHandler(async (event): Promise<AddClientToAddressResponse> => {
  const session = await getUserSession(event)
  if (!session || !session.user || session.user.role_name !== 'admin') {
    throw createError({ statusCode: 403, message: 'Доступ запрещен' })
  }

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

  let user = await prisma.users.findUnique({
    where: { phone }
  })

  if (!user) {
    user = await prisma.users.create({
      data: {
        phone,
        user_name: userName,
        password: null,
        role_name: 'client',
        activated_at: null
      }
    })
  }

  try {
    await prisma.clients_x_addresses.create({
      data: {
        user_id: user.user_id,
        address_id: addressId
      }
    })
  } catch (e: unknown) {
    const err = e as { code?: string }
    if (err.code !== 'P2002') {
      throw e
    }
  }

  return { success: true, user }
})
