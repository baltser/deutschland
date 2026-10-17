<script setup lang="ts">
// Используем defineModel() для двустороннего связывания v-model
const model = defineModel<string>({ default: '' })

defineProps<{
  placeholder?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  disabled?: boolean
  loading?: boolean
}>()

const isEmail = (val: string): boolean => val.includes('@')

const isPhone = (val: string): boolean => {
  if (!val || val === '+') return false
  return /^[\d+]/.test(val)
}

const formatPhone = (val: string): string => {
  let cleaned = val.replace(/\D/g, '')
  if (cleaned.length > 11) cleaned = cleaned.slice(0, 11)
  if (cleaned.startsWith('8') && cleaned.length === 11) {
    cleaned = '7' + cleaned.slice(1)
  }

  if (cleaned.length > 0) {
    let result = '+7'
    if (cleaned.length > 1) result += ` (${cleaned.slice(1, Math.min(4, cleaned.length))}`
    if (cleaned.length > 4) result += `) ${cleaned.slice(4, Math.min(7, cleaned.length))}`
    if (cleaned.length > 7) result += `-${cleaned.slice(7, Math.min(9, cleaned.length))}`
    if (cleaned.length > 9) result += `-${cleaned.slice(9, 11)}`
    return result
  }
  return cleaned
}

// Вычисляем динамическую иконку в зависимости от того, что вводит пользователь
const currentIcon = computed(() => {
  if (isEmail(model.value)) return 'i-lucide-mail'
  if (isPhone(model.value)) return 'i-lucide-phone'
  return 'i-lucide-user'
})

const handleInput = (value: string) => {
  if (isEmail(value) || (value.includes('@') && !isPhone(value))) {
    model.value = value
    return
  }

  if (isPhone(value) || value === '+') {
    model.value = formatPhone(value)
    return
  }

  model.value = value
}

// Вспомогательная утилита для очистки номера от маски перед отправкой на бэкенд
const cleanPhone = (val: string): string => {
  const cleaned = val.replace(/\D/g, '')
  if (cleaned.startsWith('8') && cleaned.length === 11) {
    return '7' + cleaned.slice(1)
  }
  return cleaned
}

defineExpose({
  cleanPhone,
  isEmail: computed(() => isEmail(model.value))
})
</script>

<template>
  <UInput
    :model-value="model"
    :placeholder="placeholder || 'Email или +7 (999) 000-00-00'"
    :icon="currentIcon"
    :size="size"
    :disabled="disabled"
    :loading="loading"
    class="w-full"
    @update:model-value="handleInput"
  />
</template>
