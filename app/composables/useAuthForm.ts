import { useAuthStore } from '~/stores/auth'

export function useAuthForm() {
  const authStore = useAuthStore()

  const state = reactive({
    phone: '',
    password: ''
  })

  const showPassword = ref(false)
  const isLoading = ref(false)
  const errorMessage = ref<string | null>(null)

  // Добавляем UI-состояния для регистрации
  const step = ref<'input' | 'phone-verify'>('input')
  const phoneCode = ref('')

  function getCleanPhone() {
    let cleaned = state.phone.replace(/\D/g, '')
    if (cleaned.startsWith('8') && cleaned.length === 11) {
      cleaned = '7' + cleaned.slice(1)
    }
    return cleaned
  }

  function extractErrorMessage(err: unknown, fallback: string): string {
    const e = err as { data?: { message?: string; statusMessage?: string }; message?: string; statusMessage?: string }
    return e?.data?.message || e?.data?.statusMessage || e?.statusMessage || e?.message || fallback
  }

  function handlePhoneInput(value: string | number) {
    state.phone = formatPhone(String(value))
    errorMessage.value = null
  }

  // Обычный логин
  async function login(credentials: { phone: string; password: string }) {
    isLoading.value = true
    errorMessage.value = null

    try {
      await authStore.login(credentials)
    } catch (err: unknown) {
      // 💡 Вытаскиваем сообщение от бэкенда ("Неверный номер телефона или пароль")
      errorMessage.value = extractErrorMessage(err, 'Неверный номер телефона или пароль')
    } finally {
      isLoading.value = false
    }
  }

  // 💡 Регистрация: Шаг 1
  async function sendRegistrationCode(credentials: { phone: string; password: string }) {
    isLoading.value = true
    errorMessage.value = null

    try {
      const success = await authStore.sendRegistrationCode(credentials)
      if (success) {
        step.value = 'phone-verify'
      }
      return success
    } catch (err: unknown) {
      errorMessage.value = extractErrorMessage(err, 'Ошибка отправки запроса')

      // return false
    } finally {
      isLoading.value = false
    }
  }

  // 💡 Регистрация: Шаг 2
  async function verifyAndRegister(payload: { phone: string; code: string }) {
    isLoading.value = true
    errorMessage.value = null

    try {
      await authStore.verifyAndRegister(payload)
    } catch (err: unknown) {
      errorMessage.value = extractErrorMessage(err, 'Неверный код подтверждения')

    } finally {
      isLoading.value = false
    }
  }

  return {
    state,
    showPassword,
    isLoading,
    errorMessage,
    step,
    phoneCode,
    login,
    sendRegistrationCode,
    verifyAndRegister,
    handlePhoneInput,
    getCleanPhone
  }
}
