export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterPayload {
  name: string
  email: string
  password: string
  avatar?: File | null
}

export const useAuth = () => {
  const { fetch: refreshSession } = useUserSession()
  const toast = useToast()
  const isLoading = ref(false)
  const errorMessage = ref('')

  // Общий обработчик ошибок
  function handleAuthError(err: unknown, defaultMsg: string) {
    const fetchError = err as { data?: { statusMessage?: string; message?: string } }
    const msg = fetchError.data?.statusMessage || fetchError.data?.message || defaultMsg
    errorMessage.value = msg
    toast.add({
      title: 'Ошибка',
      description: msg,
      color: 'error'
    })
  }

  // Вход в систему
  async function login(credentials: LoginCredentials) {
    errorMessage.value = ''
    isLoading.value = true

    try {
      await $fetch('/api/auth/login', {
        method: 'POST',
        body: credentials
      })
      await refreshSession()
      await navigateTo('/')
    } catch (err: unknown) {
      handleAuthError(err, 'Ошибка входа в систему')
    } finally {
      isLoading.value = false
    }
  }

  // Регистрация с поддержкой аватара
  async function register(payload: RegisterPayload, confirmPassword?: string) {
    errorMessage.value = ''

    if (confirmPassword && payload.password !== confirmPassword) {
      errorMessage.value = 'Пароли не совпадают'
      toast.add({ title: 'Ошибка', description: 'Пароли не совпадают', color: 'error' })
      return
    }

    isLoading.value = true

    try {
      const formData = new FormData()
      formData.append('name', payload.name)
      formData.append('email', payload.email)
      formData.append('password', payload.password)
      if (payload.avatar) {
        formData.append('avatar', payload.avatar)
      }

      await $fetch('/api/auth/register', {
        method: 'POST',
        body: formData
      })

      // ❌ Удалили refreshSession() и navigateTo('/'),
      // так как пользователь еще не подтвердил почту и не имеет активной сессии.

      toast.add({
        title: 'Регистрация успешна',
        description: 'Мы отправили письмо для подтверждения на ваш email.',
        color: 'success'
      })

      // ✅ Перенаправляем на страницу ожидания
      await navigateTo('/auth/verify-pending')
    } catch (err: unknown) {
      handleAuthError(err, 'Ошибка регистрации')
    } finally {
      isLoading.value = false
    }
  }

  return {
    isLoading,
    errorMessage,
    login,
    register
  }
}
