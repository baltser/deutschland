import type { InstallerDevicesResponse } from '~/types/device'

export type TabType = 'PANEL' | 'CAMERA' | 'all'

export function useInstallerDevices() {
  const route = useRoute()
  const router = useRouter()

  // 1. Управление активной вкладкой через URL query
  const activeTab = computed<TabType>({
    get: () => {
      const tab = route.query.tab as TabType
      if (['PANEL', 'CAMERA', 'all'].includes(tab)) return tab
      return 'PANEL'
    },
    set: (val) => {
      router.replace({ query: { ...route.query, tab: val } })
    }
  })

  // 2. Загрузка данных с сервера
  const { data: responseData, pending, error, refresh } = useFetch<InstallerDevicesResponse>('/api/installer/devices')

  const rawAddresses = computed(() => responseData.value?.addresses || [])

  // 3. Логика фильтрации оборудования в зависимости от вкладки
  const addresses = computed(() => {
    if (activeTab.value === 'all') {
      return rawAddresses.value
    }

    return rawAddresses.value
      .map(addr => ({
        ...addr,
        devices: (addr.devices || []).filter(d => d.device_type === activeTab.value)
      }))
      .filter(addr => addr.devices.length > 0)
  })

  return {
    activeTab,
    addresses,
    pending,
    error,
    refresh
  }
}
