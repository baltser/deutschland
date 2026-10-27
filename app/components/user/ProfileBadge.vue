<script setup lang="ts">
import { getRoleLabel } from "~/utils/roles.ts";

export interface UserBadgeProps {
  userName?: string | null
  roleName?: string | null
  avatarUrl?: string | null
  to?: string
}

withDefaults(defineProps<UserBadgeProps>(), {
  userName: 'Пользователь',
  roleName: 'client',
  avatarUrl: null,
  to: '/profile'
})
</script>

<template>
  <NuxtLink
    :to="to"
    class="flex items-center gap-3 px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800/60 border border-default hover:border-primary transition-colors cursor-pointer overflow-hidden"
  >
    <!-- Аватарка или иконка-заглушка -->
    <UAvatar
      v-if="avatarUrl"
      :src="`/api/files/${avatarUrl}`"
      size="sm"
      :alt="userName || 'User'"
      class="shrink-0"
    />
    <div v-else class="p-2 rounded-lg bg-primary-500/10 text-primary shrink-0">
      <UIcon name="i-lucide-user" class="w-4 h-4" />
    </div>

    <!-- Текстовая информация -->
    <div class="flex flex-col overflow-hidden min-w-0">
      <span class="text-sm font-medium truncate text-neutral-900 dark:text-neutral-100">
        {{ userName }}
      </span>
      <!-- Используем динамический класс цвета в зависимости от роли -->
      <span
        v-if="roleName"
        class="text-[10px] uppercase font-semibold tracking-wider mt-0.5"
        :class="getRoleStyle(roleName)"
      >
        {{ getRoleLabel(roleName) }}
      </span>
    </div>
  </NuxtLink>
</template>
