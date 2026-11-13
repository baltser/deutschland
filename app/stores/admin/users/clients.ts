import { defineStore } from 'pinia'
import type { ClientsListResponse } from '~/types/admin'
import { getErrorMessage } from '~/types/error'
import type { ClientUser } from '~/types/user.ts'

export const useAdminClientsStore = defineStore('admin-clients', () => {
  const { showSuccess, showError } = useToastNotifications()

  const page = ref(1)
  const limit = ref(20)
  const search = ref('')
  const addressFilter = ref<string>('all')

  const list = ref<ClientUser[]>([])
  const total = ref(0)
  const totalPages = ref(1)
  const pending = ref(false)
  const error = ref<unknown>(null)

  const fetchClients = async () => {
    pending.value = true
    error.value = null
    try {
      const data = await $fetch<ClientsListResponse>('/api/admin/clients', {
        query: {
          page: page.value,
          limit: limit.value,
          search: search.value,
          addressId: addressFilter.value === 'all' ? undefined : addressFilter.value
        }
      })
      list.value = data.clients || []
      total.value = data.pagination?.total || 0
      totalPages.value = data.pagination?.totalPages || 1
    } catch (err: unknown) {
      error.value = getErrorMessage(err, 'Ошибка загрузки клиентов')
      console.error('Ошибка загрузки клиентов:', err)
    } finally {
      pending.value = false
    }
  }

  const setPage = async (newPage: number) => {
    page.value = newPage
    await fetchClients()
  }

  const setSearch = async (newSearch: string) => {
    search.value = newSearch
    page.value = 1
    await fetchClients()
  }

  const setAddressFilter = async (addressId: string) => {
    addressFilter.value = addressId
    page.value = 1
    await fetchClients()
  }

  // 💡 Удаление через общий роут пользователей
  const deleteClient = async (userId: number | string) => {
    try {
      await $fetch(`/api/admin/user/${userId}`, {
        method: 'DELETE'
      })

      showSuccess('Успешно', 'Клиент удален из системы')
      await fetchClients()
      return true
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err, 'Не удалось удалить клиента')
      showError('Ошибка', errorMsg)
      throw err
    }
  }

  if (import.meta.client) {
    void fetchClients()
  }

  return {
    list,
    pending,
    error,
    page,
    limit,
    search,
    addressFilter,
    total,
    totalPages,
    setPage,
    setSearch,
    setAddressFilter,
    fetchClients,
    refresh: fetchClients,
    deleteClient
  }
})
