<script setup lang="ts">
import type { StaffUser } from '~/types/user'
import {getRoleColor, getRoleLabel} from "~/utils/roles.ts";

const props = defineProps<{
  users: StaffUser[]
  loading: boolean
  error: unknown
}>()

defineEmits<{
  select: [user: StaffUser]
}>()

const errorMessage = computed(() => {
  if (!props.error) return ''
  if (typeof props.error === 'object') {
    const err = props.error as { message?: string; data?: { message?: string } }
    return err.message || err.data?.message || 'Произошла неизвестная ошибка'
  }
  return String(props.error)
})
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
      :description="errorMessage"
      class="mb-6"
    />

    <!-- Пустое состояние -->
    <div v-else-if="users.length === 0" class="p-12 text-center text-neutral-400">
      Сотрудники не найдены
    </div>

    <!-- Таблица -->
    <div v-else class="overflow-x-auto">
      <table class="w-full text-left border-collapse">
        <thead>
        <tr class="border-b border-gray-200 dark:border-gray-800 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          <th class="p-4">Сотрудник</th>
          <th class="p-4">Телефон</th>
          <th class="p-4">Email</th>
          <th class="p-4">Статус</th>
          <th class="p-4 text-right">Роль</th>
        </tr>
        </thead>
        <tbody class="divide-y divide-gray-100 dark:divide-gray-800/60 text-sm">
        <tr
          v-for="u in users"
          :key="u.user_id"
          class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
          @click="$emit('select', u)"
        >
          <!-- Имя и аватар -->
          <td class="p-4">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 overflow-hidden border border-neutral-200 dark:border-neutral-700 font-semibold text-xs">
                <img
                  v-if="u.avatar_path"
                  :src="`/api/files/${u.avatar_path}`"
                  :alt="u.user_name"
                  class="w-full h-full object-cover"
                >
                <span v-else>{{ (u.user_name?.[0] || 'С').toUpperCase() }}</span>
              </div>
              <div>
                <span class="font-medium text-gray-900 dark:text-white">{{ u.user_name || 'Без имени' }}</span>
              </div>
            </div>
          </td>

          <!-- Телефон -->
          <td class="p-4 text-gray-600 dark:text-gray-400">
            {{ u.phone || 'Не указан' }}
          </td>

          <!-- Email -->
          <td class="p-4 text-gray-600 dark:text-gray-400">
            {{ u.email || '—' }}
          </td>

          <!-- Статус активации -->
          <td class="p-4">
            <UBadge
              :color="u.activated_at ? 'success' : 'neutral'"
              variant="subtle"
              size="xs"
            >
              {{ u.activated_at ? 'Активен' : 'Ожидает входа' }}
            </UBadge>
          </td>

          <!-- Роль (бейджик) -->
          <td class="p-4 text-right">
            <UBadge
              :color="getRoleColor(u.role_name)"
              variant="subtle"
              size="sm"
            >
              {{ getRoleLabel(u.role_name) }}
            </UBadge>
          </td>
        </tr>
        </tbody>
      </table>
    </div>
  </UCard>
</template>
