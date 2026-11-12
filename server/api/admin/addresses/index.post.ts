import { z } from 'zod'
import { addressManagementService } from '#server/services/admin/address-management.service'
import type { CreateAddressResponse } from '#server/types/admin'

const createAddressSchema = z.object({
  address_name: z.string().min(3, 'Адрес слишком короткий (минимум 3 символа)')
})

export default defineEventHandler(async (event): Promise<CreateAddressResponse> => {
  const user = event.context.user
  const body = await readValidatedBody(event, createAddressSchema.parse)

  const newAddress = await addressManagementService.createAddress(
    body.address_name,
    user.user_id
  )

  return {
    success: true,
    address: newAddress
  }
})
