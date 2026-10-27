import { useAdminUsersStore } from '~/stores/admin/users'
import type {StaffUser, ClientUser, ClientAddressRelation} from '~/types/user'

export type UserEditTarget = (StaffUser | ClientUser) & {
  role?: { role_name: string }
  addresses?: ClientAddressRelation[]
}
export function useAdminUserEdit() {
  const store = useAdminUsersStore()

  const isEditModalOpen = ref(false)
  const selectedUser = ref<UserEditTarget | null>(null)
  const isSaving = ref(false)

  function openEditModal(user: UserEditTarget) {
    selectedUser.value = user
    isEditModalOpen.value = true
  }

  async function handleSaveUser(payload: { user_name: string; role_name: string; avatarFile?: File | null }) {
    if (!selectedUser.value) return
    isSaving.value = true
    try {
      await store.updateUser(selectedUser.value.user_id, payload)
      isEditModalOpen.value = false
    } catch (err: unknown) {
      console.error('Ошибка сохранения пользователя:', err)
    } finally {
      isSaving.value = false
    }
  }
  return {
    isEditModalOpen,
    selectedUser,
    isSaving,
    openEditModal,
    handleSaveUser
  }
}
