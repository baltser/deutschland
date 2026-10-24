<!-- app/components/AppSidebarLayoutShell.vue -->
<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

defineProps<{
  menuItems: Array<{ label: string; to: string; icon: string }>
  title?: string
}>()

const authStore = useAuthStore()
const isMobileMenuOpen = ref(false)
const route = useRoute()

// Функция для точной проверки активности с учетом query-параметров (?tab=...)
function isLinkActive(linkTo: string): boolean {
  return route.fullPath === linkTo || (route.path === linkTo && !route.query.tab)
}

async function onLogout() {
  isMobileMenuOpen.value = false
  await authStore.logout()
}
</script>

<template>
  <div class="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex text-neutral-900 dark:text-neutral-100">

    <!-- 1. Десктопный сайдбар слева -->
    <aside class="hidden lg:flex flex-col w-64 border-r border-default bg-[var(--ui-bg)] shrink-0 fixed inset-y-0 z-30">
      <!-- Логотип -->
      <div class="h-16 px-6 flex items-center border-b border-default">
        <AppLogo />
      </div>

      <!-- Навигационное меню с выразительными стилями -->
      <div class="flex-1 px-4 py-6 overflow-y-auto space-y-1.5">
        <p class="px-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-2">
          Навигация
        </p>

        <NuxtLink
          v-for="link in menuItems"
          :key="link.to"
          :to="link.to"
          class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group relative"
          :class="isLinkActive(link.to)
            ? 'bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 font-semibold shadow-xs'
            : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/70 hover:text-neutral-900 dark:hover:text-white'"
        >
          <UIcon
            :name="link.icon"
            class="w-5 h-5 shrink-0 transition-colors"
            :class="isLinkActive(link.to)
              ? 'text-primary-600 dark:text-primary-400'
              : 'text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-700 dark:group-hover:text-neutral-200'"
          />
          <span>{{ link.label }}</span>
        </NuxtLink>
      </div>

      <!-- Нижняя часть сайдбара: Профиль и выход -->
      <div class="p-4 border-t border-default space-y-3 bg-neutral-50/50 dark:bg-neutral-900/30">
        <UserProfileBadge
          v-if="authStore.user"
          :user-name="authStore.user?.user_name"
          :role-name="authStore.roleName"
          :avatar-url="authStore.user?.avatar_path"
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

        <div class="flex items-center lg:hidden min-w-0">
          <div class="truncate">
            <AppLogo />
          </div>
        </div>

        <div class="hidden lg:block text-sm font-medium text-neutral-500">
          {{ title || 'Панель управления системой' }}
        </div>

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
            <UserProfileBadge
              v-if="authStore.user"
              :user-name="authStore.user?.user_name"
              :role-name="authStore.roleName"
              :avatar-url="authStore.user?.avatar_path"
              to="/profile"
              @click="isMobileMenuOpen = false"
            />

            <!-- Навигационные ссылки для мобильного меню -->
            <nav class="space-y-1.5">
              <NuxtLink
                v-for="link in menuItems"
                :key="link.to"
                :to="link.to"
                class="flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all group"
                :class="isLinkActive(link.to)
                  ? 'bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 font-semibold shadow-xs'
                  : 'text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800/80 active:bg-neutral-200 dark:active:bg-neutral-800'"
                @click="isMobileMenuOpen = false"
              >
                <UIcon
                  :name="link.icon"
                  class="w-5 h-5 shrink-0 transition-colors"
                  :class="isLinkActive(link.to)
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-700 dark:group-hover:text-neutral-200'"
                />
                <span>{{ link.label }}</span>
              </NuxtLink>
            </nav>
          </div>

          <!-- Нижний блок -->
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
