<script setup lang="ts">
import { formatPhone } from '~/utils/phone'
import type { AdminClient } from '#server/types/admin'

defineProps<{
  clients: AdminClient[]
  loading: boolean
  totalClients: number
  currentPage: number
  limit: number
}>()
const searchQuery = defineModel<string>('searchQuery', { default: '' })

const emit = defineEmits<{
  'update:currentPage': [page: number]
}>()

const columns = [
  { key: 'index', label: '№', class: 'w-12 text-center' },
  { key: 'client', label: 'Клиент' },
  { key: 'phone', label: 'Телефон' }
]
</script>

<template>
  <div class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm space-y-4">
    <!-- Поиск -->
    <UInput
      v-model="searchQuery"
      size="sm"
      placeholder="Поиск по имени или телефону жильца..."
      icon="i-lucide-search"
      class="w-full"
    />

    <AppBaseTable
      :data="clients || []"
      :columns="columns"
      :loading="loading"
      row-key="user_id"
      empty-text="К этому адресу пока не привязано ни одного клиента или они не найдены по запросу."
    >
      <template #index="{ index }">
        <span class="text-xs text-neutral-400 font-mono text-center block">
          <!-- 💡 Исправлен расчет индекса: добавлен минус -->
          {{ ((currentPage - 1) * limit) + index + 1 }}
        </span>
      </template>

      <template #client="{ row }">
        <div class="font-medium text-neutral-900 dark:text-white flex items-center gap-3">
          <div class="w-7 h-7 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center font-semibold text-xs overflow-hidden shrink-0">
            <img v-if="row.avatar_path" :src="`/api/files/${row.avatar_path}`" class="w-full h-full object-cover">
            <span v-else>{{ (row.user_name?.[0] || 'К').toUpperCase() }}</span>
          </div>
          <span>{{ row.user_name || 'Без имени' }}</span>
        </div>
      </template>

      <template #phone="{ row }">
        <span class="text-neutral-600 dark:text-neutral-400 font-mono text-xs">
          {{ formatPhone(row.phone) }}
        </span>
      </template>
    </AppBaseTable>

    <!-- Пагинация -->
    <div v-if="totalClients > limit" class="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2">
      <span class="text-xs text-neutral-500">
        Страница {{ currentPage }} из {{ Math.ceil(totalClients / limit) || 1 }}
      </span>

      <!-- 💡 Используем v-model:page, как было в оригинальном рабочем коде -->
      <UPagination
        :model-value="currentPage"
        :total="totalClients"
        :items-per-page="limit"
        @update:page="(page: number) => emit('update:currentPage', page)"
      />
    </div>
  </div>
</template>
