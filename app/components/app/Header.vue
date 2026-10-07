<script setup lang="ts">
const { loggedIn, user, clear } = useUserSession()
const isMenuOpen = ref(false)

const navLinks = computed(() => {
  const links = [
    { label: 'Главная', to: '/', icon: 'i-lucide-home' },
    { label: 'О нас', to: '/about', icon: 'i-lucide-info' },
    { label: 'Услуги', to: '/services', icon: 'i-lucide-briefcase' }
  ]

  if (loggedIn.value) {
    links.push({ label: 'Пользователи', to: '/users', icon: 'i-lucide-users' })
  }

  links.push({ label: 'Настройки', to: '/settings', icon: 'i-lucide-settings' })

  return links
})

async function onLogout() {
  await clear()
  isMenuOpen.value = false
  await navigateTo('/login')
}
</script>

<template>
  <header class="sticky top-0 z-40 bg-(--ui-bg)/80 backdrop-blur border-b border-(--ui-border)">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
      <NuxtLink to="/" class="font-bold text-xl tracking-tight flex items-center gap-2 hover:opacity-80 transition-opacity">
        <UIcon name="i-lucide-shield-check" class="w-6 h-6 text-primary" />
        <span>DNZ</span>
      </NuxtLink>

      <nav class="hidden md:flex items-center gap-1">
        <UNavigationMenu :items="navLinks" />
      </nav>

      <div class="flex items-center gap-2">
        <div class="hidden md:flex items-center gap-2">
          <template v-if="loggedIn && user">
            <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-(--ui-border)">
              <UIcon name="i-lucide-user" class="w-4 h-4 text-primary" />
              <span class="text-sm font-medium">{{ user.name }}</span>
              <UBadge size="xs" variant="subtle" color="primary" class="uppercase">
                {{ user.rule_name }}
              </UBadge>
            </div>

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

          <template v-else>
            <UButton to="/login" variant="ghost" color="neutral" size="sm" icon="i-lucide-log-in">
              Войти
            </UButton>
            <UButton to="/register" color="primary" size="sm" icon="i-lucide-user-plus">
              Регистрация
            </UButton>
          </template>
        </div>

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

  <USlideover v-model:open="isMenuOpen" title="Навигация">
    <template #body>
      <div class="p-4 flex flex-col justify-between h-full gap-6">
        <UNavigationMenu
          :items="navLinks"
          orientation="vertical"
          @click="isMenuOpen = false"
        />

        <div class="pt-4 border-t border-(--ui-border) space-y-3">
          <template v-if="loggedIn && user">
            <div class="flex items-center gap-3 px-2 py-1">
              <div class="p-2 rounded-full bg-primary-500/10 text-primary">
                <UIcon name="i-lucide-user" class="w-5 h-5" />
              </div>
              <div class="flex flex-col">
                <span class="font-medium text-sm">{{ user.name }}</span>
                <span class="text-xs text-neutral-500 dark:text-neutral-400">{{ user.email }}</span>
              </div>
            </div>

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
                to="/login"
                variant="outline"
                color="neutral"
                block
                icon="i-lucide-log-in"
                @click="isMenuOpen = false"
              >
                Войти
              </UButton>
              <UButton
                to="/register"
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
