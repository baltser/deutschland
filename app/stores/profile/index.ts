import { defineStore } from 'pinia'

export interface Profile {
  user_id: number
  user_name: string | null
  role_name: string | null
  email: string | null
  email_verified_at: string | null
  avatar_path: string | null
  created_at: string
}

export const useProfileStore = defineStore('profile', () => {
  const profile = ref<Profile | null>(null)
  const isLoading = ref(false)
  const errorMessage = ref<string | null>(null)

  async function fetchProfile(force = false) {
    // Если профиль уже загружен и не требуется принудительное обновление — пропускаем
    if (profile.value && !force) return

    isLoading.value = true
    errorMessage.value = null
    try {
      profile.value = await $fetch<Profile>('/api/profile/')
    } catch (err: unknown) {
      const e = err as { data?: { message?: string } }
      errorMessage.value = e.data?.message || 'Не удалось загрузить профиль'
    } finally {
      isLoading.value = false
    }
  }

  async function updateProfile(payload: { user_name?: string; email?: string }) {
    isLoading.value = true
    errorMessage.value = null
    try {
      profile.value = await $fetch<Profile>('/api/profile/', {
        method: 'PATCH',
        body: payload
      })
      return true
    } catch (err: unknown) {
      const e = err as { data?: { message?: string } }
      errorMessage.value = e.data?.message || 'Ошибка обновления профиля'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  function clearProfile() {
    profile.value = null
    errorMessage.value = null
  }

  return {
    profile,
    isLoading,
    errorMessage,
    fetchProfile,
    updateProfile,
    clearProfile
  }
})
