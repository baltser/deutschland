import { defineStore } from 'pinia'
import type { LoginCredentials, SessionUser } from '~/types/auth'
import { useAuthSessionStore } from './session'
import {useProfileStore} from "~/stores/profile";

export const useAuthLoginStore = defineStore('authLogin', () => {
  const sessionStore = useAuthSessionStore()
  const isLoading = ref(false)
  const errorMessage = ref<string | null>(null)

  const profileStore = useProfileStore()

  async function login(credentials: LoginCredentials) {
    isLoading.value = true
    errorMessage.value = null
    try {
      const data = await $fetch<{ success: boolean; user: SessionUser }>('/api/auth/login', {
        method: 'POST',
        body: credentials
      })
      profileStore.clearStore()
      // Обновляем глобальную сессию
      sessionStore.user = data.user
      sessionStore.isLoaded = true

      // Маршрутизация по ролям
      const routes: Record<string, string> = {
        admin: '/admin',
        installer: '/installer',
        client: '/client'
      }
      await navigateTo(routes[data.user.role_name] || '/profile')

      return true
    } catch (err: unknown) {
      const e = err as { data?: { message?: string } }
      errorMessage.value = e.data?.message || 'Ошибка авторизации'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  return {
    isLoading,
    errorMessage,
    login
  }
})
