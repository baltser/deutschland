import { defineStore } from 'pinia'

export interface UserItem {
  user_id: number
  user_name: string
  email: string
  phone?: string | null
  role_name: string
  avatar_path?: string | null
  is_active: boolean
}

// Интерфейс для типизации ошибок от fetch-запросов
interface ApiError {
  data?: {
    message?: string
    statusMessage?: string
  }
  message?: string
}

export const useAdminUsersStore = defineStore('adminUsers', () => {
  const toast = useToast()

  const users = ref<UserItem[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isModalOpen = ref(false)
  const selectedUser = ref<UserItem | null>(null)
  const selectedRole = ref<string>('user')
  const isSaving = ref(false)

  async function fetchUsers() {
    loading.value = true
    error.value = null
    try {
      const data = await $fetch<{ success: boolean; users: UserItem[] }>('/api/admin/users')
      users.value = data.users
    } catch (err: unknown) {
      const apiErr = err as ApiError
      error.value = apiErr?.data?.message || apiErr?.message || 'Ошибка загрузки пользователей'
    } finally {
      loading.value = false
    }
  }

  function openEditModal(user: UserItem) {
    selectedUser.value = { ...user }
    selectedRole.value = user.role_name
    isModalOpen.value = true
  }

  function updateUserAvatar(newAvatarPath: string) {
    if (selectedUser.value) {
      selectedUser.value.avatar_path = newAvatarPath
    }
  }

  async function saveRole() {
    if (!selectedUser.value) return

    isSaving.value = true
    try {
      await $fetch(`/api/admin/users/${selectedUser.value.user_id}`, {
        method: 'PATCH',
        body: {
          role_name: selectedRole.value,
          avatar_path: selectedUser.value.avatar_path
        },
      })

      toast.add({
        title: 'Успешно',
        description: `Данные пользователя ${selectedUser.value.user_name} обновлены`,
        color: 'success',
      })

      isModalOpen.value = false
      await fetchUsers()
    } catch (err: unknown) {
      const apiErr = err as ApiError
      toast.add({
        title: 'Ошибка',
        description: apiErr?.data?.message || apiErr?.message || 'Не удалось обновить данные',
        color: 'error',
      })
    } finally {
      isSaving.value = false
    }
  }

  return {
    users,
    loading,
    error,
    isModalOpen,
    selectedUser,
    selectedRole,
    isSaving,
    fetchUsers,
    openEditModal,
    updateUserAvatar,
    saveRole
  }
})
