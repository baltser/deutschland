<script setup lang="ts">
const adminLinks = [
  { label: 'Объекты и устройства', to: '/admin/addresses', icon: 'i-lucide-map-pin' },
  { label: 'Пользователи', to: '/admin/users', icon: 'i-lucide-users' },
  { label: 'ANPR Камеры и доступы', to: '/admin/cameras-anpr', icon: 'lucide:cctv' },
  { label: 'Системные логи', to: '/admin/logs', icon: 'i-lucide-terminal' },
  { label: 'Шаблоны писем', to: '/admin/system/email-templates', icon: 'i-lucide-mail' },
  { label: 'На сайт', to: '/', icon: 'i-lucide-globe' }
]
</script>

<template>
  <AppSidebarLayoutShell :menu-items="adminLinks" title="Панель администратора">
    <slot />
  </AppSidebarLayoutShell>
</template>
