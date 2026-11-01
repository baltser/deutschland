import { useAdminStaffStore } from '~/stores/admin/users/staff'
import { useAdminClientsStore } from '~/stores/admin/users/clients'

export type UserRoleTab = 'admin' | 'installer' | 'client'

export function useAdminUserTabs() {
  const staffStore = useAdminStaffStore()
  const clientsStore = useAdminClientsStore()

  const selectedTab = ref<UserRoleTab>('admin')
  const searchQuery = ref('')

  const roleTabs = [
    { label: 'Администраторы', value: 'admin' },
    { label: 'Монтажники', value: 'installer' },
    { label: 'Клиенты', value: 'client' },
  ] as const

  // Синхронизация поиска с бэкендом для клиентов
  watch(searchQuery, (val) => {
    if (selectedTab.value === 'client') {
      clientsStore.setSearch(val.trim())
    }
  })

  // Фильтрация персонала на клиенте
  const filteredStaff = computed(() => {
    let list = staffStore.staffList.filter(u => u.role_name === selectedTab.value)

    if (searchQuery.value.trim()) {
      const query = searchQuery.value.toLowerCase()
      list = list.filter(u =>
        (u.user_name && u.user_name.toLowerCase().includes(query)) ||
        (u.phone && u.phone.toLowerCase().includes(query)) ||
        (u.email && u.email.toLowerCase().includes(query))
      )
    }
    return list
  })

  const filteredClients = computed(() => clientsStore.list)

  return {
    staffStore,
    clientsStore,
    selectedTab,
    searchQuery,
    roleTabs,
    filteredStaff,
    filteredClients
  }
}
