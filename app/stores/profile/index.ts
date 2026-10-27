import { defineStore } from 'pinia'
import type { UserProfile } from '~/types/user'
import { getErrorMessage } from '~/types/error'

export const useProfileStore = defineStore('profile', () => {
  const profile = ref<UserProfile | null>(null)
  const isLoading = ref(false)
  const errorMessage = ref<string | null>(null)

  async function fetchProfile(force = false) {
    if (profile.value && !force) return

    isLoading.value = true
    errorMessage.value = null
    try {
      profile.value = await $fetch<UserProfile>('/api/profile/')
    } catch (err: unknown) {
      errorMessage.value = getErrorMessage(err, 'Не удалось загрузить профиль')
      profile.value = null
    } finally {
      isLoading.value = false
    }
  }

  async function updateProfile(payload: {
    user_name?: string
    email?: string | null
    password?: string
  }) {
    isLoading.value = true
    errorMessage.value = null
    try {
      profile.value = await $fetch<UserProfile>('/api/profile/', {
        method: 'PATCH',
        body: payload
      })
      return true
    } catch (err: unknown) {
      errorMessage.value = getErrorMessage(err, 'Ошибка обновления профиля')
      throw err
    } finally {
      isLoading.value = false
    }
  }

  function clearStore() {
    profile.value = null
    errorMessage.value = null
    isLoading.value = false
  }

  return {
    profile,
    isLoading,
    errorMessage,
    fetchProfile,
    updateProfile,
    clearStore
  }
})
