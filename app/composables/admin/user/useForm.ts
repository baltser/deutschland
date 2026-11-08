// import type { UserEditTarget } from '~/types/user'
import { useAdminUserMutationsStore } from '~/stores/admin/users/mutations'
import type { StaffUser, ClientUser, ClientAddressRelation, UserRole } from '~/types/user'

export type UserEditTarget = (StaffUser | ClientUser) & {
  role_name?: UserRole | string
  addresses?: ClientAddressRelation[]
}

export function useUserEditForm(getTargetUser: () => UserEditTarget | null, onClose: () => void) {
  const mutationsStore = useAdminUserMutationsStore()
  const isSaving = ref(false)

  const form = reactive({
    user_name: '',
    role_name: '',
    avatar_path: null as string | null,
    newAvatarFile: null as File | null,
    localPreviewUrl: null as string | null
  })

  const user = computed(() => getTargetUser())

  // Исходная роль
  const initialRole = computed(() => {
    if (!user.value) return 'client'
    const raw = user.value.role_name || ('addresses' in user.value ? 'client' : 'installer')
    return raw.toLowerCase().trim()
  })

  const isClient = computed(() => initialRole.value === 'client')

  const modalTitle = computed(() => {
    if (!user.value) return 'Пользователь'
    const name = form.user_name || user.value.user_name || 'Без имени'
    return isClient.value ? `Клиент: ${name}` : `Сотрудник: ${name}`
  })

  // Превью аватара
  const displayAvatarUrl = computed(() => {
    if (form.localPreviewUrl) return form.localPreviewUrl
    const path = form.avatar_path || user.value?.avatar_path
    if (!path) return null
    return path.startsWith('/api/files/') ? path : `/api/files/${path}`
  })

  // Проверка изменений
  const hasChanges = computed(() => {
    if (!user.value) return false
    const origName = user.value.user_name || ''
    const origRole = initialRole.value

    return (
      form.user_name !== origName ||
      form.newAvatarFile !== null ||
      (!isClient.value && form.role_name !== origRole)
    )
  })

  // Очистка Blob URL для предотвращения утечек памяти
  const revokePreview = () => {
    if (form.localPreviewUrl) {
      URL.revokeObjectURL(form.localPreviewUrl)
      form.localPreviewUrl = null
    }
  }

  // Синхронизация формы при смене юзера
  watch(
    user,
    (newUser) => {
      revokePreview()
      if (newUser) {
        form.user_name = newUser.user_name || ''
        form.role_name = initialRole.value
        form.avatar_path = newUser.avatar_path || null
        form.newAvatarFile = null
        form.localPreviewUrl = null
      }
    },
    { immediate: true, deep: true }
  )

  // Выбор нового файла аватара
  function handleAvatarSelected(file: File) {
    revokePreview()
    form.newAvatarFile = file
    form.localPreviewUrl = URL.createObjectURL(file)
  }

  // Сохранение
  async function save() {
    if (!user.value || !hasChanges.value || isSaving.value) return false
    isSaving.value = true

    try {
      const success = await mutationsStore.updateUser(user.value.user_id, {
        user_name: form.user_name.trim(),
        role_name: form.role_name,
        avatarFile: form.newAvatarFile
      })

      if (success) {
        onClose()
        return true
      }
      return false
    } finally {
      isSaving.value = false
    }
  }

  onUnmounted(() => {
    revokePreview()
  })

  return {
    form,
    isClient,
    modalTitle,
    displayAvatarUrl,
    hasChanges,
    isSaving,
    handleAvatarSelected,
    save
  }
}
