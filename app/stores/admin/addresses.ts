// stores/admin/addresses.ts
import { defineStore } from 'pinia'
import type { AddressItem } from '~/types/address'
import type { ClientUser } from '~/types/user'
import type {
  AddressesListResponse,
  SingleAddressResponse,
  CreateAddressResponse,
  AddClientToAddressResponse,
  AddClientToAddressBody,
  ClientsListResponse
} from '~/types/admin'
import { getErrorMessage } from '~/types/error'

export const useAdminAddressesStore = defineStore('adminAddresses', () => {
  const { showSuccess, showError } = useToastNotifications()

  const addresses = ref<AddressItem[]>([])
  const currentAddress = ref<AddressItem | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 💡 Новые состояния для пагинированного списка жильцов конкретного адреса
  const addressClients = ref<ClientUser[]>([]) // Инициализируем пустым массивом, чтобы не было ошибок undefined в таблице!
  const addressClientsTotal = ref(0)
  const addressClientsPage = ref(1)
  const addressClientsLimit = ref(50)
  const addressClientsSearch = ref('')
  const addressClientsLoading = ref(false)

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

  // 💡 3.1. Загрузка жильцов конкретного адреса с пагинацией и поиском через общий эндпоинт клиентов
  async function fetchClientsForAddress(addressId: string | number, page = 1, search = '') {
    addressClientsLoading.value = true
    addressClientsPage.value = page
    addressClientsSearch.value = search

    try {
      const data = await $fetch<ClientsListResponse>('/api/admin/clients', {
        query: {
          addressId: addressId,
          page: page,
          limit: addressClientsLimit.value,
          search: search.trim() || undefined
        }
      })
      addressClients.value = data.clients || []
      addressClientsTotal.value = data.pagination?.total || 0
    } catch (err: unknown) {
      showError('Ошибка', getErrorMessage(err, 'Не удалось загрузить список жильцов'))
    } finally {
      addressClientsLoading.value = false
    }
  }

  async function setClientsLimit(addressId: string | number, newLimit: number) {
    addressClientsLimit.value = newLimit
    await fetchClientsForAddress(addressId, 1, addressClientsSearch.value)
  }

  // 4. Привязать клиента к адресу
  async function addClientToAddress(addressId: string | number, payload: AddClientToAddressBody) {
    try {
      await $fetch<AddClientToAddressResponse>(`/api/admin/addresses/${addressId}/clients`, {
        method: 'POST',
        body: payload
      })

      showSuccess('Успешно', 'Клиент успешно привязан к объекту')

      // Перезагружаем первую страницу жильцов текущего адреса с сохранением текущего поиска
      await fetchClientsForAddress(addressId, 1, addressClientsSearch.value)
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

      // Обновляем список жильцов с первой страницы
      await fetchClientsForAddress(addressId, 1, '')
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
    addressClients,
    addressClientsTotal,
    addressClientsPage,
    addressClientsLimit,
    addressClientsLoading,
    fetchAddresses,
    setClientsLimit,
    createAddress,
    fetchAddressById,
    fetchClientsForAddress,
    addClientToAddress,
    importClients
  }
})
