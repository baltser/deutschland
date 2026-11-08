// stores/adminAddresses.ts
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
  // Подключаем наш стандартизированный композабл для уведомлений
  const { showSuccess, showError } = useToastNotifications()

  const addresses = ref<AddressItem[]>([])
  const currentAddress = ref<AddressItem | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 1. Загрузка списка адресов
  async function fetchAddresses() {
    loading.value = true
    error.value = null
    try {
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
      await $fetch<CreateAddressResponse>('/api/admin/addresses', {
        method: 'POST',
        body: { address_name: addressText.trim() }
      })

      showSuccess('Успешно', 'Адрес успешно добавлен в систему')

      await fetchAddresses()
      return true
    } catch (err: unknown) {
      showError('Ошибка', getErrorMessage(err, 'Не удалось добавить адрес'))
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

      showSuccess('Успешно', 'Клиент успешно привязан к объекту')

      await fetchAddressById(addressId)
    } catch (err: unknown) {
      showError('Ошибка', getErrorMessage(err, 'Не удалось привязать клиента'))
      throw err
    }
  }

  // 5. Массовый импорт клиентов к адресу
  async function importClients(addressId: string | number, clients: Array<{ name: string; phone: string }>) {
    loading.value = true
    try {
      const data = await $fetch<{ success: boolean; message: string; count: number }>(
        `/api/admin/addresses/${addressId}/import-clients`,
        {
          method: 'POST',
          body: { clients }
        }
      )

      showSuccess('Успешно', data.message || 'Клиенты успешно импортированы')

      // Обновляем информацию по текущему адресу, чтобы таблица на странице сразу обновилась
      await fetchAddressById(addressId)
      return true
    } catch (err: unknown) {
      showError('Ошибка импорта', getErrorMessage(err, 'Не удалось импортировать клиентов'))
      return false
    } finally {
      loading.value = false
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
    importClients
  }
})
