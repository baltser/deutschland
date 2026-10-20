<script setup lang="ts">
const clientLinks = [
  { label: 'Мои объекты', to: '/client', icon: 'i-lucide-map-pin' },
]
</script>

<template>
  <AppSidebarLayoutShell :menu-items="clientLinks" title="Личный кабинет клиента">
    <slot />
  </AppSidebarLayoutShell>
</template>
