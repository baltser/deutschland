export function useProfile() {
  const { fetch: refreshSession } = useUserSession()
  const toast = useToast()

  // Изначально поля формы пустые
  const state = reactive({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })

  const isLoading = ref(false)

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
      // Отправляем на бэкенд только те поля, которые пользователь заполнил
      await $fetch('/api/users/profile', {
        method: 'PATCH',
        body: {
          ...(state.name ? { name: state.name } : {}),
          ...(state.email ? { email: state.email } : {}),
          ...(state.password ? { password: state.password } : {})
        }
      })

      // Обновляем сессию, чтобы карточка сверху сразу показала новое имя/email (если они менялись)
      await refreshSession()

      toast.add({
        title: 'Успешно',
        description: 'Профиль успешно обновлен',
        color: 'success'
      })

      // Очищаем форму
      state.name = ''
      state.email = ''
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
