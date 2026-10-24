<!-- app/layouts/installer.vue -->
<script setup lang="ts">
const installerLinks = [
  {
    label: 'Вызывные панели',
    to: '/installer?tab=PANEL',
    icon: 'i-lucide-phone-call'
  },
  {
    label: 'Камеры и шлагбаумы',
    to: '/installer?tab=CAMERA',
    icon: 'i-lucide-video'
  },
  {
    label: 'Все оборудование',
    to: '/installer?tab=all',
    icon: 'i-lucide-layout-grid'
  }
]
</script>

<template>
  <AppSidebarLayoutShell :menu-items="installerLinks" title="Кабинет монтажника">
    <slot />
  </AppSidebarLayoutShell>
</template>
