<script setup lang="ts">
defineProps<{
  pending?: boolean
}>()

defineEmits<{
  refresh: []
}>()
</script>

<template>
  <div
    class="relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6
          bg-slate-100/90 border border-slate-200/90 shadow-lg shadow-slate-200/40 backdrop-blur-md
           dark:bg-neutral-900/90 dark:border-neutral-800/90 dark:shadow-2xl dark:shadow-black/40
           rounded-3xl transition-all duration-300"
  >
    <!-- Фоновое изображение с адаптивным градиентным наложением -->
    <div class="absolute inset-0 pointer-events-none z-0">
      <img
        src="/images/logo-bg.jpeg"
        alt="Logo Background"
        class="w-full h-full object-cover opacity-30 dark:opacity-35 scale-105 mix-blend-multiply dark:mix-blend-normal"
      >
      <!-- Градиентное затемнение: мягкое молочное слева в Light Mode и графитовое в Dark Mode -->
      <div class="absolute inset-0 bg-gradient-to-r from-slate-100/95 via-slate-100/60 to-transparent dark:from-neutral-950/95 dark:via-neutral-900/50 dark:to-transparent" />
    </div>

    <!-- Текстовый блок -->
    <div class="relative z-10">
      <div class="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400 mb-1">
        <span class="relative flex h-2 w-2">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"/>
          <span class="relative inline-flex rounded-full h-2 w-2 bg-primary-500"/>
        </span>
        Система контроля проезда
      </div>
      <h1 class="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
        Мои объекты & Устройства
      </h1>
      <p class="text-xs text-slate-600 dark:text-neutral-300 mt-1 max-w-lg font-medium">
        Выбирайте оборудование прямо на карточке объекта и управляйте гостевыми пропусками.
      </p>
    </div>

    <!-- Кнопка обновления -->
    <UButton
      variant="outline"
      color="neutral"
      size="md"
      icon="i-lucide-refresh-cw"
      :loading="pending"
      class="relative z-10 self-start sm:self-auto bg-white/80 dark:bg-neutral-800/80 hover:bg-white dark:hover:bg-neutral-800 border-slate-300/80 dark:border-neutral-700 text-slate-800 dark:text-neutral-200 shadow-xs backdrop-blur-xs transition-all active:scale-95 rounded-xl font-semibold"
      @click="$emit('refresh')"
    >
      Обновить данные
    </UButton>
  </div>
</template>
