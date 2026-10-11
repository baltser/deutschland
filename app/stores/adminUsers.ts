import { defineStore } from 'pinia'

export interface UserItem {
  id: string
  name: string
  email: string
  ruleName: string
  avatar: string | null
  createdAt?: string
}

export const useAdminUsersStore = defineStore('adminUsers', () => {
  const toast = useToast()

  const users = ref<UserItem[]>([])
  const loading = ref(false)
  const error = ref<unknown>(null)

  const isModalOpen = ref(false)
  const selectedUser = ref<UserItem | null>(null)
  const selectedRole = ref<string>('user')
  const isSaving = ref(false)

  async function fetchUsers() {
    loading.value = true
    try {
      users.value = await $fetch<UserItem[]>('/api/admin/users')
      error.value = null
    } catch (err: unknown) {
      error.value = err
    } finally {
      loading.value = false
    }
  }

  function openEditModal(user: UserItem) {
    selectedUser.value = { ...user }
    selectedRole.value = user.ruleName
    isModalOpen.value = true
  }

  function updateUserAvatar(newAvatarPath: string) {
    if (selectedUser.value) {
      selectedUser.value.avatar = newAvatarPath
    }
  }

  async function saveRole() {
    if (!selectedUser.value) return

    isSaving.value = true
    try {
      await $fetch(`/api/admin/users/${selectedUser.value.id}`, {
        method: 'PATCH',
        body: {
          ruleName: selectedRole.value,
          avatar: selectedUser.value.avatar
        },
      })

      toast.add({
        title: 'Успешно',
        description: `Данные пользователя ${selectedUser.value.name} обновлены`,
        color: 'success',
      })

      isModalOpen.value = false
      await fetchUsers()
    } catch (err: unknown) {
      const fetchError = err as { data?: { statusMessage?: string } }
      toast.add({
        title: 'Ошибка',
        description: fetchError.data?.statusMessage || 'Не удалось обновить данные',
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
