<script setup lang="ts">
import type { AddressItem } from '~/stores/adminAddresses'

defineProps<{
  addresses: AddressItem[]
  pending?: boolean
}>()

defineEmits<{
  select: [item: unknown]
}>()
</script>

<template>
  <div class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm overflow-hidden">
    <div class="p-5 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center">
      <h2 class="font-semibold text-neutral-900 dark:text-white">Список объектов</h2>
      <span class="text-xs text-neutral-500 dark:text-neutral-400">Всего: {{ addresses.length }}</span>
    </div>

    <div v-if="pending" class="p-8 text-center text-neutral-400 text-sm">
      Загрузка адресов...
    </div>

    <div v-else-if="addresses.length === 0" class="p-12 text-center text-neutral-400 text-sm">
      <UIcon name="i-lucide-map-pin-off" class="w-10 h-10 mx-auto mb-2 opacity-40" />
      Список адресов пуст. Добавьте первый адрес с помощью формы выше.
    </div>

    <div v-else class="divide-y divide-neutral-200 dark:divide-neutral-800">
      <div
        v-for="item in addresses"
        :key="item.address_id"
        class="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer"
        @click="$emit('select', item)"
      >
        <div class="flex items-start gap-3">
          <div class="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
            <UIcon name="i-lucide-map-pin" class="w-5 h-5" />
          </div>
          <div>
            <p class="font-medium text-neutral-900 dark:text-white text-sm sm:text-base">{{ item.address_name }}</p>
            <p class="text-xs text-neutral-400 mt-0.5">ID объекта: #{{ item.address_id }}</p>
          </div>
        </div>

        <div class="flex items-center gap-2 self-end sm:self-center">
          <span class="text-xs px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
            Жильцов: {{ item.clients?.length || 0 }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
