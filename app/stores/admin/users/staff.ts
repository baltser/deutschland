import { defineStore } from 'pinia'
import type { StaffListResponse } from '~/types/admin'
import { getErrorMessage } from '~/types/error'

export const useAdminStaffStore = defineStore('admin-staff', () => {
  const toast = useToast()

  const {
    data: staffResponse,
    pending: staffPending,
    error: staffError,
    refresh: refreshStaff
  } = useLazyFetch<StaffListResponse>('/api/admin/users/staff')

  const staffList = computed(() => staffResponse.value?.users || [])

  async function createStaff(payload: { phone: string; user_name: string; role_name: 'admin' | 'installer' }) {
    try {
      await $fetch('/api/admin/users', {
        method: 'POST',
        body: payload
      })

      toast.add({
        title: 'Успешно',
        description: 'Сотрудник успешно добавлен в систему',
        color: 'success',
      })

      await refreshStaff()
      return true
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err, 'Не удалось создать сотрудника')
      toast.add({
        title: 'Ошибка',
        description: errorMsg,
        color: 'error',
      })
      throw err
    }
  }

  return {
    staffList,
    staffPending,
    staffError,
    refreshStaff,
    createStaff
  }
})
