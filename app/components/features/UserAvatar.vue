<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'

interface Props {
  userId: string | number
  avatarUrl?: string | null
  canEdit?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  avatarUrl: null,
  canEdit: false
})

const emit = defineEmits<{
  (e: 'updated', newUrl: string): void
}>()

const toast = useToast()

const fileInputRef = ref<HTMLInputElement | null>(null)
const localPreviewUrl = ref<string>('')
const uploading = ref<boolean>(false)

// Приоритет отображения: локальный предпросмотр -> пропс avatarUrl
const displayAvatarUrl = computed(() => localPreviewUrl.value || props.avatarUrl)

const triggerFileInput = () => {
  fileInputRef.value?.click()
}

const revokePreview = () => {
  if (localPreviewUrl.value) {
    URL.revokeObjectURL(localPreviewUrl.value)
    localPreviewUrl.value = ''
  }
}

const handleFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  // Валидация формата
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    toast.add({
      title: 'Ошибка формата',
      description: 'Поддерживаются только форматы JPG, PNG и WEBP',
      color: 'red'
    })
    return
  }

  // Валидация размера (2 МБ)
  if (file.size > 2 * 1024 * 1024) {
    toast.add({
      title: 'Файл слишком большой',
      description: 'Максимальный размер изображения — 2 МБ',
      color: 'error'
    })
    return
  }

  // Мгновенный предпросмотр
  revokePreview()
  localPreviewUrl.value = URL.createObjectURL(file)
  uploading.value = true

  try {
    const formData = new FormData()
    formData.append('avatar', file)

    const response = await $fetch<{ success: boolean, avatarUrl: string }>(`/api/users/${props.userId}/avatar`, {
      method: 'POST',
      body: formData
    })

    toast.add({
      title: 'Успешно',
      description: 'Аватар обновлен',
      color: 'success'
    })

    emit('updated', response.avatarUrl)
  } catch (err: any) {
    console.error('[AvatarUpload] Ошибка:', err)
    revokePreview()
    toast.add({
      title: 'Ошибка загрузки',
      description: err.data?.message || 'Не удалось загрузить аватар на сервер',
      color: 'error'
    })
  } finally {
    uploading.value = false
    if (fileInputRef.value) fileInputRef.value.value = ''
  }
}

// Освобождаем память при размонтировании
onUnmounted(() => {
  revokePreview()
})
</script>

<template>
  <div class="relative inline-block">
    <!-- Кликабельный аватар (режим редактирования) -->
    <button
      v-if="canEdit"
      type="button"
      class="relative group rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
      :disabled="uploading"
      @click="triggerFileInput"
    >
      <div class="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden border border-gray-200 dark:border-gray-700">
        <img
          v-if="displayAvatarUrl"
          :src="displayAvatarUrl"
          alt="User avatar"
          class="w-full h-full object-cover"
        >
        <UIcon
          v-else
          name="i-heroicons-user"
          class="w-8 h-8 text-gray-400 dark:text-gray-500"
        />
      </div>

      <!-- Оверлей при наведении/загрузке -->
      <div
        class="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center transition-opacity"
        :class="uploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'"
      >
        <UIcon
          v-if="!uploading"
          name="i-heroicons-camera"
          class="w-6 h-6 text-white"
        />
        <UIcon
          v-else
          name="i-heroicons-arrow-path"
          class="w-6 h-6 text-white animate-spin"
        />
      </div>
    </button>

    <!-- Обычный аватар (только просмотр) -->
    <div
      v-else
      class="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden border border-gray-200 dark:border-gray-700"
    >
      <img
        v-if="avatarUrl"
        :src="avatarUrl"
        alt="User avatar"
        class="w-full h-full object-cover"
      >
      <UIcon
        v-else
        name="i-heroicons-user"
        class="w-8 h-8 text-gray-400 dark:text-gray-500"
      />
    </div>

    <!-- Скрытый input -->
    <input
      ref="fileInputRef"
      type="file"
      accept="image/jpeg,image/png,image/webp"
      class="hidden"
      @change="handleFileSelect"
    >
  </div>
</template>
