import { addressManagementService } from '#server/services/admin/address-management.service'
import type { AddressesListResponse } from '#server/types/admin'

export default defineEventHandler(async (): Promise<AddressesListResponse> => {
  const addresses = await addressManagementService.getAllAddresses()

  return {
    addresses
  }
})
