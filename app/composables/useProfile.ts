export function useProfile() {
  const { user, fetch: refreshSession } = useUserSession()
  const toast = useToast()

  const state = reactive({
    name: user.value?.name || '',
    email: user.value?.email || '',
    password: '',
    confirmPassword: ''
  })

  const isLoading = ref(false)

  // Синхронизируем локальное состояние при обновлении данных пользователя в сессии
  watchEffect(() => {
    if (user.value) {
      if (!state.name) state.name = user.value.name
      if (!state.email) state.email = user.value.email
    }
  })

  async function saveProfile() {
    if (state.password && state.password !== state.confirmPassword) {
      toast.add({
        title: 'Ошибка',
        description: 'Пароли не совпадают',
        color: 'error'
      })
      return false
    }

    isLoading.value = true

    try {
      await $fetch('/api/users/profile', {
        method: 'PATCH',
        body: {
          name: state.name,
          email: state.email,
          ...(state.password ? { password: state.password } : {})
        }
      })

      await refreshSession()

      toast.add({
        title: 'Успешно',
        description: 'Профиль успешно обновлен',
        color: 'success'
      })

      state.password = ''
      state.confirmPassword = ''
      return true
    } catch (err: unknown) {
      const fetchError = err as { data?: { statusMessage?: string; message?: string } }
      toast.add({
        title: 'Ошибка',
        description: fetchError.data?.statusMessage || fetchError.data?.message || 'Не удалось обновить профиль',
        color: 'error'
      })
      return false
    } finally {
      isLoading.value = false
    }
  }

  async function handleAvatarUpdated() {
    await refreshSession()
    toast.add({
      title: 'Аватар обновлен',
      description: 'Новое изображение успешно сохранено',
      color: 'success'
    })
  }

  return {
    state,
    isLoading,
    saveProfile,
    handleAvatarUpdated
  }
}
