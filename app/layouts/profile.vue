<script setup lang="ts">
const { clear } = useUserSession()

async function onLogout() {
  await clear()
  await navigateTo('/login')
}
</script>

<template>
  <div class="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col text-neutral-900 dark:text-neutral-100">
    <!-- Чистая минималистичная шапка -->
    <header class="sticky top-0 z-40 bg-[var(--ui-bg)]/85 backdrop-blur border-b border-default h-16 px-4 sm:px-8 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <AppLogo />
      </div>

      <div class="flex items-center gap-2">
<!--        <UColorModeButton />-->

        <UButton
          to="/"
          variant="ghost"
          color="neutral"
          size="sm"
          icon="i-lucide-arrow-left"
        >
          На главную
        </UButton>

        <UButton
          color="error"
          variant="subtle"
          size="sm"
          icon="i-lucide-log-out"
          @click="onLogout"
        >
          Выйти
        </UButton>
      </div>
    </header>

    <!-- Основной контент профиля -->
    <main class="flex-1 max-w-3xl w-full mx-auto p-4 sm:p-6 lg:p-8">
      <slot />
    </main>
  </div>
</template>
