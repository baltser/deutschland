<script setup lang="ts">
import { computed } from 'vue'

export interface Device {
  device_id: number
  device_name: string
  device_type: string
}

const props = defineProps<{
  devices: Device[]
  selectedDeviceIds: number[]
}>()

const emit = defineEmits<{
  'update:selectedDeviceIds': [ids: number[]]
  toggleDevice: [deviceId: number]
}>()

// Сортируем устройства по device_id слева направо (по возрастанию),
// чтобы порядок строго совпадал с историей и таблицей аудита.
const sortedDevices = computed(() => {
  if (!props.devices) return []
  return [...props.devices].sort((a, b) => a.device_id - b.device_id)
})

// Подключаем твой компактный composable
const { deviceStatuses, isChecking, checkDevices } = useDeviceStatus()
let pollInterval: NodeJS.Timeout | null = null

// Функция обновления статусов с автовыбором/снятием
const updateStatuses = async () => {
  if (!props.devices || !props.devices.length) return

  await checkDevices(props.devices)

  // Синхронизируем выбор с актуальным сетевым состоянием
  props.devices.forEach((device) => {
    const isOnline = deviceStatuses.value[device.device_id]
    const isSelected = props.selectedDeviceIds.includes(device.device_id)

    if (isOnline === true && !isSelected) {
      emit('toggleDevice', device.device_id)
    } else if (isOnline === false && isSelected) {
      emit('toggleDevice', device.device_id)
    }
  })
}

onMounted(() => {
  updateStatuses()
  // Периодический опрос каждые 40 секунд
  pollInterval = setInterval(updateStatuses, 40000)
})

onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval)
})

const handleDeviceClick = (deviceId: number) => {
  const isOnline = deviceStatuses.value[deviceId]
  if (isOnline === false) return
  emit('toggleDevice', deviceId)
}
</script>

<template>
  <div class="flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
    <!-- Заголовок и лоадер -->
    <span class="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5 whitespace-nowrap">
      <span>Куда выписать пропуск:</span>
      <UIcon v-if="isChecking" name="i-lucide-loader-2" class="w-3 h-3 animate-spin text-primary-500" />
    </span>

    <!-- Список оборудования (отсортирован по возрастанию device_id) -->
    <div class="flex items-center gap-1.5 flex-wrap">
      <div
        v-for="device in sortedDevices"
        :key="device.device_id"
        class="group relative"
      >
        <!-- Плашка устройства -->
        <div
          :class="[
            'px-3 py-1.5 rounded-xl border transition-all flex items-center gap-2 text-xs font-medium select-none',
            deviceStatuses[device.device_id] === false
              ? 'bg-red-50/60 dark:bg-red-950/20 border-red-200 dark:border-red-900/50 text-neutral-500 dark:text-neutral-400 cursor-not-allowed'
              : selectedDeviceIds.includes(device.device_id)
                ? 'bg-primary-50/90 dark:bg-primary-950/80 border-primary-500/60 text-primary-700 dark:text-primary-300 shadow-2xs cursor-pointer'
                : 'bg-white/90 dark:bg-neutral-800/90 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-600 cursor-pointer'
          ]"
          @click="handleDeviceClick(device.device_id)"
        >
          <!-- Иконка устройства -->
          <UIcon
            name="mdi:barrier"
            class="w-3.5 h-3.5 flex-shrink-0"
            :class="deviceStatuses[device.device_id] === false ? 'text-red-400' : 'text-primary-500'"
          />

          <span>{{ device.device_name }}</span>

          <!-- Точка-индикатор сети -->
          <span
            class="w-2 h-2 rounded-full"
            :class="{
              'bg-emerald-500': deviceStatuses[device.device_id] === true,
              'bg-red-500 shadow-xs shadow-red-500/50': deviceStatuses[device.device_id] === false,
              'bg-neutral-300 animate-pulse': deviceStatuses[device.device_id] === undefined
            }"
          />

          <!-- Чекбокс / Статус -->
          <div
:class="[
            'w-4 h-4 rounded-md border flex items-center justify-center transition-colors',
            deviceStatuses[device.device_id] === false
              ? 'border-red-300 dark:border-red-800 bg-red-100 dark:bg-red-950 text-red-500'
              : selectedDeviceIds.includes(device.device_id)
                ? 'bg-primary-600 border-primary-600 text-white'
                : 'border-neutral-300 dark:border-neutral-600 bg-white/80 dark:bg-neutral-800/80'
          ]">
            <UIcon
              v-if="deviceStatuses[device.device_id] === false"
              name="i-lucide-x"
              class="w-3 h-3 text-red-500 font-bold"
            />
            <UIcon
              v-else-if="selectedDeviceIds.includes(device.device_id)"
              name="i-lucide-check"
              class="w-3 h-3"
            />
          </div>
        </div>

        <!-- Тултип для оффлайн оборудования -->
        <div
          v-if="deviceStatuses[device.device_id] === false"
          class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 pointer-events-none whitespace-nowrap"
        >
          <div class="px-3 py-1.5 bg-neutral-900 text-white rounded-xl shadow-2xl text-[11px] border border-neutral-800 flex items-center gap-1.5">
            <UIcon name="i-lucide-alert-triangle" class="w-3.5 h-3.5 text-red-400 shrink-0" />
            <span>Оборудование не в сети. Выбор заблокирован.</span>
          </div>
          <div class="w-2 h-2 bg-neutral-900 rotate-45 mx-auto -mt-1 border-r border-b border-neutral-800"/>
        </div>
      </div>
    </div>
  </div>
</template>
