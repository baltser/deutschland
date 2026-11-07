<!-- app/components/client/address/number/List.vue -->
<script setup lang="ts">
import AddressNumberItem, { type GroupedNumberItem } from './Item.vue'

export interface Device {
  device_id: number
  device_name: string
}

defineProps<{
  activeNumbers: GroupedNumberItem[]
  devices: Device[]
}>()

const emit = defineEmits<{
  revoke: [records: { id: number | string; deviceId: number }[]]
}>()

</script>

<template>
  <div class="space-y-6 pt-2">
    <!-- Секция активных номеров -->
    <div class="space-y-2">
      <div class="flex items-center justify-between">
        <span class="text-xs font-bold uppercase tracking-wider text-neutral-400">
          Активные номера на объекте ({{ activeNumbers.length }})
        </span>
      </div>

      <div v-if="activeNumbers.length > 0" class="grid grid-cols-1 gap-2">
        <AddressNumberItem
          v-for="item in activeNumbers.slice().reverse()"
          :key="item.carNumber"
          :number-item="item"
          :devices="devices"
          @revoke="emit('revoke', $event)"
        />
      </div>
      <div v-else class="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/30 border border-neutral-100 dark:border-neutral-800 text-center">
        <UIcon name="i-lucide-shield-check" class="w-8 h-8 mx-auto text-neutral-300 dark:text-neutral-600 mb-1" />
        <p class="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
          Сейчас активных гостевых автономеров нет
        </p>
      </div>
    </div>
  </div>
</template>
