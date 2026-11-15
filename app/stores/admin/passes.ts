// stores/admin/passes.ts
import { defineStore } from 'pinia'
import { ref, reactive, computed } from 'vue'
import { useToastNotifications } from '~/composables/useToast'
import { useClientNumbersStore } from '~/stores/client/numbers'

interface DeviceStatusInfo {
  status: number | null
  vendor?: string
  error?: string
}

export const useAdminPassesStore = defineStore('adminPasses', () => {
  const { showError } = useToastNotifications()

  // Подключаем готовый клиентский стор ради его методов, таймеров и фильтрации
  const clientStore = useClientNumbersStore()

  // Специфичные для админки состояния мониторинга оборудования
  const deviceStatuses = reactive<Record<number, DeviceStatusInfo>>({})
  const checkingDevices = ref<boolean>(false)

  // 1. Получить все активные пропуски по всей системе (админский эндпоинт)
  const fetchActiveNumbers = async (): Promise<void> => {
    clientStore.loading = true
    try {
      const res = await $fetch<{ active?: typeof clientStore.rawActiveNumbers }>('/api/admin/passes')
      clientStore.rawActiveNumbers = res.active ?? []
    } catch (err: unknown) {
      console.error('Не удалось загрузить системные пропуска', err)
      clientStore.rawActiveNumbers = []
    } finally {
      clientStore.loading = false
    }
  }

  // 2. Массовая проверка связи с устройствами (уникально для админки)
  const checkAllDevicesStatus = async (): Promise<void> => {
    checkingDevices.value = true
    try {
      const res = await $fetch<{ statuses: Record<number, DeviceStatusInfo> }>('/api/admin/devices/check-all')
      if (res?.statuses) {
        Object.assign(deviceStatuses, res.statuses)
      }
    } catch (err: unknown) {
      console.error('Ошибка при массовой проверке устройств:', err)
      showError('Ошибка', 'Не удалось выполнить диагностику устройств')
    } finally {
      checkingDevices.value = false
    }
  }

  // 3. Создать пропуск от имени администратора (использует метод клиентского стора!)
  const createPass = async (data: {
    carNumber: string
    totalHours: number
    comment: string
    deviceIds: number[]
  }): Promise<boolean> => {
    // Переиспользуем готовую логику выписки и уведомлений из клиентского стора
    const success = await clientStore.createPass(data)
    if (success) {
      // Обновляем список через админский эндпоинт
      await fetchActiveNumbers()
    }
    return success
  }

  // 4. Отозвать пропуска (использует метод клиентского стора!)
  const revokePass = async (recordIds: Array<number | string>): Promise<boolean> => {
    const success = await clientStore.revokePass(recordIds)
    if (success) {
      await fetchActiveNumbers()
    }
    return success
  }

  return {
    // Проксируем реактивные данные из клиентского стора
    rawActiveNumbers: computed(() => clientStore.rawActiveNumbers),
    loading: computed(() => clientStore.loading),

    // Админские состояния и методы
    deviceStatuses,
    checkingDevices,
    fetchActiveNumbers,
    checkAllDevicesStatus,
    createPass,
    revokePass,

    // Переиспользуем готовую фильтрацию и расчеты времени из клиентского стора!
    getNumbersForDevices: clientStore.getNumbersForDevices
  }
})
