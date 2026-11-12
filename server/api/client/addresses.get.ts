import { addressService } from '#server/services/client/address.service'
import type { ClientAddressesResponse } from '#server/types/client'

export default defineEventHandler(async (event): Promise<ClientAddressesResponse> => {
  const user = event.context.user
  const addresses = await addressService.getClientAddresses(user.user_id)

  return {
    success: true,
    addresses,
  }
})
