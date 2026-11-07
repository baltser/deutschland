import { defineStore } from 'pinia'

export interface DeviceStatusInfo {
  status: 'expire' | 'error' | 'delete' | 'success' | string
  label: string
}

export interface HistoryLogItem {
  time: number
  createdAt?: number
  expiresAt?: number
  carNumber: string
  comment: string | null
  addressId?: number | null
  devicesStatus: Record<string, DeviceStatusInfo>
}

export interface HistoryStats {
  total: number
  expired: number
  deleted: number
}

export const useNumbersHistoryStore = defineStore('numbersHistory', () => {
  const rawLogs = ref<HistoryLogItem[]>([])
  const loading = ref(false)
  const selectedAddressId = ref<number | null>(null)

  // Загружаем чистую историю из клиентского лог-файла
  const fetchHistory = async (force = false) => {
    if (rawLogs.value.length > 0 && !force) return

    loading.value = true
    try {
      const data = await $fetch<{ logs: HistoryLogItem[] }>('/api/client/camera-anpr/numbers-history')
      rawLogs.value = data?.logs || []
    } catch (error) {
      console.error('Ошибка загрузки истории:', error)
    } finally {
      loading.value = false
    }
  }

  const setAddressFilter = (addressId: number) => {
    selectedAddressId.value = addressId
  }

  // Фильтрация логов по выбранному объекту
  const logs = computed(() => {
    if (!selectedAddressId.value) return rawLogs.value
    return rawLogs.value.filter(log => Number(log.addressId) === Number(selectedAddressId.value))
  })

  // Подсчет статистики на основе архива
  const stats = computed<HistoryStats>(() => {
    let expired = 0
    let deleted = 0
    const currentLogs = logs.value

    currentLogs.forEach(item => {
      const statuses = Object.values(item.devicesStatus).map(d => d.status)
      if (statuses.includes('delete')) {
        deleted++
      } else if (statuses.includes('expire')) {
        expired++
      }
    })

    return {
      total: currentLogs.length,
      expired,
      deleted
    }
  })

  const invalidateCache = () => {
    rawLogs.value = []
  }

  return {
    logs,
    stats,
    loading,
    selectedAddressId,
    fetchHistory,
    setAddressFilter,
    invalidateCache
  }
})
