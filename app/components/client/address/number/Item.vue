<!-- app/components/client/address/number/Item.vue -->
<script setup lang="ts">
export interface GroupedNumberRecord {
  id: number | string
  deviceId: number
  status?: 'success' | 'error'
  errorMessage?: string
}

export interface GroupedNumberItem {
  carNumber: string
  tag?: string
  expiresIn?: string
  expiresAtTime?: string
  expiresAt: string
  records: GroupedNumberRecord[]
}

const props = defineProps<{
  numberItem: GroupedNumberItem
  devices: { device_id: number; device_name: string }[]
}>()

const emit = defineEmits<{
  revoke: [records: { id: number | string; deviceId: number }[]]
}>()

const getDeviceName = (deviceId: number) => {
  const device = props.devices.find(d => d.device_id === deviceId)
  return device?.device_name || `Устройство #${deviceId}`
}

// Динамический цвет таймера в зависимости от оставшегося времени
const getTimeColorClass = computed(() => {
  if (!props.numberItem.expiresAt) return 'text-emerald-600 dark:text-emerald-400'

  const diff = new Date(props.numberItem.expiresAt).getTime() - Date.now()

  // Меньше 5 минут (300 000 мс) или текст удаления — тревожный красный с пульсом
  if (diff <= 300000) {
    return 'text-red-600 dark:text-red-400 font-bold animate-pulse'
  }
  // От 5 до 15 минут (900 000 мс) — предупреждающий янтарный
  if (diff <= 900000) {
    return 'text-amber-600 dark:text-amber-400 font-semibold'
  }
  // Более 15 минут — спокойный зеленый
  return 'text-emerald-600 dark:text-emerald-400 font-semibold'
})
</script>

<template>
  <div
    class="p-4 rounded-2xl bg-white dark:bg-neutral-800/80 border border-neutral-200/80 dark:border-neutral-700/80 shadow-2xs hover:border-primary-500/40 transition-all space-y-3"
  >
    <!-- Верхняя строка: min-w-0 flex-1 гарантирует, что кнопка удаления никогда не улетит -->
    <div class="flex items-start justify-between gap-2 sm:gap-4">
      <div class="flex items-start sm:items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
        <div class="p-2 sm:p-2.5 rounded-xl bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-primary-900/30 flex-shrink-0">
          <UIcon name="mdi:barrier-up" class="w-4 h-4 sm:w-5 sm:h-5" />
        </div>

        <div class="min-w-0 flex-1">
          <!-- Номер и тег плавно сворачиваются/переносятся на мобилках -->
          <div class="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <AppRussianPlate :plate-number="numberItem.carNumber" />

            <UBadge
              v-if="numberItem.tag"
              color="neutral"
              variant="subtle"
              size="xs"
              class="font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200/60 dark:border-neutral-700/60 px-1.5 sm:px-2 py-0.5 truncate max-w-[120px] sm:max-w-none"
            >
              {{ numberItem.tag }}
            </UBadge>
          </div>

          <!-- Время действия с динамическим цветом -->
          <div class="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-neutral-500 dark:text-neutral-400 mt-1 flex-wrap">
            <span>Истекает: <strong :class="getTimeColorClass">{{ numberItem.expiresIn }}</strong></span>
            <span v-if="numberItem.expiresAtTime" class="hidden sm:inline">•</span>
            <span v-if="numberItem.expiresAtTime" class="w-full sm:w-auto">До {{ numberItem.expiresAtTime }}</span>
          </div>
        </div>
      </div>

      <!-- Кнопка отзыва гарантированно остается видимой -->
      <UButton
        size="xs"
        color="error"
        variant="ghost"
        icon="i-lucide-trash-2"
        class="hover:bg-red-50 dark:hover:bg-red-950/50 flex-shrink-0"
        @click="emit('revoke', numberItem.records)"
      >
        <span class="hidden sm:inline">Отозвать</span>
      </UButton>
    </div>

    <!-- Нижняя строка: Оборудование со статусами ОК или ОШИБКА -->
    <div class="pt-2 border-t border-neutral-100 dark:border-neutral-700/50 flex items-center gap-2 flex-wrap">
      <span class="text-[11px] font-medium text-neutral-400 mr-1">Оборудование:</span>

      <div
        v-for="record in numberItem.records"
        :key="record.id"
        class="group relative inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs transition-all cursor-default"
        :class="record.status === 'error'
          ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300'
          : 'bg-neutral-50 dark:bg-neutral-900/70 border-neutral-200/60 dark:border-neutral-700/60 text-neutral-700 dark:text-neutral-300'"
      >
        <!-- Индикатор -->
        <span
          class="w-1.5 h-1.5 rounded-full flex-shrink-0"
          :class="record.status === 'error' ? 'bg-red-500' : 'bg-emerald-500 animate-pulse'"
        />

        <!-- Название конкретного устройства -->
        <span class="font-medium">
          {{ getDeviceName(record.deviceId) }}
        </span>

        <!-- Бейдж статуса -->
        <UBadge
          v-if="record.status === 'error'"
          color="error"
          variant="subtle"
          size="xs"
          class="ml-1 text-[10px] px-1.5 py-0"
        >
          Сбой
        </UBadge>
        <UBadge
          v-else
          color="success"
          variant="subtle"
          size="xs"
          class="ml-1 text-[10px] px-1.5 py-0"
        >
          ОК
        </UBadge>

        <!-- Понятная подсказка для клиента при наведении -->
        <div
          v-if="record.status === 'error'"
          class="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block z-25 px-3 py-1.5 text-[11px] bg-neutral-900 text-white rounded-xl shadow-xl whitespace-nowrap pointer-events-none"
        >
          Не удалось передать пропуск на это устройство. Обратитесь в поддержку.
        </div>
      </div>
    </div>
  </div>
</template>
