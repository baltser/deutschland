import { z } from 'zod'
import { addressManagementService } from '#server/services/admin/address-management.service'
import type { AddClientToAddressResponse } from '#server/types/admin'

const addClientSchema = z.object({
  phone: z.string().min(10, 'Введите корректный номер телефона'),
  user_name: z.string().optional()
})

export default defineEventHandler(async (event): Promise<AddClientToAddressResponse> => {
  const id = Number(getRouterParam(event, 'id'))
  if (isNaN(id)) {
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

  const user = await addressManagementService.addClientToAddress(
    id,
    parseResult.data.phone,
    parseResult.data.user_name
  )

  return { success: true, user }
})
