import { defineStore } from 'pinia'
import { getErrorMessage } from '~/types/error'

export interface DeviceItem {
  device_id: number
  device_name: string
  device_type: 'CAMERA' | 'PANEL'
  ip?: string | null
  port?: number | null
  login?: string | null
  password?: string | null
}

export const useAdminDevicesStore = defineStore('adminDevices', () => {
  const { showSuccess, showError } = useToastNotifications()

  const loading = ref(false)
  const actionLoadingId = ref<number | null>(null) // Для лоадера конкретного устройства при удалении/обновлении

  // 1. Создание устройства для адреса
  async function createDevice(addressId: string | number, payload: {
    device_name: string
    device_type: 'CAMERA' | 'PANEL'
    ip?: string | null
    port?: number | null
    login?: string | null
    password?: string | null
  }) {
    loading.value = true
    try {
      await $fetch(`/api/admin/addresses/${addressId}/devices`, {
        method: 'POST',
        body: payload
      })

      showSuccess('Успешно', 'Устройство добавлено к объекту')
      return true
    } catch (err: unknown) {
      showError('Ошибка', getErrorMessage(err, 'Не удалось добавить устройство'))
      return false
    } finally {
      loading.value = false
    }
  }

  // 2. Частичное обновление устройства (PATCH)
  async function updateDevice(deviceId: number, payload: {
    device_name?: string
    device_type?: 'CAMERA' | 'PANEL'
    ip?: string | null
    port?: number | null
    login?: string | null
    password?: string | null
  }) {
    actionLoadingId.value = deviceId
    try {
      await $fetch(`/api/admin/addresses/devices/${deviceId}`, {
        method: 'PATCH',
        body: payload
      })

      showSuccess('Успешно', 'Устройство обновлено')
      return true
    } catch (err: unknown) {
      showError('Ошибка', getErrorMessage(err, 'Не удалось обновить устройство'))
      return false
    } finally {
      actionLoadingId.value = null
    }
  }

  // 3. Удаление устройства
  async function deleteDevice(deviceId: number) {
    actionLoadingId.value = deviceId
    try {
      await $fetch(`/api/admin/addresses/devices/${deviceId}`, {
        method: 'DELETE'
      })

      showSuccess('Успешно', 'Устройство удалено')
      return true
    } catch (err: unknown) {
      showError('Ошибка', getErrorMessage(err, 'Не удалось удалить устройство'))
      return false
    } finally {
      actionLoadingId.value = null
    }
  }

  return {
    loading,
    actionLoadingId,
    createDevice,
    updateDevice,
    deleteDevice
  }
})
