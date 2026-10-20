<script setup lang="ts">
const installerLinks = [
  { label: 'Вызывные панели', to: '/installer/panels', icon: 'i-heroicons-device-phone-mobile' },
  { label: 'Шлагбаумы', to: '/installer/barriers', icon: 'i-mdi-barrier' },
]
</script>

<template>
  <AppSidebarLayoutShell :menu-items="installerLinks" title="Кабинет монтажника">
    <slot />
  </AppSidebarLayoutShell>
</template>
