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
  <div class="relative min-h-screen py-2 px-1 sm:px-4">

    <!-- Динамический фоновый паттерн с номерами -->
    <div
      class="fixed inset-0 pointer-events-none z-0 transition-opacity duration-300 opacity-70 dark:opacity-55 bg-repeat bg-[length:550px_auto]"
      style="background-image: url('/images/background/background-numbers.jpeg');"
    />

    <!-- Адаптивный оверлей -->
    <div
      class="fixed inset-0 pointer-events-none z-0 bg-gradient-to-b from-slate-100/40 via-slate-100/50 to-slate-200/60 dark:from-neutral-950/45 dark:via-neutral-950/60 dark:to-neutral-900/75"
    />

    <!-- Основной контент страницы -->
    <div class="relative z-10 space-y-6 max-w-5xl mx-auto pb-12">

      <!-- Стилизованная баннер-шапка -->
      <div
        class="relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-6
               bg-slate-100/90 border border-slate-200/90 shadow-lg shadow-slate-200/40 backdrop-blur-md
               dark:bg-neutral-900/90 dark:border-neutral-800/90 dark:shadow-2xl dark:shadow-black/40
               rounded-3xl transition-all duration-300"
      >
        <div class="absolute inset-0 pointer-events-none z-0">
          <img
            src="/images/logo-bg.jpeg"
            alt="Logo Background"
            class="w-full h-full object-cover opacity-30 dark:opacity-35 scale-105 mix-blend-multiply dark:mix-blend-normal"
          >
          <div class="absolute inset-0 bg-gradient-to-r from-slate-100/95 via-slate-100/60 to-transparent dark:from-neutral-950/95 dark:via-neutral-900/50 dark:to-transparent" />
        </div>

        <div class="relative z-10">
          <div class="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400 mb-1">
            <span class="relative flex h-2 w-2">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"/>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-primary-500"/>
            </span>
            Архив и Аналитика
          </div>
          <h1 class="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            История и статистика
          </h1>
          <p class="text-xs text-slate-600 dark:text-neutral-300 mt-1 max-w-lg font-medium">
            Полная аналитика и архив выданных гостевых пропусков
          </p>
        </div>

        <UButton
          variant="outline"
          color="neutral"
          size="md"
          icon="i-lucide-refresh-cw"
          :loading="historyStore.loading"
          class="relative z-10 self-start sm:self-auto bg-white/80 dark:bg-neutral-800/80 hover:bg-white dark:hover:bg-neutral-800 border-slate-300/80 dark:border-neutral-700 text-slate-800 dark:text-neutral-200 shadow-xs backdrop-blur-xs transition-all active:scale-95 rounded-xl font-semibold"
          @click="handleRefresh()"
        >
          Обновить
        </UButton>
      </div>

      <!-- Состояние загрузки -->
      <div v-if="historyStore.loading && historyStore.logs.length === 0" class="py-16 text-center text-slate-500 dark:text-neutral-400 text-sm bg-white/70 dark:bg-neutral-900/70 backdrop-blur-md rounded-3xl border border-slate-200/80 dark:border-neutral-800/80 shadow-lg">
        <UIcon name="i-lucide-loader-2" class="w-6 h-6 animate-spin mx-auto mb-2 text-primary-500" />
        Загрузка аналитики из архива...
      </div>

      <template v-else>
        <!-- Блок карточек статистики -->
        <ClientHistoryStatsGrid :stats="historyStore.stats" />

        <!-- Основной контейнер журнала -->
        <div class="bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border border-slate-200/80 dark:border-neutral-800/80 rounded-3xl overflow-hidden shadow-xl">
          <div class="p-4 px-6 border-b border-slate-200/80 dark:border-neutral-800 flex items-center justify-between">
            <h2 class="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300">
              Журнал выданных пропусков
            </h2>
            <span class="text-xs text-slate-500 dark:text-neutral-400 font-mono">Архив</span>
          </div>

          <div v-if="historyStore.logs.length === 0" class="py-12 text-center text-xs text-slate-400 dark:text-neutral-500">
            Архив событий пуст
          </div>

          <template v-else>
            <!-- 📱 МОБИЛЬНЫЙ ВИД: Карточки (показываются только на телефонах: block md:hidden) -->
            <div class="block md:hidden divide-y divide-slate-100 dark:divide-neutral-800/80">
              <div
                v-for="(log, idx) in historyStore.logs"
                :key="`mob_${log.time}_${log.carNumber}_${idx}`"
                class="p-4 space-y-3 hover:bg-slate-50/50 dark:hover:bg-neutral-800/30 transition-colors"
              >
                <!-- Верхняя строка карточки: Время и Номер авто -->
                <div class="flex items-center justify-between gap-2">
                  <span class="font-mono text-[11px] text-slate-500 dark:text-neutral-400">
                    {{ formatLogInterval(log.createdAt, log.expiresAt, log.time) }}
                  </span>
                  <RussianPlate :plate-number="log.carNumber" />
                </div>

                <!-- Статус устройств -->
                <div class="flex items-center justify-between pt-1">
                  <span class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Устройства:</span>
                  <DeviceStatusPill
                    :devices-status="log.devicesStatus"
                    :get-device-name="getDeviceName"
                  />
                </div>

                <!-- Комментарий (если есть) -->
                <div v-if="log.comment" class="text-xs text-slate-700 dark:text-neutral-300 bg-slate-100/70 dark:bg-neutral-800/50 p-2.5 rounded-xl">
                  <span class="font-semibold text-slate-400 text-[10px] uppercase block mb-0.5">Комментарий:</span>
                  {{ log.comment }}
                </div>
              </div>
            </div>

            <!-- 💻 ДЕСКТОПНЫЙ ВИД: Классическая таблица (приглушенная комфортная гамма) -->
            <div class="hidden md:block overflow-x-auto">
              <table class="w-full text-left border-collapse text-xs">
                <!-- Шапка таблицы: мягкий Slate-оттенок без яркой белизны -->
                <thead class="bg-slate-200/50 dark:bg-neutral-950/60 text-[11px] uppercase tracking-wider text-slate-600 dark:text-neutral-400 border-b border-slate-300/80 dark:border-neutral-800">
                <tr>
                  <th class="py-3.5 px-6 font-bold">Время</th>
                  <th class="py-3.5 px-6 font-bold">Номер авто</th>
                  <th class="py-3.5 px-6 font-bold">Состояние по устройствам</th>
                  <th class="py-3.5 px-6 font-bold">Комментарий</th>
                </tr>
                </thead>
                <!-- Тело таблицы: мягкое чередование строк и приятный отклики при наведении -->
                <tbody class="divide-y divide-slate-200/60 dark:divide-neutral-800/60 text-slate-700 dark:text-neutral-200">
                <tr
                  v-for="(log, idx) in historyStore.logs"
                  :key="`${log.time}_${log.carNumber}_${idx}`"
                  class="transition-colors duration-150
               even:bg-slate-100/40 dark:even:bg-neutral-900/40
               hover:bg-slate-200/60 dark:hover:bg-neutral-800/70"
                >
                  <!-- Время -->
                  <td class="py-3.5 px-6 font-mono text-[11px] text-slate-600 dark:text-neutral-400 whitespace-nowrap align-middle">
                    {{ formatLogInterval(log.createdAt, log.expiresAt, log.time) }}
                  </td>

                  <!-- Номер авто -->
                  <td class="py-3.5 px-6 whitespace-nowrap align-middle">
                    <RussianPlate :plate-number="log.carNumber" />
                  </td>

                  <!-- Состояние по устройствам -->
                  <td class="py-3.5 px-6 align-middle">
                    <DeviceStatusPill
                      :devices-status="log.devicesStatus"
                      :get-device-name="getDeviceName"
                    />
                  </td>

                  <!-- Комментарий -->
                  <td class="py-3.5 px-6 truncate max-w-[200px] align-middle" :title="log.comment || ''">
                    <span v-if="log.comment" class="text-slate-700 dark:text-neutral-300 font-medium">
                      {{ log.comment }}
                    </span>
                    <span v-else class="text-slate-400 dark:text-neutral-500 italic text-[11px]">нет</span>
                  </td>
                </tr>
                </tbody>
              </table>
            </div>
          </template>
        </div>
      </template>
    </div>
  </div>
</template>
