<script setup lang="ts">
defineProps<{
  modelValue: string
  isSubmitting: boolean
}>()

defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'submit'): void
}>()
</script>

<template>
  <div class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm space-y-4">
    <h2 class="text-base font-semibold text-neutral-900 dark:text-white">Добавить новый адрес</h2>

    <form class="flex flex-col sm:flex-row gap-3" @submit.prevent="$emit('submit')">
      <UInput
        :model-value="modelValue"
        placeholder="Например: г. Франкфурт, ул. Штрассе, д. 5"
        icon="i-lucide-map-pin"
        class="flex-1"
        size="lg"
        @update:model-value="(val) => $emit('update:modelValue', val)"
      />
      <UButton
        type="submit"
        color="primary"
        size="lg"
        :loading="isSubmitting"
        icon="i-lucide-plus"
      >
        Добавить адрес
      </UButton>
    </form>
  </div>
</template>
