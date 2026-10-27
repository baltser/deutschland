<script setup lang="ts">
import { useAuthSessionStore } from '~/stores/auth/session'

const authStore = useAuthSessionStore()
const isMenuOpen = ref(false)

// Динамические ссылки навигации на основе геттеров из стора сессии
const navLinks = computed(() => {
  const links = [
    { label: 'Главная', to: '/', icon: 'i-lucide-home' },
    { label: 'О нас', to: '/about', icon: 'i-lucide-info' },
    { label: 'Услуги', to: '/services', icon: 'i-lucide-briefcase' }
  ]

  if (authStore.isAdmin) {
    links.push({ label: 'Админ панель', to: '/admin', icon: 'i-lucide-users' })
  }

  return links
})

async function onLogout() {
  await handleLogout()
  isMenuOpen.value = false
}
</script>

<template>
  <header class="sticky top-0 z-40 bg-[var(--ui-bg)]/85 backdrop-blur border-b border-default">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
      <AppLogo />

      <!-- Навигация по центру/слева -->
      <nav class="hidden md:flex items-center gap-1">
        <UNavigationMenu :items="navLinks" />
      </nav>

      <!-- Правая часть шапки -->
      <div class="flex items-center gap-2">
        <!-- Десктопный блок действий -->
        <div class="hidden md:flex items-center gap-2">
          <UColorModeButton />

          <!-- Авторизованный пользователь -->
          <template v-if="authStore.isAuthenticated && authStore.user">
            <UserProfileBadge
              :user-name="authStore.user.user_name"
              :role-name="authStore.roleName"
              :avatar-url="authStore.user.avatar_path"
              to="/profile"
            />

            <UButton
              color="neutral"
              variant="ghost"
              icon="i-lucide-log-out"
              size="sm"
              title="Выйти"
              @click="onLogout"
            >
              Выйти
            </UButton>
          </template>

          <!-- Гость -->
          <template v-else>
            <UButton to="/auth/login" variant="ghost" color="neutral" size="sm" icon="i-lucide-log-in">
              Войти
            </UButton>
            <UButton to="/auth/register" color="primary" size="sm" icon="i-lucide-user-plus">
              Регистрация
            </UButton>
          </template>
        </div>

        <!-- Кнопка открытия мобильного меню -->
        <UButton
          icon="i-lucide-menu"
          color="neutral"
          variant="ghost"
          class="md:hidden"
          aria-label="Открыть меню"
          @click="isMenuOpen = true"
        />
      </div>
    </div>
  </header>

  <!-- Мобильное меню (Slideover) -->
  <USlideover v-model:open="isMenuOpen" title="Меню навигации">
    <template #body>
      <div class="p-4 flex flex-col justify-between h-full gap-6">
        <div class="space-y-6">
          <UNavigationMenu
            :items="navLinks"
            orientation="vertical"
            @click="isMenuOpen = false"
          />

          <div class="pt-4 border-t border-default flex items-center justify-between px-2">
            <span class="text-sm font-medium text-neutral-600 dark:text-neutral-400">Тема оформления</span>
            <UColorModeButton />
          </div>
        </div>

        <div class="pt-4 border-t border-default space-y-3">
          <template v-if="authStore.isAuthenticated && authStore.user">
            <UserProfileBadge
              :user-name="authStore.user.user_name"
              :role-name="authStore.roleName"
              :avatar-url="authStore.user.avatar_path"
              to="/profile"
              @click="isMenuOpen = false"
            />
            <UButton
              color="error"
              variant="subtle"
              icon="i-lucide-log-out"
              block
              @click="onLogout"
            >
              Выйти из аккаунта
            </UButton>
          </template>

          <template v-else>
            <div class="grid grid-cols-2 gap-2">
              <UButton
                to="/auth/login"
                variant="outline"
                color="neutral"
                block
                icon="i-lucide-log-in"
                @click="isMenuOpen = false"
              >
                Войти
              </UButton>
              <UButton
                to="/auth/register"
                color="primary"
                block
                icon="i-lucide-user-plus"
                @click="isMenuOpen = false"
              >
                Регистрация
              </UButton>
            </div>
          </template>
        </div>
      </div>
    </template>
  </USlideover>
</template>
