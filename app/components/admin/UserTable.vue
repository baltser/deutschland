<script setup lang="ts">
import type { UserItem } from '~/stores/adminUsers.ts'

defineProps<{
  users: UserItem[]
  loading: boolean
  error: unknown
}>()

defineEmits<{
  select: [user: UserItem]
}>()
</script>

<template>
  <UCard>
    <!-- Индикатор загрузки -->
    <div v-if="loading" class="flex justify-center py-12">
      <UIcon name="i-lucide-loader-2" class="animate-spin text-2xl text-primary" />
    </div>

    <!-- Сообщение об ошибке -->
    <UAlert
      v-else-if="error"
      color="error"
      variant="soft"
      title="Ошибка загрузки"
      :description="error.message"
      class="mb-6"
    />

    <!-- Таблица -->
    <div v-else class="overflow-x-auto">
      <table class="w-full text-left border-collapse">
        <thead>
        <tr class="border-b border-gray-200 dark:border-gray-800 text-sm font-semibold text-gray-500 dark:text-gray-400">
          <th class="p-3">Имя</th>
          <th class="p-3">Email</th>
          <th class="p-3">Роль</th>
        </tr>
        </thead>
        <tbody>
        <tr
          v-for="u in users"
          :key="u.id"
          class="border-b border-gray-100 dark:border-gray-800/60 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
          @click="$emit('select', u)"
        >
          <td class="p-3">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 overflow-hidden border border-neutral-200 dark:border-neutral-700">
                <img
                  v-if="u.avatar"
                  :src="`/api/files/${u.avatar}`"
                  :alt="u.name"
                  class="w-full h-full object-cover"
                >
                <UIcon v-else name="i-lucide-user" class="w-4 h-4" />
              </div>
              <span class="font-medium text-gray-900 dark:text-white">{{ u.name }}</span>
            </div>
          </td>
          <td class="p-3 text-gray-600 dark:text-gray-400 text-sm">
            {{ u.email }}
          </td>
          <td class="p-3">
            <UBadge
              :color="u.ruleName === 'admin' ? 'primary' : 'neutral'"
              variant="subtle"
              size="sm"
              class="uppercase"
            >
              {{ u.ruleName }}
            </UBadge>
          </td>
        </tr>
        </tbody>
      </table>
    </div>
  </UCard>
</template>
