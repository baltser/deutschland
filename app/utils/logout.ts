import { useProfileStore } from '~/stores/profile'

export async function handleLogout() {
  try {
    // 1. Очищаем сессию nuxt-auth-utils
    const { clear } = useUserSession()
    await clear()
  } catch (err) {
    console.error('Ошибка при выходе из системы:', err)
  } finally {
    // 2. Очищаем локальные сторы (профиль и т.д.)
    const profileStore = useProfileStore()
    profileStore.clearStore()

    reloadNuxtApp({
      path: '/auth/login',
      persistState: false
    })  }
}
