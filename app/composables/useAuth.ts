export interface PhoneAuthCredentials {
  phone: string
  password: string
}

export interface VerifyCodePayload {
  phone: string
  code: string
}

export const useAuth = () => {
  const { user, fetch: refreshSession } = useUserSession()
  const toast = useToast()
  const isLoading = ref(false)
  const errorMessage = ref('')

  // Общий обработчик ошибок
  function handleAuthError(err: unknown, defaultMsg: string) {
    const fetchError = err as { data?: { statusMessage?: string; message?: string } }
    const msg = fetchError.data?.message ||
      (fetchError.data?.statusMessage !== 'Server Error' ? fetchError.data?.statusMessage : null) ||
      defaultMsg

    errorMessage.value = msg
    toast.add({
      title: 'Ошибка',
      description: msg,
      color: 'error'
    })
  }

  // Умный редирект в зависимости от роли пользователя
  async function redirectByRole() {
    await refreshSession()
    const roleName = user.value?.role_name

    if (roleName === 'admin') {
      await navigateTo('/admin/addresses')
    } else if (roleName === 'installer') {
      await navigateTo('/installer')
    } else {
      await navigateTo('/client')
    }
  }

  // 1. Вход в систему по телефону и паролю
  async function login(credentials: PhoneAuthCredentials) {
    errorMessage.value = ''
    isLoading.value = true

    try {
      await $fetch('/api/auth/login', {
        method: 'POST',
        body: credentials
      })

      await redirectByRole()
    } catch (err: unknown) {
      handleAuthError(err, 'Неверный номер телефона или пароль')
    } finally {
      isLoading.value = false
    }
  }

  // 2. Шаг 1 регистрации: Отправка Flash Call (звонка)
  async function sendRegistrationCode(credentials: PhoneAuthCredentials) {
    errorMessage.value = ''
    isLoading.value = true

    try {
      await $fetch('/api/auth/send-code', {
        method: 'POST',
        body: credentials
      })
      return true
    } catch (err: unknown) {
      handleAuthError(err, 'Не удалось отправить входящий вызов')
      return false
    } finally {
      isLoading.value = false
    }
  }

  // 3. Шаг 2 регистрации: Проверка 4 цифр из звонка и автоавторизация
  async function verifyAndRegister(payload: VerifyCodePayload) {
    errorMessage.value = ''
    isLoading.value = true

    try {
      await $fetch('/api/auth/verify-and-register', {
        method: 'POST',
        body: payload
      })

      toast.add({
        title: 'Успешная регистрация',
        description: 'Добро пожаловать в систему!',
        color: 'success'
      })

      await redirectByRole()
      return true
    } catch (err: unknown) {
      handleAuthError(err, 'Неверный код подтверждения')
      return false
    } finally {
      isLoading.value = false
    }
  }

  return {
    isLoading,
    errorMessage,
    login,
    sendRegistrationCode,
    verifyAndRegister
  }
}
