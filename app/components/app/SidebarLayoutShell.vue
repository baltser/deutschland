<script setup lang="ts">

defineProps<{
  menuItems: Array<{ label: string; to: string; icon: string }>
  title?: string
}>()

const { user, clear } = useUserSession()
const isMobileMenuOpen = ref(false)

async function onLogout() {
  await clear()
  await navigateTo('/login')
}
</script>

<template>
  <div class="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex text-neutral-900 dark:text-neutral-100">

    <!-- 1. Десктопный сайдбар слева -->
    <aside class="hidden lg:flex flex-col w-64 border-r border-default bg-[var(--ui-bg)] shrink-0 fixed inset-y-0 z-30">
      <!-- Логотип в сайдбаре -->
      <div class="h-16 px-6 flex items-center border-b border-default">
        <AppLogo />
      </div>

      <!-- Навигационное меню (вертикальное) -->
      <div class="flex-1 px-4 py-6 overflow-y-auto">
        <UNavigationMenu :items="menuItems" orientation="vertical" />
      </div>

      <!-- Нижняя часть сайдбара: Профиль и выход -->
      <div class="p-4 border-t border-default space-y-3">
        <UserProfileBadge
          :user-name="user?.user_name"
          :role-name="user?.role_name"
          to="/profile"
        />
        <UButton
          color="error"
          variant="subtle"
          icon="i-lucide-log-out"
          block
          size="sm"
          @click="onLogout"
        >
          Выйти
        </UButton>
      </div>
    </aside>

    <!-- 2. Основная область контента -->
    <div class="flex-1 flex flex-col lg:pl-64">

      <!-- Верхняя мини-панель -->
      <header class="sticky top-0 z-20 h-16 bg-[var(--ui-bg)]/80 backdrop-blur border-b border-default px-4 sm:px-8 flex items-center justify-between gap-2">

        <!-- Логотип для мобильных -->
        <div class="flex items-center lg:hidden min-w-0">
          <div class="truncate">
            <AppLogo />
          </div>
        </div>

        <!-- Заголовок для десктопа -->
        <div class="hidden lg:block text-sm font-medium text-neutral-500">
          {{ title || 'Панель управления системой' }}
        </div>

        <!-- Правая часть: Переключатель темы и кнопка мобильного меню справа -->
        <div class="flex items-center gap-2 shrink-0">
          <UColorModeButton />

          <UButton
            icon="i-lucide-menu"
            color="neutral"
            variant="ghost"
            aria-label="Меню"
            class="lg:hidden"
            @click="isMobileMenuOpen = true"
          />
        </div>
      </header>

      <!-- Страницы -->
      <main class="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
        <slot />
      </main>
    </div>

    <!-- 3. Мобильное меню (Slideover) -->
    <USlideover v-model:open="isMobileMenuOpen">
      <template #header>
        <div class="flex items-center justify-between w-full py-1">
          <span class="font-semibold text-base">Меню управления</span>
        </div>
      </template>

      <template #body>
        <div class="flex flex-col justify-between h-full gap-6 py-2">

          <div class="space-y-6">
            <!-- Карточка текущего пользователя вверху меню -->
            <div v-if="user" class="p-3 rounded-2xl bg-neutral-100 dark:bg-neutral-900 border border-default flex items-center gap-3">
              <div class="p-2.5 rounded-xl bg-primary-500/10 text-primary shrink-0">
                <UIcon name="i-lucide-user" class="w-5 h-5" />
              </div>
              <div class="overflow-hidden">
                <p class="font-semibold text-sm truncate text-neutral-900 dark:text-white">
                  {{ user.user_name || user.name }}
                </p>
                <p class="text-xs text-primary font-medium uppercase tracking-wider mt-0.5">
                  {{ user.role_name }}
                </p>
              </div>
            </div>

            <!-- Навигационные ссылки -->
            <nav class="space-y-1">
              <NuxtLink
                v-for="link in menuItems"
                :key="link.to"
                :to="link.to"
                class="flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors text-neutral-700 dark:text-neutral-200"
                @click="isMobileMenuOpen = false"
              >
                <UIcon :name="link.icon" class="w-5 h-5 text-primary shrink-0" />
                <span>{{ link.label }}</span>
              </NuxtLink>
            </nav>
          </div>

          <!-- Нижний блок: Переключатель темы и кнопка выхода -->
          <div class="pt-4 border-t border-default space-y-3">
            <div class="flex items-center justify-between px-3 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900/50 border border-default">
              <span class="text-sm font-medium text-neutral-600 dark:text-neutral-400">Тема оформления</span>
              <UColorModeButton />
            </div>

            <UButton
              color="error"
              variant="subtle"
              icon="i-lucide-log-out"
              block
              size="lg"
              @click="onLogout"
            >
              Выйти из аккаунта
            </UButton>
          </div>

        </div>
      </template>
    </USlideover>

  </div>
</template>
