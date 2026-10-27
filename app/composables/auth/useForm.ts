import { useAuthLoginStore } from '~/stores/auth/login'
import { useAuthRegisterStore } from '~/stores/auth/register'
import { getErrorMessage } from '~/types/error'
import type {LoginCredentials} from "~/types/auth.ts";

export function useForm() {
  const loginStore = useAuthLoginStore()
  const registerStore = useAuthRegisterStore()

  const state = reactive({
    phone: '',
    password: ''
  })

  const showPassword = ref(false)

  const isLoading = computed(() => loginStore.isLoading || registerStore.isLoading)
  const errorMessage = ref<string | null>(null)

  const phoneCode = ref('')

  async function login(credentials: LoginCredentials) {
    errorMessage.value = null
    try {
      await loginStore.login(credentials)
    } catch (err: unknown) {
      errorMessage.value = getErrorMessage(err, 'Неверный номер телефона или пароль')
    }
  }

  async function sendRegistrationCode(credentials: LoginCredentials) {
    errorMessage.value = null
    try {
      registerStore.phone = credentials.phone
      registerStore.password = credentials.password

      await registerStore.sendCode()
      return true
    } catch (err: unknown) {
      errorMessage.value = getErrorMessage(err, 'Ошибка отправки запроса')
      return false
    }
  }

  async function verifyAndRegister(payload: { phone: string; code: string }) {
    errorMessage.value = null
    try {
      await registerStore.verifyCode(payload.code)
    } catch (err: unknown) {
      errorMessage.value = getErrorMessage(err, 'Неверный код подтверждения')
    }
  }

  return {
    state,
    showPassword,
    isLoading,
    errorMessage,
    step: computed({
      get: () => registerStore.step,
      set: (val) => {
        registerStore.step = val
      }
    }),
    phoneCode,
    login,
    sendRegistrationCode,
    verifyAndRegister,

  }
}
