import { addressManagementService } from '#server/services/admin/address-management.service'
import type { SingleAddressResponse } from '#server/types/admin'

export default defineEventHandler(async (event): Promise<SingleAddressResponse> => {
  const id = Number(event.context.params?.id)
  if (isNaN(id)) {
    throw createError({ statusCode: 400, message: 'Некорректный ID' })
  }

  const address = await addressManagementService.getAddressById(id)

  return {
    success: true,
    address,
  }
})
