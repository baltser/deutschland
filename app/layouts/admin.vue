<script setup lang="ts">
const route = useRoute()
const { user, clear: clearSession } = useUserSession()
const router = useRouter()

const navigationLinks = [
  { label: 'Обзор', icon: 'i-lucide-layout-dashboard', to: '/admin' },
  { label: 'Персонал (Сотрудники)', icon: 'i-lucide-users', to: '/admin/users' },
  { label: 'Клиенты и Адреса', icon: 'i-lucide-map-pin', to: '/admin/addresses' },
]

async function handleLogout() {
  await clearSession()
  await router.push('/auth/login')
}
</script>

<template>
  <div class="h-screen w-full flex overflow-hidden bg-neutral-100 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
    <!-- Сайдбар (исправлен конфликт классов hidden и flex через md:flex) -->
<!--    <aside class="w-64 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800/80 flex flex-col justify-between hidden md:flex shrink-0 h-full">-->
    <aside class="w-64 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800/80 flex-col justify-between hidden md:flex shrink-0 h-full">
      <div>
        <div class="p-6 border-b border-neutral-200/60 dark:border-neutral-800/80">
          <h2 class="text-lg font-bold flex items-center gap-2 text-neutral-900 dark:text-white">
            <UIcon name="i-lucide-shield-alert" class="w-5 h-5 text-primary-500" />
            Админ-панель
          </h2>
          <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">Управление системой</p>
        </div>

        <nav class="p-4 space-y-1">
          <NuxtLink
            v-for="link in navigationLinks"
            :key="link.to"
            :to="link.to"
            class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
            :class="[
              route.path === link.to
                ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400 font-semibold'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/50'
            ]"
          >
            <UIcon :name="link.icon" class="w-5 h-5" />
            {{ link.label }}
          </NuxtLink>
        </nav>
      </div>

      <!-- Футер сайдбара с аватаром -->
      <div class="p-4 border-t border-neutral-200/60 dark:border-neutral-800/80 space-y-3">
        <div class="flex items-center gap-3 px-2">
          <div v-if="user?.user_id" class="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center font-semibold text-xs overflow-hidden">
            <!-- Убран слэш в конце img для соответствия правилам линтера -->
            <img v-if="user.avatar_path" :src="`/api/files/${user.avatar_path}`" class="w-full h-full object-cover">
            <span v-else>{{ (user.user_name?.[0] || 'К').toUpperCase() }}</span>
          </div>

          <div v-else class="w-9 h-9 rounded-full bg-primary-500/20 text-primary-600 flex items-center justify-center font-bold text-sm shrink-0">
            {{ user?.user_name?.[0]?.toUpperCase() || 'A' }}
          </div>

          <div class="overflow-hidden">
            <p class="text-xs font-semibold text-neutral-900 dark:text-white truncate">{{ user?.user_name || 'Администратор' }}</p>
            <p class="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">{{ user?.phone || user?.email }}</p>
          </div>
        </div>

        <div class="flex gap-2">
          <UButton
            to="/"
            variant="ghost"
            color="neutral"
            size="xs"
            icon="i-lucide-globe"
            class="flex-1 justify-center"
          >
            На сайт
          </UButton>
          <UButton
            variant="ghost"
            color="error"
            size="xs"
            icon="i-lucide-log-out"
            @click="handleLogout"
          >
            Выход
          </UButton>
        </div>
      </div>
    </aside>

    <!-- Правая область -->
    <div class="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
      <!-- Мобильный хедер -->
      <header class="md:hidden bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 p-4 flex justify-between items-center shrink-0">
        <h1 class="font-bold text-neutral-900 dark:text-white">Админ-панель</h1>
        <UButton to="/" variant="ghost" size="xs" icon="i-lucide-globe">На сайт</UButton>
      </header>

      <main class="flex-1 overflow-y-auto p-6 md:p-8">
        <slot />
      </main>
    </div>
  </div>
</template>
