import { useAuthSessionStore } from '~/stores/auth/session'

export default defineNuxtPlugin(async () => {
  const authStore = useAuthSessionStore()

  // Инициализируем сессию глобально для всего приложения (SSR + Client)
  await authStore.initSession()
})
