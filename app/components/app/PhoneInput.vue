<script setup lang="ts">
import { formatPhone } from '~/utils/phone'

// Современный двусторонний v-model в Vue 3.4+
const modelValue = defineModel<string>({ default: '' })

defineProps<{
  label?: string
  name?: string
  required?: boolean
  placeholder?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  icon?: string
  disabled?: boolean
}>()

function handleInput(value: string | number) {
  modelValue.value = formatPhone(String(value))
}
</script>

<template>
  <UFormField :label="label" :name="name" :required="required">
    <UInput
      :model-value="modelValue"
      type="tel"
      :placeholder="placeholder || '+7 (999) 000-00-00'"
      :icon="icon || 'i-lucide-phone'"
      :size="size || 'lg'"
      :disabled="disabled"
      class="w-full"
      @update:model-value="handleInput"
    />
  </UFormField>
</template>
