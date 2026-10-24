import { defineStore } from 'pinia'

interface SessionUser {
  user_id: number
  role_name: string
  phone: string
  email?: string | null
  avatar_path?: string | null
}

interface LoginCredentials {
  phone: string
  password: string
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<SessionUser | null>(null)
  const isLoaded = ref(false)

  const isAuthenticated = computed(() => Boolean(user.value?.user_id))
  const roleName = computed(() => user.value?.role_name || '')

  const isAdmin = computed(() => roleName.value === 'admin')
  const isInstaller = computed(() => roleName.value === 'installer')
  const isClient = computed(() => roleName.value === 'client')

  async function initSession() {
    if (isLoaded.value) return
    try {
      const data = await $fetch<{ user: SessionUser | null }>('/api/auth/session')
      user.value = data.user || null
    } catch {
      user.value = null
    } finally {
      isLoaded.value = true
    }
  }

  // 💡 Регистрация: Шаг 1 — запрос Flash Call
  async function sendRegistrationCode(credentials: { phone: string; password: string }) {
    try {
      const data = await $fetch<{ success: boolean }>('/api/auth/register/init', {
        method: 'POST',
        body: credentials
      })
      return data.success
    } catch (err: unknown) {
      throw err
    }
  }

  // 💡 Регистрация: Шаг 2 — проверка кода из звонка и вход
  async function verifyAndRegister(payload: { phone: string; code: string }) {
    try {
      const data = await $fetch<{ success: boolean; user: SessionUser }>('/api/auth/register/verify', {
        method: 'POST',
        body: payload
      })

      user.value = data.user
      isLoaded.value = true

      await navigateTo('/profile')
      return true
    } catch (err: unknown) {
      throw err
    }
  }

  // 💡 Авторизация в системе
  async function login(credentials: LoginCredentials) {
    try {
      const data = await $fetch<{ success: boolean; user: SessionUser }>('/api/auth/login', {
        method: 'POST',
        body: credentials
      })

      user.value = data.user
      isLoaded.value = true

      if (data.user.role_name === 'admin') {
        await navigateTo('/admin')
      } else if (data.user.role_name === 'installer') {
        await navigateTo('/installer')
      } else if (data.user.role_name === 'client') {
        await navigateTo('/client')
      } else {
        navigateTo('/profile')
      }

      return { success: true }
    } catch (err: unknown) {
      // 👈 Пробрасываем ошибку наверх
      throw err
    }
  }

  async function logout() {
    try {
      await $fetch('/api/auth/logout', { method: 'POST' })
      user.value = null
      isLoaded.value = false
      await navigateTo('/auth/login')
    } catch (err) {
      console.error('Ошибка выхода:', err)
    }
  }

  return {
    user,
    isLoaded,
    isAuthenticated,
    roleName,
    isAdmin,
    isInstaller,
    isClient,
    verifyAndRegister,
    sendRegistrationCode,
    initSession,
    login,
    logout
  }
})
