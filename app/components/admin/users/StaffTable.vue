<script setup lang="ts">
import type { StaffUser } from '~/types/user'
import { getRoleColor, getRoleLabel } from "~/utils/roles.ts"

const props = withDefaults(
  defineProps<{
    users?: StaffUser[]
    loading?: boolean
    error?: unknown
  }>(),
  {
    users: () => [],
    loading: false,
    error: undefined,
  }
)

defineEmits<{
  select: [user: StaffUser]
}>()

// Безопасное извлечение текста ошибки
const errorMessage = computed(() => {
  if (!props.error) return ''
  if (typeof props.error === 'object') {
    const err = props.error as { message?: string; data?: { message?: string } }
    return err.message || err.data?.message || 'Произошла неизвестная ошибка'
  }
  return String(props.error)
})

// Конфигурация колонок для таблицы сотрудников (включая нумерацию "№")
const columns = [
  { key: 'index', label: '№', class: 'w-12 text-center' },
  { key: 'user', label: 'Сотрудник' },
  { key: 'phone', label: 'Телефон' },
  { key: 'email', label: 'Email' },
  { key: 'activated_at', label: 'Статус' },
  { key: 'role_name', label: 'Роль', class: 'text-right' }
]
</script>

<template>
  <AppBaseTable
    :data="users"
    :columns="columns"
    :loading="loading"
    :error="errorMessage"
    row-key="user_id"
    empty-text="Сотрудники не найдены"
    @row-click="$emit('select', $event)"
  >
    <!-- Нумерация строк -->
    <template #index="{ index }">
      <span class="text-xs text-neutral-400 font-mono text-center block">
        {{ index + 1 }}
      </span>
    </template>

    <!-- Имя и аватар -->
    <template #user="{ row }">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 overflow-hidden border border-neutral-200 dark:border-neutral-700 font-semibold text-xs shrink-0">
          <img
            v-if="row.avatar_path"
            :src="`/api/files/${row.avatar_path}`"
            :alt="row.user_name"
            class="w-full h-full object-cover"
          >
          <span v-else>{{ (row.user_name?.[0] || 'С').toUpperCase() }}</span>
        </div>
        <span class="font-medium text-gray-900 dark:text-white">{{ row.user_name || 'Без имени' }}</span>
      </div>
    </template>

    <!-- Телефон -->
    <template #phone="{ value }">
      <span class="text-gray-600 dark:text-gray-400 font-mono text-xs">{{ formatPhone(String(value || '')) || 'Не указан' }}</span>
    </template>

    <!-- Email -->
    <template #email="{ value }">
      <span class="text-gray-600 dark:text-gray-400 text-xs">{{ String(value || '—') }}</span>
    </template>

    <!-- Статус активации -->
    <template #activated_at="{ value }">
      <UBadge
        :color="Boolean(value) ? 'success' : 'neutral'"
        variant="subtle"
        size="xs"
      >
        {{ value ? 'Активен' : 'Ожидает входа' }}
      </UBadge>
    </template>

    <!-- Роль -->
    <template #role_name="{ value }">
      <div class="text-right">
        <UBadge
          :color="getRoleColor(String(value || ''))"
          variant="subtle"
          size="sm"
        >
          {{ getRoleLabel(String(value || '')) }}
        </UBadge>
      </div>
    </template>
  </AppBaseTable>
</template>
