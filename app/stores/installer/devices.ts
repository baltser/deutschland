import { defineStore } from 'pinia'
import type { InstallerDevicesResponse } from '~/types/device'

export const useInstallerDevicesStore = defineStore('installer-devices', () => {
  // Используем useNuxtData для сохранения состояния между переходами или дефолтные значения
  const { data, pending, error, refresh: fetchDevices } = useLazyFetch<InstallerDevicesResponse>('/api/installer/devices', {
    server: true
  })

  // Сырые данные из ответа бэкенда
  const rawAddresses = computed(() => data.value?.addresses || [])



  return {
    data,
    pending,
    error,
    rawAddresses,
    fetchDevices
  }
})
