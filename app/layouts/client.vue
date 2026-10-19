<script setup lang="ts">
const { user, clear } = useUserSession()

async function handleLogout() {
  await clear()
  await navigateTo('/auth/login')
}
</script>

<template>
  <div class="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col text-neutral-900 dark:text-neutral-100">
    <!-- Шапка личного кабинета клиента -->
    <header class="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-6 py-4 flex items-center justify-between shadow-xs">
      <div class="flex items-center gap-3">
        <div class="p-2.5 rounded-xl bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400">
          <UIcon name="i-lucide-home" class="w-5 h-5" />
        </div>
        <div>
          <h1 class="font-bold text-sm tracking-tight">Личный кабинет</h1>
          <p class="text-xs text-neutral-500 dark:text-neutral-400">Двор на замок</p>
        </div>
      </div>

      <!-- Профиль и выход -->
      <div class="flex items-center gap-4">
        <div class="hidden sm:block text-right">
          <p class="text-xs font-medium">{{ user?.name || 'Клиент' }}</p>
          <p class="text-[10px] text-neutral-400">{{ user?.phone }}</p>
        </div>
        <UButton
          variant="ghost"
          color="neutral"
          size="sm"
          icon="i-lucide-log-out"
          @click="handleLogout"
        >
          Выйти
        </UButton>
      </div>
    </header>

    <!-- Основное содержимое страницы -->
    <main class="flex-1 max-w-5xl w-full mx-auto p-6 md:p-8">
      <slot />
    </main>
  </div>
</template>
