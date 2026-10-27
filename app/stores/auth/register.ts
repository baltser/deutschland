import { defineStore } from 'pinia'
import { useAuthSessionStore } from './session'
import type { SessionUser } from '~/types/auth'
import { getErrorMessage } from '~/types/error'

export const useAuthRegisterStore = defineStore('authRegister', () => {
  const sessionStore = useAuthSessionStore()

  // 💡 Меняем 'init' на 'input', чтобы сошлось со страницей
  const step = ref<'input' | 'verify'>('input')
  const phone = ref('')
  const password = ref('')
  const isLoading = ref(false)
  const errorMessage = ref<string | null>(null)

  async function sendCode() {
    if (!phone.value || !password.value) return
    isLoading.value = true
    errorMessage.value = null
    try {
      const data = await $fetch<{ success: boolean; message?: string; ucallerId?: string }>('/api/auth/register/init', {
        method: 'POST',
        body: { phone: phone.value, password: password.value }
      })

      if (data?.success) {
        step.value = 'verify'
      }
    } catch (err: unknown) {
      errorMessage.value = getErrorMessage(err, 'Не удалось запросить звонок подтверждения')
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function verifyCode(code: string) {
    isLoading.value = true
    errorMessage.value = null
    try {
      const data = await $fetch<{ success: boolean; user: SessionUser }>('/api/auth/register/verify', {
        method: 'POST',
        body: { phone: phone.value, code }
      })

      sessionStore.user = data.user
      sessionStore.isLoaded = true

      await navigateTo('/profile')
      return true
    } catch (err: unknown) {
      errorMessage.value = getErrorMessage(err, 'Неверный код подтверждения')
      throw err
    } finally {
      isLoading.value = false
    }
  }


  return {
    step,
    phone,
    password,
    isLoading,
    errorMessage,
    sendCode,
    verifyCode
  }
})
