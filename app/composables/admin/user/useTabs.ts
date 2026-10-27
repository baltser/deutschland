import { useAdminUsersStore } from '~/stores/admin/users'

export type UserRoleTab = 'admin' | 'installer' | 'client'

export function useAdminUserTabs() {
  const store = useAdminUsersStore()
  const selectedTab = ref<UserRoleTab>('admin')
  const searchQuery = ref('')

  const roleTabs = [
    { label: 'Администраторы', value: 'admin' },
    { label: 'Монтажники', value: 'installer' },
    { label: 'Клиенты', value: 'client' },
  ] as const

  const filteredStaff = computed(() => {
    let list = store.staffList.filter(u => u.role_name === selectedTab.value)

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

  const filteredClients = computed(() => {
    let list = store.clientsList

    if (searchQuery.value.trim()) {
      const query = searchQuery.value.toLowerCase()
      list = list.filter(c =>
        (c.user_name && c.user_name.toLowerCase().includes(query)) ||
        (c.phone && c.phone.toLowerCase().includes(query)) ||
        (c.email && c.email.toLowerCase().includes(query))
      )
    }
    return list
  })

  return {
    store,
    selectedTab,
    searchQuery,
    roleTabs,
    filteredStaff,
    filteredClients
  }
}
