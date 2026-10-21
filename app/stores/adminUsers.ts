import { defineStore } from 'pinia'

export interface AdminUserItem {
  user_id: number
  user_name: string
  email?: string
  phone: string
  role_id?: number
  role_name: string
  email_verified_at?: string | Date | null
  avatar_path?: string | null
  activated_at?: string | null
  [key: string]: unknown
}

interface ApiError {
  data?: { message?: string }
  message?: string
}

export const useAdminUsersStore = defineStore('adminUsers', () => {
  const toast = useToast()

  const users = ref<AdminUserItem[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 1. Загрузка списка пользователей
  async function fetchUsers() {
    loading.value = true
    error.value = null
    try {
      const data = await $fetch<{ success: boolean; users: AdminUserItem[] }>('/api/admin/users')
      users.value = data.users || []
    } catch (err: unknown) {
      const apiErr = err as ApiError
      error.value = apiErr?.data?.message || apiErr?.message || 'Ошибка загрузки пользователей'
      toast.add({
        title: 'Ошибка',
        description: error.value,
        color: 'error',
      })
    } finally {
      loading.value = false
    }
  }

  // 2. Обновление пользователя (частичные данные через Partial)
  async function updateUser(userId: number, payload: Partial<AdminUserItem>) {
    try {
      const response = await $fetch<{ success: boolean; user: AdminUserItem }>(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        body: payload,
      })

      toast.add({
        title: 'Успешно',
        description: 'Данные пользователя обновлены',
        color: 'success',
      })

      // Мгновенно обновляем конкретного пользователя в локальном массиве без лишнего запроса
      const index = users.value.findIndex(u => u.user_id === userId)
      if (index !== -1 && response.user) {
        users.value[index] = { ...users.value[index], ...response.user }
      } else {
        // Запасной вариант, если элемент не нашелся в массиве
        await fetchUsers()
      }

      return true
    } catch (err: unknown) {
      const apiErr = err as ApiError
      const errorMsg = apiErr?.data?.message || apiErr?.message || 'Не удалось обновить данные'

      toast.add({
        title: 'Ошибка',
        description: errorMsg,
        color: 'error',
      })
      return false
    }
  }

  return {
    users,
    loading,
    error,
    fetchUsers,
    updateUser,
  }
})
