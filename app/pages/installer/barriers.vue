<script setup lang="ts">
definePageMeta({
  layout: 'installer',
})

// Запрашиваем тот же самый общий эндпоинт
const { data: responseData, pending, error, refresh } = await useFetch('/api/installer/devices')

// Фильтруем шлагбаумы на клиенте
const addresses = computed(() => {
  const rawAddresses = responseData.value?.addresses || []
  return rawAddresses
    .map(addr => ({
      ...addr,
      devices: addr.devices.filter(d => d.device_type === 'CAMERA')
    }))
    .filter(addr => addr.devices.length > 0)
})

useSeoMeta({
  title: 'Шлагбаумы и временный проезд — Кабинет монтажника',
  description: 'Управление шлагбаумами и контроль проезда',
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-neutral-900 dark:text-white">Шлагбаумы (Временный проезд)</h1>
        <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
          Контроль точек въезда, шлагбаумов и параметров доступа.
        </p>
      </div>
      <UButton variant="ghost" color="neutral" size="sm" icon="i-lucide-refresh-cw" :loading="pending" @click="() => refresh()">
        Обновить
      </UButton>
    </div>

    <div v-if="error" class="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-2xl p-6 text-red-600 text-sm">
      Не удалось загрузить шлагбаумы.
    </div>

    <div v-else-if="pending" class="py-16 text-center text-neutral-400 text-sm">
      Загрузка шлагбаумов...
    </div>

    <div v-else-if="addresses.length === 0" class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-12 text-center space-y-3">
      <UIcon name="i-lucide-shield-alert" class="w-8 h-8 mx-auto text-neutral-400" />
      <h3 class="font-medium text-neutral-900 dark:text-white">Нет доступных шлагбаумов</h3>
    </div>

    <div v-else class="space-y-6">
      <div
        v-for="addr in addresses"
        :key="addr.address_id"
        class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 space-y-4 shadow-xs"
      >
        <div class="flex items-center gap-3 pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <div class="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600">
            <UIcon name="i-lucide-map-pin" class="w-5 h-5" />
          </div>
          <div>
            <h2 class="font-semibold text-neutral-900 dark:text-white">{{ addr.address_name }}</h2>
            <p class="text-xs text-neutral-400">Объект недвижимости</p>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div
            v-for="device in addr.devices"
            :key="device.device_id"
            class="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-sm"
          >
            <div class="flex items-center gap-3">
              <div class="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300">
                <UIcon name="i-lucide-shield-alert" class="w-4 h-4" />
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <span class="font-medium text-neutral-900 dark:text-white text-xs sm:text-sm">
                    {{ device.device_name }}
                  </span>
                  <span class="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300">
                    Шлагбаум
                  </span>
                </div>
                <p class="text-xs text-neutral-400 mt-0.5">
                  <span v-if="device.ip">IP: {{ device.ip }}</span>
                  <span v-if="device.port">:{{ device.port }}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
