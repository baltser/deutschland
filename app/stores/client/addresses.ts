import { defineStore } from 'pinia'
import type { AddressItem } from '~/types/address'

interface ClientAddressesResponse {
  success: boolean
  addresses: AddressItem[]
}

export const useClientAddressesStore = defineStore('client-addresses', () => {
  // Запрашиваем адреса и оборудование текущего клиента через useLazyFetch или useFetch
  const { data: responseData, pending, error, refresh: fetchAddresses } = useFetch<ClientAddressesResponse>('/api/client/addresses')

  const addresses = computed(() => responseData.value?.addresses || [])

  return {
    addresses,
    pending,
    error,
    fetchAddresses
  }
})
