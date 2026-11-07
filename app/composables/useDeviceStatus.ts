export interface DevicePingResponse {
  status?: number
  data?: string
  success?: boolean
  error?: string
}

export function useDeviceStatus() {
  const deviceStatuses = ref<Record<number, boolean>>({})
  const isChecking = ref(false)

  // Функция проверки конкретного устройства с точной типизацией ответа
  const checkDeviceOnline = async (deviceId: number): Promise<boolean> => {
    try {
      const response = await $fetch<DevicePingResponse>(`/api/devices/${deviceId}/ping`)
      return response?.status === 200 && (response?.data?.includes('Status=0') || response?.success === true)
    } catch {
      return false
    }
  }

  // Массовая проверка списка устройств
  const checkDevices = async (devices: Array<{ device_id: number }>) => {
    if (!devices || devices.length === 0) return
    isChecking.value = true

    const checks = devices.map(async (device) => {
      deviceStatuses.value[device.device_id] = await checkDeviceOnline(device.device_id)
    })

    await Promise.all(checks)
    isChecking.value = false
  }

  return {
    deviceStatuses,
    isChecking,
    checkDeviceOnline,
    checkDevices
  }
}
