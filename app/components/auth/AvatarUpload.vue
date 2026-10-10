<script setup lang="ts">
const props = defineProps<{
  modelValue: File | null
}>()

const emit = defineEmits<{
  'update:modelValue': [file: File | null]
}>()

const toast = useToast()
const fileInputRef = ref<HTMLInputElement | null>(null)
const previewUrl = ref<string>('')

function triggerSelect() {
  fileInputRef.value?.click()
}

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    toast.add({
      title: 'Недопустимый формат',
      description: 'Выберите JPG, PNG или WEBP',
      color: 'error'
    })
    return
  }

  // 2 МБ
  if (file.size > 2 * 1024 * 1024) {
    toast.add({
      title: 'Файл слишком большой',
      description: 'Максимальный размер аватара — 2 МБ',
      color: 'error'
    })
    return
  }

  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = URL.createObjectURL(file)
  emit('update:modelValue', file)
}

function removeAvatar() {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = ''
  emit('update:modelValue', null)
  if (fileInputRef.value) fileInputRef.value.value = ''
}

onUnmounted(() => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
})
</script>

<template>
  <div class="flex flex-col items-center justify-center py-2 space-y-2">
    <div class="relative group">
      <button
        type="button"
        class="w-20 h-20 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center overflow-hidden border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-primary transition-colors focus:outline-none"
        @click="triggerSelect"
      >
        <img
          v-if="previewUrl"
          :src="previewUrl"
          alt="Превью аватара"
          class="w-full h-full object-cover"
        >
        <div v-else class="flex flex-col items-center text-neutral-400">
          <UIcon name="i-lucide-camera" class="w-7 h-7" />
          <span class="text-[10px] mt-0.5 font-medium">Фото</span>
        </div>

        <div class="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <UIcon name="i-lucide-image-plus" class="w-6 h-6 text-white" />
        </div>
      </button>

      <button
        v-if="previewUrl"
        type="button"
        class="absolute -top-1 -right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-sm"
        title="Удалить фото"
        @click.stop="removeAvatar"
      >
        <UIcon name="i-lucide-x" class="w-3.5 h-3.5" />
      </button>
    </div>

    <p class="text-xs text-neutral-400">
      Аватар (необязательно, до 2 МБ)
    </p>

    <input
      ref="fileInputRef"
      type="file"
      accept="image/jpeg,image/png,image/webp"
      class="hidden"
      @change="handleFileChange"
    >
  </div>
</template>
