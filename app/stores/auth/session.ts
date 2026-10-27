import { defineStore } from 'pinia'
import type { SessionUser } from '~/types/auth'

export const useAuthSessionStore = defineStore('authSession', () => {
  const user = ref<SessionUser | null>(null)
  const isLoaded = ref(false)

  const isAuthenticated = computed(() => Boolean(user.value && user.value.user_id))
  const roleName = computed(() => user.value?.role_name || '')

  const isAdmin = computed(() => roleName.value === 'admin')
  const isInstaller = computed(() => roleName.value === 'installer')
  const isClient = computed(() => roleName.value === 'client')

  async function initSession() {
    if (isLoaded.value) return
    try {
      const requestFetch = useRequestFetch()
      const data = await requestFetch<{ user: SessionUser | null }>('/api/auth/session')

      user.value = data?.user || null
    } catch (err) {
      console.error('Ошибка инициализации сессии:', err)
      user.value = null
    } finally {
      isLoaded.value = true
    }
  }

  async function logout() {
    await handleLogout()
  }

  return {
    user,
    isLoaded,
    isAuthenticated,
    roleName,
    isAdmin,
    isInstaller,
    isClient,
    initSession,
    logout
  }
})
