<script setup lang="ts">
import { useAuthSessionStore } from '~/stores/auth/session'

defineProps<{
  menuItems: Array<{ label: string; to: string; icon: string }>
  title?: string
}>()

const authStore = useAuthSessionStore()
const isMobileMenuOpen = ref(false)
const route = useRoute()

function isLinkActive(linkTo: string): boolean {
  return route.fullPath === linkTo || (route.path === linkTo && !route.query.tab)
}

async function onLogout() {
  await handleLogout()
  isMobileMenuOpen.value = false
}
</script>

<template>
  <div
    class="min-h-screen flex text-neutral-900 dark:text-neutral-100 transition-colors duration-200 bg-slate-200 dark:bg-neutral-950"
  >
    <!-- 1. Десктопный сайдбар слева -->
    <aside class="hidden lg:flex flex-col w-64 border-r border-black/5 dark:border-white/10 bg-white/75 dark:bg-neutral-900/75 backdrop-blur-md shrink-0 fixed inset-y-0 z-30 shadow-sm">
      <!-- Логотип -->
      <div class="h-16 px-6 flex items-center border-b border-black/5 dark:border-white/10">
        <AppLogo />
      </div>

      <!-- Навигационное меню -->
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
            ? 'bg-orange-500/15 text-orange-600 dark:text-orange-400 font-semibold shadow-xs'
            : 'text-neutral-600 dark:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/5 hover:text-neutral-900 dark:hover:text-white'"
        >
          <!-- Активный маркер слева (фирменный оранжевый) -->
          <span
            v-if="isLinkActive(link.to)"
            class="absolute left-0 top-2 bottom-2 w-1 bg-orange-500 rounded-r-full"
          />

          <UIcon
            :name="link.icon"
            class="w-5 h-5 shrink-0 transition-colors"
            :class="isLinkActive(link.to)
              ? 'text-orange-500 dark:text-orange-400'
              : 'text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-700 dark:group-hover:text-neutral-300'"
          />
          <span>{{ link.label }}</span>
        </NuxtLink>
      </div>

      <!-- Нижняя часть сайдбара: Профиль и выход -->
      <div class="p-4 border-t border-black/5 dark:border-white/10 space-y-3 bg-slate-100/50 dark:bg-neutral-950/40">
        <UserProfileBadge
          v-if="authStore.user"
          :user-name="authStore.user.user_name"
          :role-name="authStore.roleName"
          :avatar-url="authStore.user.avatar_path"
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
      <header class="sticky top-0 z-20 h-16 bg-white/65 dark:bg-neutral-900/65 backdrop-blur-md border-b border-black/5 dark:border-white/10 px-4 sm:px-8 flex items-center justify-between gap-4">

        <div class="flex items-center lg:hidden min-w-0 -ml-4.5">
          <div class="truncate">
            <AppLogo />
          </div>
        </div>

        <!-- Заголовок с оранжевым индикатором -->
        <div class="hidden lg:flex items-center gap-2.5 text-sm font-semibold text-neutral-700 dark:text-neutral-200">
          <span class="inline-block w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(224,76,42,0.6)]" />
          <span>{{ title || 'Панель управления системой' }}</span>
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
              :user-name="authStore.user.user_name"
              :role-name="authStore.roleName"
              :avatar-url="authStore.user.avatar_path"
              to="/profile"
              @click="isMobileMenuOpen = false"
            />

            <nav class="space-y-1.5">
              <NuxtLink
                v-for="link in menuItems"
                :key="link.to"
                :to="link.to"
                class="flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all group"
                :class="isLinkActive(link.to)
                  ? 'bg-orange-500/15 text-orange-600 dark:text-orange-400 font-semibold shadow-xs'
                  : 'text-neutral-700 dark:text-neutral-200 hover:bg-black/5 dark:hover:bg-white/5'"
                @click="isMobileMenuOpen = false"
              >
                <UIcon
                  :name="link.icon"
                  class="w-5 h-5 shrink-0 transition-colors"
                  :class="isLinkActive(link.to)
                    ? 'text-orange-500 dark:text-orange-400'
                    : 'text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-700 dark:group-hover:text-neutral-300'"
                />
                <span>{{ link.label }}</span>
              </NuxtLink>
            </nav>
          </div>

          <div class="pt-4 border-t border-black/5 dark:border-white/15 space-y-3">
            <div class="flex items-center justify-between px-3 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10">
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
