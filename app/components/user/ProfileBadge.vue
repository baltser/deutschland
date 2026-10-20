<script setup lang="ts">
export interface UserBadgeProps {
  userName?: string | null
  roleName?: string | null
  to?: string
}

withDefaults(defineProps<UserBadgeProps>(), {
  userName: 'Пользователь',
  roleName: 'client',
  to: '/profile'
})
</script>

<template>
  <NuxtLink
    :to="to"
    class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-default hover:border-primary transition-colors cursor-pointer"
  >
    <UIcon name="i-lucide-user" class="w-4 h-4 text-primary" />
    <span class="text-sm font-medium">{{ userName }}</span>
    <UBadge
      v-if="roleName"
      size="xs"
      variant="subtle"
      color="primary"
      class="uppercase"
    >
      {{ roleName }}
    </UBadge>
  </NuxtLink>
</template>
