import { formatPhone } from '~/utils/formatPhone.ts'

export function useAdminCreateUser(onSuccess: () => void) {
  const toast = useToast()

  const isAddModalOpen = ref(false)
  const newPhone = ref('')
  const newUserName = ref('')
  const newRole = ref<'admin' | 'installer'>('installer')
  const isCreating = ref(false)

  const handlePhoneInput = (val: string) => {
    newPhone.value = formatPhone(val)
  }

  // Принимаем роль как параметр (по умолчанию 'installer')
  function openAddModal(role: 'admin' | 'installer' = 'installer') {
    newPhone.value = ''
    newUserName.value = ''
    newRole.value = role
    isAddModalOpen.value = true
  }

  async function handleCreateStaff() {
    if (!newPhone.value.trim()) {
      toast.add({ title: 'Ошибка', description: 'Укажите номер телефона', color: 'error' })
      return
    }

    isCreating.value = true
    try {
      await $fetch('/api/admin/users', {
        method: 'POST',
        body: {
          phone: newPhone.value.trim(),
          user_name: newUserName.value.trim() || undefined,
          role_name: newRole.value
        }
      })

      toast.add({ title: 'Успешно', description: 'Сотрудник успешно добавлен', color: 'success' })
      isAddModalOpen.value = false
      onSuccess()
    } catch (err: unknown) {
      const fetchErr = err as { data?: { message?: string } }
      toast.add({ title: 'Ошибка', description: fetchErr.data?.message || 'Не удалось добавить сотрудника', color: 'error' })
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
    handlePhoneInput,
    openAddModal,
    handleCreateStaff
  }
}
