import { defineStore } from 'pinia'

export interface AddressItem {
  address_id: number
  address_name: string
  clients?: Array<{
    user_id: number
    address_id: number
    user?: {
      user_id: number
      user_name?: string | null
      phone: string
      email?: string | null
    }
  }>
  [key: string]: unknown
}

interface ApiError {
  data?: { message?: string }
  message?: string
}

export const useAdminAddressesStore = defineStore('adminAddresses', () => {
  const toast = useToast()

  const addresses = ref<AddressItem[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Загрузка списка адресов
  async function fetchAddresses() {
    loading.value = true
    error.value = null
    try {
      const data = await $fetch<{ success: boolean; addresses: AddressItem[] }>('/api/admin/addresses')
      addresses.value = data.addresses || []
    } catch (err: unknown) {
      const apiErr = err as ApiError
      error.value = apiErr?.data?.message || apiErr?.message || 'Ошибка загрузки адресов'
    } finally {
      loading.value = false
    }
  }

  // Создание нового адреса
  async function createAddress(addressText: string) {
    try {
      await $fetch('/api/admin/addresses', {
        method: 'POST',
        body: { address_name: addressText.trim() }
      })

      toast.add({
        title: 'Успешно',
        description: 'Адрес успешно добавлен в систему',
        color: 'success'
      })

      // Сразу обновляем список в сторе
      await fetchAddresses()
      return true
    } catch (err: unknown) {
      const apiErr = err as ApiError
      toast.add({
        title: 'Ошибка',
        description: apiErr?.data?.message || 'Не удалось добавить адрес',
        color: 'error'
      })
      return false
    }
  }

  return {
    addresses,
    loading,
    error,
    fetchAddresses,
    createAddress
  }
})
