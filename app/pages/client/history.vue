<script setup lang="ts">
import { useClientAddressesStore } from '~/stores/client/addresses'
import { useNumbersHistoryStore } from '~/stores/client/history'
import DeviceStatusPill from "~/components/client/history/DeviceStatusPill.vue"
import RussianPlate from "~/components/app/RussianPlate.vue"

definePageMeta({ layout: 'client' })

useSeoMeta({
  title: 'История и статистика пропусков',
  description: 'Архив выданных гостевых автономеров и аналитика использования'
})

const addressStore = useClientAddressesStore()
const historyStore = useNumbersHistoryStore()

onMounted(async () => {
  if (addressStore.addresses.length === 0) {
    await addressStore.fetchAddresses()
  }
  await historyStore.fetchHistory()
})

const handleRefresh = async () => {
  historyStore.invalidateCache()
  await historyStore.fetchHistory(true)
}

interface AddressDevice {
  device_id: number
  device_name: string
}

interface AddressItem {
  address_id: number
  address_name: string
  devices?: AddressDevice[]
}

const getDeviceName = (deviceId: number): string => {
  for (const addr of addressStore.addresses as AddressItem[]) {
    const device = addr.devices?.find((d: AddressDevice) => d.device_id === Number(deviceId))
    if (device) return device.device_name
  }
  return `Устройство #${deviceId}`
}

// Форматирование интервала: "06.11.2026, 15:34 — 15:35"
const formatLogInterval = (createdAt?: number, expiresAt?: number, fallbackTime?: number) => {
  const start = createdAt || fallbackTime
  if (!start) return '—'

  const startDate = new Date(start)
  const formattedDate = startDate.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
  const startTime = startDate.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })

  if (!expiresAt || expiresAt === start) {
    return `${formattedDate}, ${startTime}`
  }

  const endDate = new Date(expiresAt)
  const endTime = endDate.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })

  const formattedEndDate = endDate.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })

  if (formattedDate === formattedEndDate) {
    return `${formattedDate}, ${startTime} — ${endTime}`
  }

  return `${formattedDate}, ${startTime} — ${formattedEndDate}, ${endTime}`
}
</script>

<template>
  <div class="space-y-6 max-w-5xl mx-auto pb-12">
    <!-- Шапка страницы -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-bold text-neutral-900 dark:text-white">
          История и статистика
        </h1>
        <p class="text-xs text-neutral-500 dark:text-neutral-400">
          Полная аналитика и архив выданных гостевых пропусков
        </p>
      </div>

      <UButton
        size="xs"
        color="neutral"
        variant="subtle"
        icon="i-lucide-refresh-cw"
        :loading="historyStore.loading"
        @click="handleRefresh()"
      >
        Обновить
      </UButton>
    </div>

    <!-- Загрузка -->
    <div v-if="historyStore.loading && historyStore.logs.length === 0" class="py-16 text-center text-neutral-400 text-sm">
      <UIcon name="i-lucide-loader-2" class="w-6 h-6 animate-spin mx-auto mb-2 text-primary-500" />
      Загрузка аналитики из архива...
    </div>

    <template v-else>
      <!-- Блок карточек статистики -->
      <ClientHistoryStatsGrid :stats="historyStore.stats" />

      <!-- Таблица истории с детализацией по устройствам -->
      <div class="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-3xl overflow-hidden shadow-2xs">
        <div class="p-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <h2 class="text-xs font-bold uppercase tracking-wider text-neutral-400">
            Журнал аудита оборудования
          </h2>
          <span class="text-xs text-neutral-500 font-mono">Детализация по устройствам</span>
        </div>

        <div v-if="historyStore.logs.length === 0" class="py-12 text-center text-xs text-neutral-400">
          Архив событий пуст
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs">
            <thead class="bg-neutral-50 dark:bg-neutral-800/50 text-[11px] text-neutral-500 border-b border-neutral-200/60 dark:border-neutral-700/60">
            <tr>
              <th class="py-3 px-4 font-medium">Время</th>
              <th class="py-3 px-4 font-medium">Номер авто</th>
              <th class="py-3 px-4 font-medium">Состояние по устройствам</th>
              <th class="py-3 px-4 font-medium">Комментарий</th>
            </tr>
            </thead>
            <tbody class="divide-y divide-neutral-200/40 dark:divide-neutral-800/60 text-neutral-700 dark:text-neutral-300">
            <tr v-for="(log, idx) in historyStore.logs" :key="`${log.time}_${log.carNumber}_${idx}`" class="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors">
              <td class="py-3.5 px-4 font-mono text-[11px] text-neutral-400 whitespace-nowrap align-middle">
                {{ formatLogInterval(log.createdAt, log.expiresAt, log.time) }}
              </td>

              <!-- Визуальный автомобильный номер ГОСТ РФ -->
              <td class="py-3.5 px-4 whitespace-nowrap align-middle">
                <RussianPlate :plate-number="log.carNumber" />
              </td>

              <!-- Индикатор состояния оборудования (шлагбаумы) -->
              <td class="py-3.5 px-4 align-middle">
                <DeviceStatusPill
                  :devices-status="log.devicesStatus"
                  :get-device-name="getDeviceName"
                />
              </td>

              <!-- Колонка комментариев -->
              <td class="py-3.5 px-4 truncate max-w-[180px] align-middle" :title="log.comment || ''">
                <span v-if="log.comment" class="text-neutral-700 dark:text-neutral-300 font-medium">
                  {{ log.comment }}
                </span>
                <span v-else class="text-neutral-400 italic text-[11px]">нет</span>
              </td>
            </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>
