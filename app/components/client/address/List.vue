<script setup lang="ts">
import type { ClientAddressRelation } from '~/types/user'

defineProps<{
  addresses?: ClientAddressRelation[]
}>()
</script>

<template>
  <div class="space-y-2">
    <div class="flex items-center justify-between">
      <label class="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
        Привязанные объекты ({{ addresses?.length || 0 }})
      </label>
    </div>

    <div v-if="addresses && addresses.length > 0" class="space-y-1.5 max-h-44 overflow-y-auto pr-1">
      <div
        v-for="item in addresses"
        :key="item.address_id"
        class="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 text-xs text-neutral-700 dark:text-neutral-300 border border-neutral-200/80 dark:border-neutral-700/60 hover:border-neutral-300 dark:hover:border-neutral-600 transition-colors"
      >
        <div class="flex items-center gap-2 min-w-0">
          <UIcon name="i-lucide-map-pin" class="w-4 h-4 text-primary shrink-0" />
          <span class="truncate font-medium">{{ item.address?.address_name || `Объект #${item.address_id}` }}</span>
        </div>
        <UBadge color="neutral" variant="subtle" size="xs" class="shrink-0">
          #{{ item.address_id }}
        </UBadge>
      </div>
    </div>

    <div v-else class="py-4 text-center text-xs text-neutral-400 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl">
      К клиенту пока не привязано ни одного объекта
    </div>
  </div>
</template>
