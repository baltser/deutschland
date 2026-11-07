<script setup lang="ts">
defineProps<{
  pending?: boolean
}>()

defineEmits<{
  refresh: []
}>()
</script>

<template>
  <div class="relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white dark:bg-neutral-900 rounded-3xl text-neutral-900 dark:text-white shadow-xl border border-neutral-200 dark:border-neutral-800 transition-colors">
    <!-- Фоновое изображение -->
    <div class="absolute inset-0 pointer-events-none z-0">
      <img
        src="/images/logo-bg.jpeg"
        alt="Logo Background"
        class="w-full h-full object-cover opacity-20 dark:opacity-40 scale-105"
      >
      <!-- Адаптивный градиент: светлый для Light Mode, темный для Dark Mode -->
      <div class="absolute inset-0 bg-gradient-to-r from-white/95 via-white/50 to-transparent dark:from-neutral-950/90 dark:via-neutral-900/40 dark:to-transparent"/>
    </div>

    <!-- Текстовый блок -->
    <div class="relative z-10">
      <div class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400 mb-1">
        <span class="w-2 h-2 rounded-full bg-primary-500 animate-ping"/>
        Система контроля проезда
      </div>
      <h1 class="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">Мои объекты & Устройства</h1>
      <p class="text-xs text-neutral-600 dark:text-neutral-300 mt-1 max-w-lg">
        Выбирайте оборудование прямо на карточке объекта и управляйте гостевыми пропусками.
      </p>
    </div>

    <!-- Кнопка обновления -->
    <UButton
      variant="subtle"
      color="neutral"
      size="md"
      icon="i-lucide-refresh-cw"
      :loading="pending"
      class="relative z-10 self-start sm:self-auto shadow-xs"
      @click="$emit('refresh')"
    >
      Обновить данные
    </UButton>
  </div>
</template>
