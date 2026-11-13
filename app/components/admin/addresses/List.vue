<script setup lang="ts">
import type { AddressItem } from '~/types/address.ts'

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

    <div v-else-if="addresses.length === 0" class="py-16 px-6 text-center flex flex-col items-center justify-center">
      <div class="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-4 shadow-xs">
        <UIcon name="i-lucide-map-pin-plus" class="w-7 h-7" />
      </div>

      <h3 class="text-sm sm:text-base font-semibold text-neutral-900 dark:text-white">
        Пока нет ни одного объекта
      </h3>

      <p class="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 max-w-sm mt-1.5 leading-relaxed">
        Список адресов пуст. Введите название улицы и номер дома в форму выше, чтобы создать первый объект и привязать к нему жильцов.
      </p>
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
        <div class="flex items-center gap-2 self-end sm:self-center flex-wrap justify-end">
          <!-- Жильцы (Зеленый акцент) -->
          <span class="text-xs px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5">
            <UIcon name="mdi:account-group" class="w-3.5 h-3.5" />
            <span>Жильцы: {{ item._count?.clients || 0 }}</span>
          </span>

          <!-- Группа оборудования: Камеры и Панели -->
          <div class="flex items-center gap-1.5">
            <!-- Камеры -->
            <span class="text-xs px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 font-medium flex items-center gap-1" title="Камеры видеонаблюдения">
              <UIcon name="lucide:cctv" class="w-3.5 h-3.5" />
              <span>{{ item.devices?.filter(d => d.device_type === 'CAMERA').length || 0 }}</span>
            </span>

            <!-- Вызывные панели -->
            <span class="text-xs px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1" title="Вызывные панели">
              <UIcon name="lucide:grid-3x3" class="w-3.5 h-3.5" />
              <span>{{ item.devices?.filter(d => d.device_type === 'PANEL').length || 0 }}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
