import { defineStore } from 'pinia'
import type { StaffListResponse, ClientsListResponse } from '~/types/admin'

export const useAdminUsersStore = defineStore('admin-users', () => {
  // 1. Загрузка персонала (админы и монтажники)
  const {
    data: staffResponse,
    pending: staffPending,
    error: staffError,
    refresh: refreshStaff
  } = useLazyFetch<StaffListResponse>('/api/admin/staff')

  // 2. Загрузка клиентов
  const {
    data: clientsResponse,
    pending: clientsPending,
    error: clientsError,
    refresh: refreshClients
  } = useLazyFetch<ClientsListResponse>('/api/admin/clients')

  const staffList = computed(() => staffResponse.value?.users || [])
  const clientsList = computed(() => clientsResponse.value?.clients || [])

  const refreshAll = async () => {
    await Promise.all([refreshStaff(), refreshClients()])
  }

  // 3. Создание сотрудника
  const createStaff = async (payload: { phone: string; user_name?: string; role_name: 'admin' | 'installer' }) => {
    await $fetch('/api/admin/users', {
      method: 'POST',
      body: payload
    })
    await refreshStaff()
  }

  // 4. Обновление пользователя (имя, роль, аватар)
  const updateUser = async (userId: number, payload: { user_name: string; role_name: string; avatarFile?: File | null }) => {
    if (payload.avatarFile) {
      const formData = new FormData()
      formData.append('avatar', payload.avatarFile)

      await $fetch(`/api/profile/${userId}/avatar`, {
        method: 'POST',
        body: formData
      })
    }

    await $fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      body: {
        user_name: payload.user_name,
        role_name: payload.role_name
      }
    })

    await refreshAll()
  }

  return {
    staffList,
    staffPending,
    staffError,
    clientsList,
    clientsPending,
    clientsError,
    refreshStaff,
    refreshClients,
    refreshAll,
    createStaff,
    updateUser
  }
})
