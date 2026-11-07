<script setup lang="ts">
import type { HistoryStats } from '~/stores/client/history'

defineProps<{
  stats: HistoryStats
}>()
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
    <!-- Всего записей -->
    <div class="p-5 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-2xs space-y-1">
      <div class="flex items-center justify-between text-neutral-400 text-xs font-medium">
        <span>Всего записей в архиве</span>
        <UIcon name="i-lucide-file-text" class="w-4 h-4 text-primary-500" />
      </div>
      <div class="text-2xl font-bold text-neutral-900 dark:text-white font-mono">
        {{ stats.total }}
      </div>
      <p class="text-[11px] text-neutral-500">Зафиксированных сессий</p>
    </div>

    <!-- Истекли по TTL -->
    <div class="p-5 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-2xs space-y-1">
      <div class="flex items-center justify-between text-neutral-400 text-xs font-medium">
        <span>Истекли по таймеру</span>
        <UIcon name="i-lucide-clock" class="w-4 h-4 text-emerald-500" />
      </div>
      <div class="text-2xl font-bold text-neutral-900 dark:text-white font-mono">
        {{ stats.expired }}
      </div>
      <p class="text-[11px] text-neutral-500">Автоматически завершены</p>
    </div>

    <!-- Отозваны вручную -->
    <div class="p-5 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-2xs space-y-1">
      <div class="flex items-center justify-between text-neutral-400 text-xs font-medium">
        <span>Отозваны вручную</span>
        <UIcon name="i-lucide-user-x" class="w-4 h-4 text-amber-500" />
      </div>
      <div class="text-2xl font-bold text-neutral-900 dark:text-white font-mono">
        {{ stats.deleted }}
      </div>
      <p class="text-[11px] text-neutral-500">Досрочно отмененные</p>
    </div>
  </div>
</template>
