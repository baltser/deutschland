import { useAdminUsersStore } from '~/stores/admin/users'

export function useAdminUserCreate() {
  const store = useAdminUsersStore()

  const isAddModalOpen = ref(false)
  const newPhone = ref('')
  const newUserName = ref('')
  const newRole = ref<'admin' | 'installer'>('admin')
  const isCreating = ref(false)

  function openAddModal(role: 'admin' | 'installer') {
    newRole.value = role
    newPhone.value = ''
    newUserName.value = ''
    isAddModalOpen.value = true
  }

  async function handleCreateStaff() {
    isCreating.value = true
    try {
      await store.createStaff({
        phone: newPhone.value,
        user_name: newUserName.value,
        role_name: newRole.value
      })
      isAddModalOpen.value = false
    } catch (err: unknown) {
      console.error('Ошибка создания сотрудника:', err)
    } finally {
      isCreating.value = false
    }
  }

  return {
    isAddModalOpen,
    newPhone,
    newUserName,
    newRole,
    isCreating,
    openAddModal,
    handleCreateStaff
  }
}
