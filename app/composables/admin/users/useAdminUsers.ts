import { useAdminUsersStore } from '~/stores/adminUsers'
import { useAdminClientsStore } from '~/stores/adminClients' // Убедитесь, что ClientItem экспортируется из стора клиентов

export function useAdminUsers() {
  const usersStore = useAdminUsersStore()
  const clientsStore = useAdminClientsStore()

  const selectedTab = ref<string>('all')
  const searchQuery = ref('')

  const roleTabs = [
    { label: 'Все сотрудники', value: 'all' },
    { label: 'Администраторы', value: 'admin' },
    { label: 'Монтажники', value: 'installer' },
    { label: 'Клиенты', value: 'client' },
  ]

  // Фильтрация сотрудников (типизация идет из стора автоматически)
  const filteredStaff = computed(() => {
    if (!usersStore.users) return []
    return usersStore.users.filter((u) => {
      const matchesRole = selectedTab.value === 'all' || u.role_name === selectedTab.value
      const query = searchQuery.value.toLowerCase()
      return matchesRole && (!query || u.user_name?.toLowerCase().includes(query) || u.phone?.includes(query) || u.email?.toLowerCase().includes(query))
    })
  })

  // Фильтрация клиентов
  const filteredClients = computed(() => {
    if (!clientsStore.clients) return []
    return clientsStore.clients.filter((c) => {
      const query = searchQuery.value.toLowerCase()
      return !query || c.user_name?.toLowerCase().includes(query) || c.phone?.includes(query) || c.email?.toLowerCase().includes(query)
    })
  })

  // Общая загрузка данных для страницы
  async function refreshAll() {
    await Promise.all([
      usersStore.fetchUsers(),
      clientsStore.fetchClients()
    ])
  }

  return {
    staffPending: computed(() => usersStore.loading || clientsStore.loading),
    staffError: computed(() => usersStore.error || clientsStore.error),
    selectedTab,
    searchQuery,
    roleTabs,
    filteredStaff,
    filteredClients,
    refreshStaff: usersStore.fetchUsers,
    refreshClients: clientsStore.fetchClients,
    refreshAll
  }
}
