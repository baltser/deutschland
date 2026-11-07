import { useProfileStore } from '~/stores/profile'
import { useToastNotifications } from '~/composables/useToast'

export function useProfile() {
  const store = useProfileStore()
  const { showSuccess, showError, showWarning } = useToastNotifications()

  const state = reactive({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })

  const isLoading = ref(false)
  const isSendingVerification = ref(false)
  const showPasswordFields = ref(false)

  const normalizeEmail = (val?: string | null) => (val || '').trim().toLowerCase()

  // Загрузка данных профиля
  async function initProfile() {
    await store.fetchProfile()
    if (store.profile) {
      state.name = store.profile.user_name || ''
      state.email = store.profile.email || ''
    }
  }

  const isEmailVerified = computed(() => {
    return normalizeEmail(state.email) === normalizeEmail(store.profile?.email) && Boolean(store.profile?.email_verified_at)
  })

  const passwordError = computed(() => {
    if ((state.password || state.confirmPassword) && state.password !== state.confirmPassword) {
      return 'Пароли не совпадают'
    }
    return undefined
  })

  const isDirty = computed(() => {
    const nameChanged = state.name.trim() !== (store.profile?.user_name || '').trim()
    const emailChanged = state.email.trim() !== (store.profile?.email || '').trim()
    const passwordFilled = Boolean(state.password || state.confirmPassword)
    return nameChanged || emailChanged || passwordFilled
  })

  // Сохранение профиля
  async function saveProfile() {
    if (passwordError.value) {
      showError('Ошибка', 'Пароли не совпадают')
      return false
    }

    isLoading.value = true
    try {
      const payload: { user_name?: string; email?: string | null; password?: string } = {}

      const currentName = (store.profile?.user_name || '').trim()
      const newName = state.name.trim()
      if (newName !== currentName) {
        payload.user_name = newName
      }

      const currentEmail = (store.profile?.email || '').trim().toLowerCase()
      const newEmail = state.email.trim().toLowerCase()
      if (newEmail !== currentEmail) {
        payload.email = newEmail === '' ? null : newEmail
      }

      if (state.password) {
        payload.password = state.password
      }

      if (Object.keys(payload).length === 0) {
        showWarning('Информация', 'Нет изменений для сохранения')
        return true
      }

      await store.updateProfile(payload)

      showSuccess('Успешно', 'Профиль обновлен')
      state.password = ''
      state.confirmPassword = ''
      showPasswordFields.value = false
      return true
    } catch (err: unknown) {
      const e = err as { data?: { message?: string } }
      showError('Ошибка', e.data?.message || 'Не удалось обновить профиль')
      return false
    } finally {
      isLoading.value = false
    }
  }

  // Отправка письма для подтверждения email
  async function sendVerificationEmail() {
    if (!state.email) return

    isSendingVerification.value = true
    try {
      await $fetch('/api/auth/mail/verify', {
        method: 'POST',
        body: { email: state.email.trim() }
      })

      await store.fetchProfile(true)

      if (store.profile) {
        state.name = store.profile.user_name || ''
        state.email = store.profile.email || ''
      }

      showSuccess('Письмо отправлено', 'Ссылка с подтверждением отправлена на указанный email', {
        icon: 'i-lucide-mail-check'
      })
    } catch (err: unknown) {
      const e = err as { data?: { message?: string } }
      showError('Ошибка', e.data?.message || 'Не удалось отправить письмо')
    } finally {
      isSendingVerification.value = false
    }
  }

  async function handleAvatarUpdated() {
    await store.fetchProfile(true)
    showSuccess('Успешно', 'Аватар обновлен')
  }

  return {
    state,
    isLoading,
    isSendingVerification,
    showPasswordFields,
    passwordError,
    isDirty,
    isEmailVerified,
    user: computed(() => store.profile),
    initProfile,
    saveProfile,
    sendVerificationEmail,
    handleAvatarUpdated
  }
}
