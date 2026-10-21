import { formatPhone } from '~/utils/formatPhone'

export function useAuthForm() {
  const auth = useAuth()

  const state = reactive({
    phone: '',
    password: ''
  })

  const showPassword = ref(false)

  const handlePhoneInput = (val: string) => {
    state.phone = formatPhone(val)
  }

  // Очистка телефона от форматирования для API
  const getCleanPhone = (): string | null => {
    auth.errorMessage.value = ''
    const clean = state.phone.replace(/\D/g, '')
    if (clean.length < 11) {
      auth.errorMessage.value = 'Введите корректный номер телефона (11 цифр)'
      return null
    }
    return clean
  }

  return {
    ...auth,
    state,
    showPassword,
    handlePhoneInput,
    getCleanPhone
  }
}
