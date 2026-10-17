import { defineStore } from 'pinia'

export interface ClientItem {
  user_id: number
  user_name: string
  email?: string | null
  phone: string
  avatar_path?: string | null
  activated_at?: string | null
  addresses: Array<{
    address_id: number
    address?: {
      address_id: number
      address_name: string
    }
  }>
}

export const useAdminClientsStore = defineStore('adminClients', () => {
  const toast = useToast()

  const clients = ref<ClientItem[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Загрузка клиентов с эндпоинта /api/admin/clients
  async function fetchClients() {
    loading.value = true
    error.value = null
    try {
      const data = await $fetch<{ success: boolean; clients: ClientItem[] }>('/api/admin/clients')
      clients.value = data.clients || []
    } catch (err: unknown) {
      const fetchErr = err as { data?: { message?: string } }
      error.value = fetchErr?.data?.message || 'Ошибка загрузки клиентов'
      toast.add({
        title: 'Ошибка',
        description: error.value ?? undefined,
        color: 'error',
      })
    } finally {
      loading.value = false
    }
  }

  return {
    clients,
    loading,
    error,
    fetchClients,
  }
})
