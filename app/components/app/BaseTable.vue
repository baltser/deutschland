<script setup lang="ts" generic="T extends Record<string, any>">
withDefaults(
  defineProps<{
    data: T[]
    columns: Array<{ key: string; label: string; class?: string }>
    loading?: boolean
    error?: unknown
    rowKey?: keyof T | string
    emptyText?: string
  }>(),
  {
    rowKey: 'id',
    emptyText: 'Данные не найдены',
    loading: false,
    error: undefined,
  }
)

defineEmits<{
  rowClick: [row: T]
}>()
</script>

<template>
  <UCard class="relative">
    <!-- Тонкая линия загрузки сверху -->
    <div v-if="loading && data && data.length > 0" class="absolute inset-x-0 top-0 h-1 bg-primary-500/20 overflow-hidden z-10 rounded-t-lg">
      <div class="w-full h-full bg-primary-500 animate-pulse" />
    </div>

    <!-- Лоадер -->
    <div v-if="loading && (!data || data.length === 0)" class="flex justify-center py-12">
      <UIcon name="i-lucide-loader-2" class="animate-spin text-2xl text-primary" />
    </div>

    <!-- Сообщение об ошибке -->
    <UAlert
      v-else-if="error"
      color="error"
      variant="soft"
      title="Ошибка загрузки"
      class="mb-6"
    >
      <template #title>Ошибка: {{ error }}</template>
    </UAlert>

    <!-- Пустое состояние -->
    <div v-else-if="!data || data.length === 0" class="p-12 text-center text-neutral-400">
      {{ emptyText }}
    </div>

    <!-- Таблица -->
    <div
      v-else
      class="overflow-x-auto border border-neutral-200 dark:border-neutral-700 rounded-lg transition-opacity duration-200"
      :class="{ 'opacity-60 pointer-events-none': loading }"
    >
      <table class="w-full text-left border-collapse text-sm">
        <thead>
        <tr class="bg-neutral-100 dark:bg-neutral-800/80 text-xs font-semibold text-neutral-600 dark:text-neutral-300 uppercase tracking-wider">
          <th
            v-for="column in columns"
            :key="column.key"
            class="p-2.5 border-b border-r last:border-r-0 border-neutral-200 dark:border-neutral-700"
            :class="column.class"
          >
            <slot :name="`header-${column.key}`" :column="column">
              {{ column.label }}
            </slot>
          </th>
        </tr>
        </thead>
        <tbody class="divide-y divide-neutral-200 dark:divide-neutral-700">
        <tr
          v-for="(row, index) in data"
          :key="((row[rowKey as keyof T]) as string | number) ?? index"
          class="even:bg-neutral-50/60 dark:even:bg-neutral-800/20 hover:bg-primary-50/30 dark:hover:bg-primary-950/20 transition-colors cursor-pointer"
          @click="$emit('rowClick', row)"
        >
          <td
            v-for="column in columns"
            :key="column.key"
            class="p-2.5 border-r last:border-r-0 border-neutral-200 dark:border-neutral-700"
            :class="column.class"
          >
            <slot
              :name="column.key"
              :row="row"
              :value="row[column.key as keyof T]"
              :index="index"
            >
              {{ row[column.key as keyof T] ?? '' }}
            </slot>
          </td>
        </tr>
        </tbody>
      </table>
    </div>

    <!-- Футер -->
    <div v-if="$slots.footer" class="mt-4 flex justify-end">
      <slot name="footer" />
    </div>
  </UCard>
</template>
