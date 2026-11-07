import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useToastNotifications } from '~/composables/useToast'

export interface GroupedNumberRecord {
  id: number | string
  deviceId: number
  status?: 'success' | 'error'
  errorMessage?: string
  createdAt?: number | string
  recordId?: number | string
}

export interface GroupedNumberItem {
  carNumber: string
  comment?: string | null
  tag?: string
  expiresAt: string
  expiresIn?: string
  expiresAtTime?: string
  records: GroupedNumberRecord[]
  createdAt?: number | string
  recordId?: number | string
}

interface DeviceResult {
  status: 'success' | 'error'
  message?: string
  deviceId?: number
}

interface BatchResponse {
  deviceResults?: DeviceResult[]
}

export const useClientNumbersStore = defineStore('clientNumbers', () => {
  const { showSuccess, showError, showWarning } = useToastNotifications()

  const rawActiveNumbers = ref<GroupedNumberItem[]>([])
  const loading = ref(false)

  const now = ref(Date.now())
  let timerInterval: ReturnType<typeof setInterval> | null = null

  const startTimer = () => {
    if (!import.meta.client || timerInterval) return

    timerInterval = setInterval(() => {
      now.value = Date.now()
    }, 10000)
  }

  startTimer()

  const calculateTimeLeft = (expiresAt: string): string => {
    const diff = new Date(expiresAt).getTime() - now.value
    if (diff <= 0) return 'Удаление...'

    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(minutes / 60)
    if (hours > 0) {
      return `${hours} ч. ${minutes % 60} мин.`
    }
    return `${minutes} мин.`
  }

  const getNumbersForDevices = (deviceIds: number[]): GroupedNumberItem[] => {
    const deviceSet = new Set(deviceIds)

    const filtered = rawActiveNumbers.value
      .map((item) => {
        const isExpiredLongAgo = new Date(item.expiresAt).getTime() < (now.value - 45000)
        if (isExpiredLongAgo) return null

        const filteredRecords = item.records.filter(r => deviceSet.has(r.deviceId))
        if (filteredRecords.length === 0) return null

        return {
          ...item,
          tag: item.comment || 'Гость',
          expiresIn: calculateTimeLeft(item.expiresAt),
          expiresAtTime: new Date(item.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
          records: filteredRecords
        }
      })
      .filter(Boolean) as GroupedNumberItem[]

    return filtered.sort((a: GroupedNumberItem, b: GroupedNumberItem) => {
      const timeA = Number(a.createdAt || a.recordId || 0)
      const timeB = Number(b.createdAt || b.recordId || 0)
      return timeB - timeA
    })
  }

  const fetchActiveNumbers = async () => {
    loading.value = true
    try {
      const res = await $fetch<{ active?: GroupedNumberItem[] }>('/api/client/camera-anpr/numbers')
      rawActiveNumbers.value = res.active || []
    } catch (err: unknown) {
      console.error('Не удалось загрузить список номеров', err)
      rawActiveNumbers.value = []
    } finally {
      loading.value = false
    }
  }

  const createPass = async (data: {
    carNumber: string
    totalHours: number
    comment: string
    deviceIds: number[]
  }) => {
    loading.value = true
    try {
      const res = await $fetch<BatchResponse>('/api/client/camera-anpr/numbers-batch', {
        method: 'POST',
        body: data
      })

      const results = res?.deviceResults || []
      const failedDevices = results.filter((d: DeviceResult) => d.status === 'error')
      const successDevices = results.filter((d: DeviceResult) => d.status === 'success')
      const hasDuplicate = failedDevices.some((d: DeviceResult) => d.message?.includes('уже активен'))

      if (hasDuplicate && successDevices.length === 0) {
        showError('Дубликат', `Этот госномер уже активен на выбранных устройствах.`)
      } else if (failedDevices.length > 0) {
        showWarning(
          'Внимание',
          `Пропуск отправлен, но ${failedDevices.length} из выбранных устройств не ответили. Проверьте статус оборудования.`
        )
      } else {
        showSuccess('Доступ открыт', `Госномер ${data.carNumber} успешно активирован`)
      }

      await fetchActiveNumbers()
      return true
    } catch (err: unknown) {
      const error = err as { data?: { message?: string }; message?: string }
      showError('Ошибка', error.data?.message || 'Не удалось выписать пропуск')
      throw err
    } finally {
      loading.value = false
    }
  }

  const revokePass = async (recordIds: (number | string)[]) => {
    try {
      for (const id of recordIds) {
        await $fetch(`/api/client/camera-anpr/${id}/number`, {
          method: 'DELETE'
        })
      }

      showSuccess('Пропуск аннулирован', `Выбранные доступы успешно отозваны`)
      await fetchActiveNumbers()
      return true
    } catch (err: unknown) {
      const error = err as { data?: { message?: string }; message?: string }
      showError('Ошибка', error.data?.message || 'Не удалось отозвать пропуск')
      return false
    }
  }

  return {
    rawActiveNumbers,
    loading,
    fetchActiveNumbers,
    createPass,
    revokePass,
    getNumbersForDevices
  }
})
