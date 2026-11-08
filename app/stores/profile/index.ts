import { defineStore } from 'pinia'
import type { UserProfile } from '~/types/user'
import { getErrorMessage } from '~/types/error'

export const useProfileStore = defineStore('profile', () => {
  // Подключаем наш стандартизированный композабл для уведомлений
  const { showSuccess, showError } = useToastNotifications()

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

// 📸 Загрузка и обновление аватара
  async function updateAvatar(file: File) {
    if (!profile.value?.user_id) {
      showError('Ошибка', 'Не удалось определить ID пользователя')
      return
    }

    isLoading.value = true
    errorMessage.value = null
    try {
      const formData = new FormData()
      formData.append('avatar', file)

      // 💡 Используем правильный путь с ID пользователя в соответствии с файлом на сервере
      const response = await $fetch<{ success: boolean; avatarUrl: string }>(
        `/api/profile/${profile.value.user_id}/avatar`,
        {
          method: 'POST',
          body: formData
        }
      )

      if (profile.value && response.avatarUrl) {
        profile.value.avatar_path = response.avatarUrl.replace(/^\/api\/files\//, '')
      }

      showSuccess('Успешно', 'Аватар обновлен')
      return response.avatarUrl
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err, 'Не удалось загрузить аватар на сервер')
      errorMessage.value = errorMsg
      showError('Ошибка загрузки', errorMsg)
      throw err
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

      showSuccess('Успешно', 'Профиль успешно обновлен')
      return true
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err, 'Ошибка обновления профиля')
      errorMessage.value = errorMsg
      showError('Ошибка', errorMsg)
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
    updateAvatar,
    updateProfile,
    clearStore
  }
})
