<script setup lang="ts">
import { useToastNotifications } from '~/composables/useToast.ts'

interface Props {
  userId?: string | number
  avatarUrl?: string | null
  canEdit?: boolean
  size?: string
  immediateUpload?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  userId: undefined,
  avatarUrl: null,
  canEdit: false,
  size: 'w-16 h-16',
  immediateUpload: true
})

const emit = defineEmits<{
  (e: 'updated', newUrl: string): void
  (e: 'select-file', file: File): void
}>()

const { showSuccess, showError } = useToastNotifications()

const fileInputRef = ref<HTMLInputElement | null>(null)
const localPreviewUrl = ref<string>('')
const uploading = ref<boolean>(false)

// Актуальный URL аватара (локальное превью имеет приоритет)
const displayAvatarUrl = computed(() => localPreviewUrl.value || props.avatarUrl)

// Открытие диалога выбора файла
const triggerFileInput = () => {
  if (uploading.value) return
  fileInputRef.value?.click()
}

// Очистка объекта URL в памяти браузера
const revokePreview = () => {
  if (localPreviewUrl.value) {
    URL.revokeObjectURL(localPreviewUrl.value)
    localPreviewUrl.value = ''
  }
}

// Проверка валидности выбранного файла
const validateFile = (file: File): boolean => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    showError('Ошибка формата', 'Поддерживаются только форматы JPG, PNG и WEBP')
    return false
  }

  // Ограничение размера: 2 МБ
  const MAX_SIZE = 2 * 1024 * 1024
  if (file.size > MAX_SIZE) {
    showError('Файл слишком большой', 'Максимальный размер изображения — 2 МБ')
    return false
  }

  return true
}

// Обработка выбора файла
const handleFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  if (!validateFile(file)) {
    if (fileInputRef.value) fileInputRef.value.value = ''
    return
  }

  revokePreview()
  localPreviewUrl.value = URL.createObjectURL(file)

  // Режим отложенной загрузки (передаем файл наверх в форму)
  if (!props.immediateUpload) {
    emit('select-file', file)
    if (fileInputRef.value) fileInputRef.value.value = ''
    return
  }

  // Режим мгновенной загрузки через эндпоинт
  uploading.value = true
  try {
    const formData = new FormData()
    formData.append('avatar', file)

    const response = await $fetch<{ success: boolean; avatarUrl: string }>(`/api/profile/${props.userId}/avatar`, {
      method: 'POST',
      body: formData
    })

    showSuccess('Успешно', 'Аватар обновлен')

    emit('updated', response.avatarUrl)
  } catch (err: unknown) {
    console.error('[AvatarUpload] Ошибка:', err)
    revokePreview()

    const fetchError = err as { data?: { message?: string } }
    showError('Ошибка загрузки', fetchError.data?.message || 'Не удалось загрузить аватар на сервер')
  } finally {
    uploading.value = false
    if (fileInputRef.value) fileInputRef.value.value = ''
  }
}

onUnmounted(() => {
  revokePreview()
})
</script>

<template>
  <div class="relative inline-block">
    <!-- Кликабельный аватар (режим редактирования) -->
    <div
      v-if="canEdit"
      role="button"
      tabindex="0"
      aria-label="Изменить аватар"
      class="relative group rounded-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-transform active:scale-95"
      :class="{ 'opacity-60 pointer-events-none': uploading }"
      @click="triggerFileInput"
      @keydown.enter.space.prevent="triggerFileInput"
    >
      <div :class="[props.size, 'rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center overflow-hidden border border-neutral-200 dark:border-neutral-700']">
        <img
          v-if="displayAvatarUrl"
          :src="displayAvatarUrl"
          alt="User avatar"
          class="w-full h-full object-cover"
        >
        <UIcon
          v-else
          name="i-lucide-user"
          class="w-8 h-8 text-neutral-400 dark:text-neutral-500"
        />
      </div>

      <!-- Оверлей при наведении / загрузке -->
      <div
        class="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center transition-opacity"
        :class="uploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'"
      >
        <UIcon
          v-if="!uploading"
          name="i-lucide-camera"
          class="w-6 h-6 text-white"
        />
        <UIcon
          v-else
          name="i-lucide-loader-2"
          class="w-6 h-6 text-white animate-spin"
        />
      </div>
    </div>

    <!-- Обычный аватар (только просмотр) -->
    <div
      v-else
      :class="[props.size, 'rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center overflow-hidden border border-neutral-200 dark:border-neutral-700']"
    >
      <img
        v-if="avatarUrl"
        :src="avatarUrl"
        alt="User avatar"
        class="w-full h-full object-cover"
      >
      <UIcon
        v-else
        name="i-lucide-user"
        class="w-8 h-8 text-neutral-400 dark:text-neutral-500"
      />
    </div>

    <!-- Скрытый инпут для файлов -->
    <input
      ref="fileInputRef"
      type="file"
      accept="image/jpeg,image/png,image/webp"
      class="hidden"
      @change="handleFileSelect"
    >
  </div>
</template>
