import { defineStore } from 'pinia'
import type { AddressItem } from '~/types/address'
import type {
  AddressesListResponse,
  SingleAddressResponse,
  CreateAddressResponse,
  AddClientToAddressResponse,
  AddClientToAddressBody
} from '~/types/admin'
import { getErrorMessage } from '~/types/error'

export const useAdminAddressesStore = defineStore('adminAddresses', () => {
  const toast = useToast()

  const addresses = ref<AddressItem[]>([])
  const currentAddress = ref<AddressItem | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 1. Загрузка списка адресов
  async function fetchAddresses() {
    loading.value = true
    error.value = null
    try {
      // 💡 Используем AddressesListResponse
      const data = await $fetch<AddressesListResponse>('/api/admin/addresses')
      addresses.value = data.addresses || []
    } catch (err: unknown) {
      error.value = getErrorMessage(err, 'Ошибка загрузки адресов')
    } finally {
      loading.value = false
    }
  }

  // 2. Создание нового адреса
  async function createAddress(addressText: string) {
    try {
      // 💡 Типизируем тело запроса и ответ
      await $fetch<CreateAddressResponse>('/api/admin/addresses', {
        method: 'POST',
        body: { address_name: addressText.trim() } // Соответствует CreateAddressBody
      })

      toast.add({
        title: 'Успешно',
        description: 'Адрес успешно добавлен в систему',
        color: 'success'
      })

      await fetchAddresses()
      return true
    } catch (err: unknown) {
      toast.add({
        title: 'Ошибка',
        description: getErrorMessage(err, 'Не удалось добавить адрес'),
        color: 'error'
      })
      return false
    }
  }

  // 3. Загрузить детальную информацию по конкретному адресу
  async function fetchAddressById(id: string | number) {
    loading.value = true
    error.value = null
    try {
      const data = await $fetch<SingleAddressResponse>(`/api/admin/addresses/${id}`)
      currentAddress.value = data.address
    } catch (err: unknown) {
      error.value = getErrorMessage(err, 'Не удалось загрузить детали адреса')
      currentAddress.value = null
    } finally {
      loading.value = false
    }
  }

  // 4. Привязать клиента к адресу
  async function addClientToAddress(addressId: string | number, payload: AddClientToAddressBody) {
    try {
      await $fetch<AddClientToAddressResponse>(`/api/admin/addresses/${addressId}/clients`, {
        method: 'POST',
        body: payload
      })

      toast.add({
        title: 'Успешно',
        description: 'Клиент успешно привязан к объекту',
        color: 'success'
      })

      await fetchAddressById(addressId)
    } catch (err: unknown) {
      toast.add({
        title: 'Ошибка',
        description: getErrorMessage(err, 'Не удалось привязать клиента'),
        color: 'error'
      })
      throw err
    }
  }

  return {
    addresses,
    loading,
    error,
    currentAddress,
    fetchAddresses,
    createAddress,
    fetchAddressById,
    addClientToAddress,
  }
})
