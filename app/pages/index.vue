<script setup lang="ts">
// Описываем метаданные страницы для SEO
useSeoMeta({
  title: 'Главная панель',
  description: 'Обзор доступных функций и инструментов системы DNZ'
})

// Интерфейс для карточки функции
interface Feature {
  id: string
  title: string
  description: string
  icon: string
  to?: string
  badge?: string
  color?: 'primary' | 'neutral' | 'success' | 'warning'
  disabled?: boolean
}

const features: Feature[] = [
  {
    id: 'addres_domofon',
    title: 'Адреса. Домофоны',
    description: 'Доступ для монтажников к домофонам.',
    icon: 'i-lucide-dialpad',
    to: '/',
    badge: 'Новое',
    color: 'primary'
  },
  {
    id: 'users',
    title: 'Управление пользователями',
    description: 'Настройка ролей, прав доступа и просмотр активности участников проекта.',
    icon: 'i-lucide-user-cog',
    to: '/'
  },
  {
    id: 'dahua_kamera',
    title: 'Интеграции и API',
    description: 'Подключение к камерам фирмы Dahua.',
    icon: 'i-lucide-cctv',
    to: '/',
    badge: 'Beta',
    color: 'warning'
  },
  {
    id: 'logs',
    title: 'Журнал событий',
    description: 'Просмотр системных логов, истории изменений и уведомлений о сбоях.',
    icon: 'i-lucide-logs',
    to: '/'
  },
  {
    id: 'settings',
    title: 'Системные настройки',
    description: 'Конфигурация параметров приложения, локализации и интерфейса.',
    icon: 'i-lucide-settings-2',
    to: '/settings'
  },
  {
    id: 'add_number',
    title: 'Добавление номеров',
    description: 'Добавление номеров на камеры.',
    icon: 'i-lucide-hash',
    to: '/',
    disabled: true,
    badge: 'В разработке',
    color: 'neutral'
  }
]

</script>

<template>
  <div class="space-y-8">
    <!-- Заголовок страницы -->
    <div class="space-y-2">
      <h1 class="text-3xl font-bold tracking-tight">
        Возможности системы
      </h1>
      <p class="text-neutral-500 dark:text-neutral-400 max-w-2xl">
        Выберите нужный раздел для перехода к рабочим инструментам или управлению настройками.
      </p>
    </div>

    <!-- Сетка карточек -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <UCard
        v-for="feature in features"
        :key="feature.id"
        class="flex flex-col justify-between transition-all duration-200 hover:border-primary-500/50 hover:shadow-md"
        :class="{ 'opacity-60 pointer-events-none': feature.disabled }"
      >
        <!-- Шапка карточки: Иконка + Бейдж -->
        <template #header>
          <div class="flex items-center justify-between gap-2">
            <div class="p-2.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-primary-500 flex items-center justify-center">
              <UIcon :name="feature.icon" class="w-6 h-6 shrink-0" />
            </div>

            <UBadge
              v-if="feature.badge"
              :color="feature.color || 'neutral'"
              variant="subtle"
              size="sm"
            >
              {{ feature.badge }}
            </UBadge>
          </div>
        </template>

        <!-- Тело карточки: Название и описание -->
        <div class="space-y-2">
          <h2 class="text-lg font-semibold tracking-tight">
            {{ feature.title }}
          </h2>
          <p class="text-sm text-neutral-500 dark:text-neutral-400 line-clamp-3">
            {{ feature.description }}
          </p>
        </div>

        <!-- Подвал карточки: Кнопка перехода -->
        <template #footer>
          <div class="flex justify-end pt-2">
            <UButton
              v-if="feature.to && !feature.disabled"
              :to="feature.to"
              variant="ghost"
              color="primary"
              trailing-icon="i-lucide-arrow-right"
              size="sm"
            >
              Открыть
            </UButton>

            <span v-else class="text-xs text-neutral-400 italic">
              Недоступно
            </span>
          </div>
        </template>
      </UCard>
    </div>
  </div>
</template>
