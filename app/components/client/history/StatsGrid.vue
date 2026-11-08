<script setup lang="ts">
import type { HistoryStats } from '~/stores/client/history'

defineProps<{
  stats: HistoryStats
}>()
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
    <!-- 1. Всего записей (Синий/Основной акцент) -->
    <div
class="relative overflow-hidden p-5 rounded-3xl
                bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md
                border border-slate-200/80 dark:border-neutral-800
                shadow-lg shadow-slate-200/40 dark:shadow-black/30
                hover:shadow-xl transition-all duration-300 space-y-1 group
                border-t-4 border-t-primary-500">

      <!-- Фоновый декоративный светящийся градиент -->
      <div class="absolute -right-6 -bottom-6 w-28 h-28 bg-primary-500/15 dark:bg-primary-500/10 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />

      <div class="flex items-center justify-between text-slate-500 dark:text-neutral-400 text-xs font-semibold">
        <span>Всего записей в архиве</span>
        <div class="p-2 rounded-xl bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-primary-900/50 shadow-xs">
          <UIcon name="i-lucide-file-text" class="w-4 h-4" />
        </div>
      </div>
      <div class="text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
        {{ stats.total }}
      </div>
      <p class="text-[11px] text-slate-500 dark:text-neutral-400 font-medium">Зафиксированных сессий</p>
    </div>

    <!-- 2. Истекли по таймеру (Изумрудный/Успешный акцент) -->
    <div
class="relative overflow-hidden p-5 rounded-3xl
                bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md
                border border-slate-200/80 dark:border-neutral-800
                shadow-lg shadow-slate-200/40 dark:shadow-black/30
                hover:shadow-xl transition-all duration-300 space-y-1 group
                border-t-4 border-t-emerald-500">

      <!-- Фоновый декоративный светящийся градиент -->
      <div class="absolute -right-6 -bottom-6 w-28 h-28 bg-emerald-500/15 dark:bg-emerald-500/10 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />

      <div class="flex items-center justify-between text-slate-500 dark:text-neutral-400 text-xs font-semibold">
        <span>Истекли по таймеру</span>
        <div class="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50 shadow-xs">
          <UIcon name="i-lucide-clock" class="w-4 h-4" />
        </div>
      </div>
      <div class="text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
        {{ stats.expired }}
      </div>
      <p class="text-[11px] text-slate-500 dark:text-neutral-400 font-medium">Автоматически завершены</p>
    </div>

    <!-- 3. Отозваны вручную (Янтарный/Предупреждающий акцент) -->
    <div
class="relative overflow-hidden p-5 rounded-3xl
                bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md
                border border-slate-200/80 dark:border-neutral-800
                shadow-lg shadow-slate-200/40 dark:shadow-black/30
                hover:shadow-xl transition-all duration-300 space-y-1 group
                border-t-4 border-t-amber-500">

      <!-- Фоновый декоративный светящийся градиент -->
      <div class="absolute -right-6 -bottom-6 w-28 h-28 bg-amber-500/15 dark:bg-amber-500/10 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />

      <div class="flex items-center justify-between text-slate-500 dark:text-neutral-400 text-xs font-semibold">
        <span>Отозваны вручную</span>
        <div class="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50 shadow-xs">
          <UIcon name="i-lucide-user-x" class="w-4 h-4" />
        </div>
      </div>
      <div class="text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
        {{ stats.deleted }}
      </div>
      <p class="text-[11px] text-slate-500 dark:text-neutral-400 font-medium">Досрочно отмененные</p>
    </div>
  </div>
</template>
