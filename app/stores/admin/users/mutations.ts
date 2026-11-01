import { defineStore } from 'pinia'
import { getErrorMessage } from '~/types/error'
import { useAdminClientsStore } from './clients'
import { useAdminStaffStore } from './staff'
import type { StaffUser, ClientUser } from '~/types/user'

export const useAdminUserMutationsStore = defineStore('admin-user-mutations', () => {
  const toast = useToast()
  const clientsStore = useAdminClientsStore()
  const staffStore = useAdminStaffStore()

  // Принимаем payload, включая опциональный файл аватара
  async function updateUser(
    userId: number,
    payload: { user_name?: string; role_name?: string; avatarFile?: File | null }
  ) {
    try {
      let updatedUserObj: Partial<StaffUser & ClientUser> | null = null

      // 1. Если переданы текстовые поля (имя, роль), отправляем их через PATCH
      if (payload.user_name !== undefined || payload.role_name !== undefined) {
        const response = await $fetch<{ success: boolean; user: StaffUser & ClientUser }>(`/api/admin/users/${userId}`, {
          method: 'PATCH',
          body: {
            user_name: payload.user_name,
            role_name: payload.role_name
          }
        })
        updatedUserObj = response.user
      }

      // 2. Если передан файл аватара, отправляем его на эндпоинт
      if (payload.avatarFile) {
        const formData = new FormData()
        formData.append('avatar', payload.avatarFile)

        const avatarResponse = await $fetch<{ success: boolean; avatarUrl?: string }>(`/api/profile/${userId}/avatar`, {
          method: 'POST',
          body: formData
        })

        // Подтягиваем свежий путь к аватару
        if (avatarResponse.success && avatarResponse.avatarUrl) {
          if (!updatedUserObj) {
            updatedUserObj = {}
          }
          // Очищаем префикс, чтобы в объекте хранился чистый относительный путь бакета
          const cleanPath = avatarResponse.avatarUrl.replace(/^\/api\/files\//, '')
          updatedUserObj.avatar_path = cleanPath
        }
      }

      toast.add({
        title: 'Успешно',
        description: 'Данные пользователя обновлены',
        color: 'success',
      })

      // 3. Локально обновляем данные в списке клиентов, чтобы таблица сразу показала изменения без перезагрузки
      const clientIndex = clientsStore.list.findIndex(c => c.user_id === userId)
      if (clientIndex !== -1 && updatedUserObj) {
        clientsStore.list[clientIndex] = {
          ...clientsStore.list[clientIndex],
          ...updatedUserObj,
        } as ClientUser
      }

      // 4. Обновляем список персонала
      await staffStore.refreshStaff()

      return true
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err, 'Не удалось обновить данные пользователя')
      toast.add({
        title: 'Ошибка',
        description: errorMsg,
        color: 'error',
      })
      return false
    }
  }

  return {
    updateUser
  }
})
