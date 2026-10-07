<template>
  <div class="min-h-screen flex flex-col bg-(--ui-bg) text-(--ui-text)">
    <!-- Nuxt подтянет компонент из app/components/AppHeader.vue автоматически -->
    <AppHeader />

    <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <slot />
    </main>

    <footer class="border-t border-(--ui-border) py-6 mt-auto">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between text-sm opacity-70">
        <p>© {{ new Date().getFullYear() }} DNZ. Все права защищены.</p>
      </div>
    </footer>
  </div>
</template>
