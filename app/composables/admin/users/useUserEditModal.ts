import type { ClientAddressItem } from '~/components/client/address/List.vue'

export interface UserEditTarget {
  user_id: number
  user_name?: string | null
  phone: string
  email?: string | null
  avatar_path?: string | null
  role_name?: string
  activated_at?: string | null
  role?: { role_name: string }
  addresses?: ClientAddressItem[]
}

// Точный тип эмитов для модалки редактирования
type UserEditEmit =
  ((event: 'update:modelValue', value: boolean) => void) &
  ((event: 'save', payload: { user_name: string; role_name: string; avatar_path?: string | null; avatarFile?: File | null }) => void)

export function useUserEditModal(
  userProp: Ref<UserEditTarget | null>,
  modelValueProp: Ref<boolean>,
  emit: UserEditEmit
) {
  // Локальная форма
  const form = reactive({
    user_name: '',
    role_name: '',
    avatar_path: null as string | null,
    newAvatarFile: null as File | null,
    localPreviewUrl: null as string | null
  })

  // Вычисление исходной роли
  const initialRole = computed(() => {
    if (!userProp.value) return 'client'
    const raw = userProp.value.role_name || userProp.value.role?.role_name || 'installer'
    return raw.toLowerCase().trim()
  })

  // Проверка, является ли пользователь клиентом
  const isClient = computed(() => initialRole.value === 'client')

  // Динамический заголовок модалки
  const modalTitle = computed(() => {
    if (!userProp.value) return 'Пользователь'
    const name = form.user_name || userProp.value.user_name || 'Без имени'
    return isClient.value ? `Клиент: ${name}` : `Сотрудник: ${name}`
  })

  // Опции ролей для сотрудников
  const staffRoleOptions = [
    { label: 'Администратор (admin)', value: 'admin' },
    { label: 'Монтажник (installer)', value: 'installer' },
  ]

  // Актуальный URL для отображения аватарки
  const displayAvatarUrl = computed(() => {
    if (form.localPreviewUrl) return form.localPreviewUrl
    const path = form.avatar_path || userProp.value?.avatar_path
    if (!path) return null
    return path.startsWith('/api/files/') ? path : `/api/files/${path}`
  })

  // Проверка наличия изменений для активации кнопки сохранения
  const hasChanges = computed(() => {
    if (!userProp.value) return false
    const origName = userProp.value.user_name || ''
    const origRole = initialRole.value

    return (
      form.user_name !== origName ||
      form.newAvatarFile !== null ||
      (!isClient.value && form.role_name !== origRole)
    )
  })

  // Очистка памяти blob-урла превью
  const revokePreview = () => {
    if (form.localPreviewUrl) {
      URL.revokeObjectURL(form.localPreviewUrl)
      form.localPreviewUrl = null
    }
  }

  // Синхронизация формы при изменении пропса user
  watch(
    userProp,
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

  // Обработка выбора файла аватара
  function handleAvatarFileSelected(file: File) {
    revokePreview()
    form.newAvatarFile = file
    form.localPreviewUrl = URL.createObjectURL(file)
  }

  // Закрытие модального окна через v-model
  const isOpen = computed({
    get: () => modelValueProp.value,
    set: (val) => emit('update:modelValue', val)
  })

  // Сохранение изменений
  function handleSave(isSaving: boolean) {
    if (!hasChanges.value || isSaving) return

    emit('save', {
      user_name: form.user_name.trim(),
      role_name: form.role_name,
      avatar_path: form.avatar_path,
      avatarFile: form.newAvatarFile
    })
  }

  return {
    form,
    isOpen,
    isClient,
    modalTitle,
    staffRoleOptions,
    displayAvatarUrl,
    hasChanges,
    handleAvatarFileSelected,
    handleSave,
    revokePreview
  }
}
