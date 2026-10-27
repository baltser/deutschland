import { defineStore } from 'pinia'
import { getErrorMessage } from '~/types/error'

export const useAuthMailStore = defineStore('authMail', () => {
  const toast = useToast()

  const isSending = ref(false)

  /**
   * Отправка или повторная отправка письма с подтверждением email
   */
  async function sendVerificationEmail(email: string) {
    if (!email) return false

    isSending.value = true
    try {
      await $fetch('/api/auth/mail/verify', {
        method: 'POST',
        body: { email: email.trim() }
      })

      toast.add({
        title: 'Письмо отправлено',
        description: 'Ссылка с подтверждением отправлена на указанный email',
        color: 'success',
        icon: 'i-lucide-mail-check'
      })

      return true
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err, 'Не удалось отправить письмо')
      toast.add({ title: 'Ошибка', description: errorMsg, color: 'error' })
      return false
    } finally {
      isSending.value = false
    }
  }

  return {
    isSending,
    sendVerificationEmail
  }
})
