<script setup lang="ts">
const clientLinks = [
  { label: 'Мои объекты', to: '/client', icon: 'i-lucide-map-pin' },
  { label: 'История и архив', to: '/client/history', icon: 'i-lucide-history' },
]
</script>

<template>
  <AppSidebarLayoutShell :menu-items="clientLinks" title="Пользовательские функции">
    <slot />
  </AppSidebarLayoutShell>
</template>
