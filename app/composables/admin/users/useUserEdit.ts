import { useAdminUsersStore } from '~/stores/adminUsers'

interface EditableUser {
  user_id: number
  user_name?: string | null
  phone: string
  email?: string | null
  avatar_path?: string | null
  role_name?: string
  [key: string]: unknown
}

interface ApiError {
  data?: {
    message?: string
  }
}

export function useUserEdit(onSuccess?: () => void) {
  const usersStore = useAdminUsersStore()
  const toast = useToast()

  const isEditModalOpen = ref(false)
  const selectedUser = ref<EditableUser | null>(null)
  const isSaving = ref(false)

  // Исправлено: используем EditableUser и правильное имя переменной состояния модалки
  function openEditModal(user: EditableUser | unknown) {
    selectedUser.value = user as EditableUser
    isEditModalOpen.value = true
  }

  // Принимаем payload из модалки
  async function handleSaveUser(payload: {
    user_name: string;
    role_name: string;
    avatar_path?: string | null;
    avatarFile?: File | null
  }) {
    if (!selectedUser.value) return

    isSaving.value = true
    try {
      let finalAvatarPath = payload.avatar_path

      // Если пользователь выбрал новый файл аватара в модалке, загружаем его
      if (payload.avatarFile) {
        const formData = new FormData()
        formData.append('avatar', payload.avatarFile)

        // Вызываем рабочий эндпоинт загрузки
        const uploadRes = await $fetch<{ success: boolean; avatarUrl: string }>(
          `/api/users/${selectedUser.value.user_id}/avatar`,
          {
            method: 'POST',
            body: formData
          }
        )

        // Сервер возвращает avatarUrl вида "/api/files/avatars/xxx.png"
        // Нам из него нужно забрать чистый путь для базы данных (без /api/files/)
        if (uploadRes.avatarUrl) {
          finalAvatarPath = uploadRes.avatarUrl.replace('/api/files/', '')
        }
      }

      // Сохраняем пользователя (имя, роль и чистый путь к аватару в avatar_path)
      const success = await usersStore.updateUser(selectedUser.value.user_id, {
        user_name: payload.user_name,
        role_name: payload.role_name,
        avatar_path: finalAvatarPath
      })

      if (success) {
        toast.add({ title: 'Успешно', description: 'Данные пользователя обновлены', color: 'success' })
        isEditModalOpen.value = false
        if (onSuccess) onSuccess()
      }
    } catch (err: unknown) {
      const apiErr = err as ApiError
      toast.add({ title: 'Ошибка', description: apiErr?.data?.message || 'Не удалось сохранить', color: 'error' })
    } finally {
      isSaving.value = false
    }
  }

  return {
    isEditModalOpen,
    selectedUser,
    isSaving,
    openEditModal,
    handleSaveUser
  }
}
