// app/composables/useProfile.ts
export function useProfile() {
  const { user, fetch: refreshSession } = useUserSession()
  const toast = useToast()

  const state = reactive({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })

  const isLoading = ref(false)
  const isSendingVerification = ref(false)
  const showPasswordFields = ref(false)

  function normalizeEmail(val?: string | null): string {
    return (val || '').trim().toLowerCase()
  }

  // Инициализация полей из сессии
  function initProfile() {
    if (user.value) {
      state.name = user.value.user_name || ''
      state.email = user.value.email || ''
    }
  }

  // Проверка: подтвержден ли именно тот email, который сейчас в инпуте
  const isEmailVerified = computed(() => {
    const currentEmail = normalizeEmail(state.email)
    const sessionEmail = normalizeEmail(user.value?.email)

    // Если почта в инпуте изменена по сравнению с сессией — она еще НЕ подтверждена
    if (currentEmail !== sessionEmail) {
      return false
    }

    return Boolean(user.value?.email_verified_at)
  })

  const passwordError = computed(() => {
    if ((state.password || state.confirmPassword) && state.password !== state.confirmPassword) {
      return 'Пароли не совпадают'
    }
    return undefined
  })

  const isDirty = computed(() => {
    const nameChanged = (state.name || '').trim() !== (user.value?.user_name || '').trim()
    const emailChanged = normalizeEmail(state.email) !== normalizeEmail(user.value?.email)
    const passwordFilled = Boolean(state.password || state.confirmPassword)

    return nameChanged || emailChanged || passwordFilled
  })

  // Сохранение профиля
  async function saveProfile() {
    if (passwordError.value) {
      toast.add({
        title: 'Ошибка',
        description: 'Исправьте ошибки в форме перед сохранением',
        color: 'error',
        icon: 'i-lucide-alert-circle'
      })
      return false
    }

    isLoading.value = true
    const oldEmail = normalizeEmail(user.value?.email)
    const newEmail = normalizeEmail(state.email)
    const emailWasChanged = newEmail !== oldEmail && newEmail !== ''

    try {
      // 1. Отправляем изменения на бэкенд
      await $fetch('/api/users/profile', {
        method: 'PATCH',
        body: {
          name: state.name,
          email: state.email ? state.email.trim() : null,
          ...(state.password ? { password: state.password } : {})
        }
      })

      // 2. Обновляем сессию с сервера
      await refreshSession()

      // 3. Если изменился email — сразу отправляем письмо для подтверждения
      if (emailWasChanged) {
        try {
          await $fetch('/api/auth/mail/verify', { method: 'POST' })
          toast.add({
            title: 'Email изменен',
            description: 'Мы отправили ссылку для подтверждения на ваш новый адрес.',
            color: 'success',
            icon: 'i-lucide-mail-check'
          })
        } catch {
          toast.add({
            title: 'Внимание',
            description: 'Email сохранен, но не удалось отправить письмо подтверждения.',
            color: 'warning'
          })
        }
      } else {
        toast.add({
          title: 'Успешно',
          description: 'Профиль успешно обновлен',
          color: 'success',
          icon: 'i-lucide-check'
        })
      }

      // Сбрасываем поля пароля
      state.password = ''
      state.confirmPassword = ''
      showPasswordFields.value = false

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

  // Отправка письма повторно
  async function sendVerificationEmail() {
    isSendingVerification.value = true
    try {
      await $fetch('/api/auth/mail/verify', { method: 'POST' })
      await refreshSession()
      toast.add({
        title: 'Письмо отправлено',
        description: 'Проверьте ваш почтовый ящик для подтверждения email.',
        color: 'success'
      })
    } catch (err: unknown) {
      const fetchError = err as { data?: { message?: string } }
      toast.add({
        title: 'Ошибка отправки',
        description: fetchError.data?.message || 'Не удалось отправить письмо. Попробуйте позже.',
        color: 'error'
      })
    } finally {
      isSendingVerification.value = false
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
    isSendingVerification,
    showPasswordFields,
    passwordError,
    isDirty,
    isEmailVerified,
    initProfile,
    saveProfile,
    sendVerificationEmail,
    handleAvatarUpdated
  }
}
