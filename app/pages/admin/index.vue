<script setup lang="ts">
definePageMeta({ layout: 'admin' })

useSeoMeta({
  title: 'Панель управления',
  description: 'Главный дашборд администратора системы'
})
</script>

<template>
  <div class="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
    <!-- Шапка дашборда -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h1 class="text-2xl font-bold text-neutral-900 dark:text-white">Панель управления</h1>
        <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Центр администрирования объектов, персонала и настроек</p>
      </div>

    </div>

    <!-- Основные разделы (Карточки навигации) -->
    <div>
      <h2 class="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Основные разделы</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">

        <!-- Карточка 1: Адреса и клиенты -->
        <div
          class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm hover:border-amber-500 dark:hover:border-amber-500 transition-all cursor-pointer flex flex-col justify-between space-y-6 group"
          @click="navigateTo('/admin/addresses')"
        >
          <div class="flex items-center gap-4">
            <div class="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
              <UIcon name="i-lucide-map-pin" class="w-7 h-7" />
            </div>
            <div>
              <h3 class="font-semibold text-neutral-900 dark:text-white text-base">Адреса и клиенты</h3>
              <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">Объекты и жильцы</p>
            </div>
          </div>
          <div class="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-neutral-800/80 text-sm">
            <span class="text-neutral-600 dark:text-neutral-400">Перейти к списку</span>
            <UIcon name="i-lucide-arrow-right" class="w-4 h-4 text-amber-500 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        <!-- Карточка 2: Персонал (Сотрудники) -->
        <div
          class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm hover:border-primary-500 dark:hover:border-primary-500 transition-all cursor-pointer flex flex-col justify-between space-y-6 group"
          @click="navigateTo('/admin/users')"
        >
          <div class="flex items-center gap-4">
            <div class="p-3.5 rounded-xl bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 group-hover:scale-110 transition-transform">
              <UIcon name="i-lucide-users" class="w-7 h-7" />
            </div>
            <div>
              <h3 class="font-semibold text-neutral-900 dark:text-white text-base">Персонал</h3>
              <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">Админы и монтажники</p>
            </div>
          </div>
          <div class="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-neutral-800/80 text-sm">
            <span class="text-neutral-600 dark:text-neutral-400">Управление командой</span>
            <UIcon name="i-lucide-arrow-right" class="w-4 h-4 text-primary-500 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        <!-- Карточка 3: Шаблоны писем -->
        <div
          class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm hover:border-emerald-500 dark:hover:border-emerald-500 transition-all cursor-pointer flex flex-col justify-between space-y-6 group"
          @click="navigateTo('/admin/system/email-templates')"
        >
          <div class="flex items-center gap-4">
            <div class="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
              <UIcon name="i-lucide-mail" class="w-7 h-7" />
            </div>
            <div>
              <h3 class="font-semibold text-neutral-900 dark:text-white text-base">Шаблоны писем</h3>
              <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">Email-уведомления</p>
            </div>
          </div>
          <div class="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-neutral-800/80 text-sm">
            <span class="text-neutral-600 dark:text-neutral-400">Системные настройки</span>
            <UIcon name="i-lucide-arrow-right" class="w-4 h-4 text-emerald-500 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

      </div>
    </div>
  </div>
</template>
