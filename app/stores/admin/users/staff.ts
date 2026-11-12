import { defineStore } from 'pinia'
import type { StaffListResponse } from '~/types/admin'
import { getErrorMessage } from '~/types/error'

export const useAdminStaffStore = defineStore('admin-staff', () => {

  const { showSuccess, showError } = useToastNotifications()

  const {
    data: staffResponse,
    pending: staffPending,
    error: staffError,
    refresh: refreshStaff
  } = useLazyFetch<StaffListResponse>('/api/admin/staff')

  const staffList = computed(() => staffResponse.value?.users || [])

  async function createStaff(payload: { phone: string; user_name: string; role_name: 'admin' | 'installer' }) {
    try {
      await $fetch('/api/admin/staff', {
        method: 'POST',
        body: payload
      })

      showSuccess('Успешно', 'Сотрудник успешно добавлен в систему')

      await refreshStaff()
      return true
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err, 'Не удалось создать сотрудника')
      showError('Ошибка', errorMsg)
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
