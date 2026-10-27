<script setup lang="ts">
import { useClientAddressesStore } from '~/stores/client/addresses'

definePageMeta({
  layout: 'client',
})

const store = useClientAddressesStore()

useSeoMeta({
  title: 'Мои объекты и оборудование',
  description: 'Список ваших адресов и установленных устройств',
})
</script>

<template>
  <div class="space-y-6">
    <!-- Шапка страницы -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-neutral-900 dark:text-white">Мои объекты</h1>
        <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
          Список адресов, к которым у вас есть доступ, и установленное на них оборудование.
        </p>
      </div>
      <UButton
        variant="ghost"
        color="neutral"
        size="sm"
        icon="i-lucide-refresh-cw"
        :loading="store.pending"
        @click="() => store.fetchAddresses()"
      >
        Обновить
      </UButton>
    </div>

    <!-- Ошибка загрузки -->
    <div v-if="store.error" class="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-2xl p-6 text-red-600 dark:text-red-400 text-sm">
      Не удалось загрузить ваши данные. Попробуйте обновить страницу.
    </div>

    <!-- Состояние загрузки -->
    <div v-else-if="store.pending" class="py-16 text-center text-neutral-400 text-sm">
      Загрузка ваших объектов...
    </div>

    <!-- Если у клиента нет привязанных адресов -->
    <div v-else-if="store.addresses.length === 0" class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-12 text-center space-y-3 shadow-xs">
      <div class="w-12 h-12 mx-auto rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400">
        <UIcon name="i-lucide-home" class="w-6 h-6" />
      </div>
      <h3 class="font-medium text-neutral-900 dark:text-white">Нет привязанных объектов</h3>
      <p class="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
        К вашему аккаунту пока не привязано ни одного адреса. Обратитесь к администратору или монтажнику для настройки доступа.
      </p>
    </div>

    <!-- Список адресов и оборудования -->
    <div v-else class="space-y-6">
      <div
        v-for="addr in store.addresses"
        :key="addr.address_id"
        class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-xs space-y-4"
      >
        <!-- Название адреса -->
        <div class="flex items-center gap-3 pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <div class="p-2.5 rounded-xl bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400">
            <UIcon name="i-lucide-map-pin" class="w-5 h-5" />
          </div>
          <div>
            <h2 class="font-semibold text-neutral-900 dark:text-white">
              {{ addr.address_name }}
            </h2>
            <p class="text-xs text-neutral-400">Объект недвижимости</p>
          </div>
        </div>

        <!-- Список оборудования на объекте -->
        <div class="space-y-3">
          <h3 class="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Оборудование на объекте ({{ addr.devices?.length || 0 }})
          </h3>

          <div v-if="!addr.devices || addr.devices.length === 0" class="py-4 text-center text-xs text-neutral-400 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl">
            На этом объекте пока нет зарегистрированного оборудования.
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div
              v-for="device in addr.devices"
              :key="device.device_id"
              class="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between text-sm"
            >
              <div class="flex items-center gap-3">
                <div class="p-2 rounded-lg bg-neutral-200/70 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300">
                  <UIcon :name="device.device_type === 'CAMERA' ? 'i-lucide-video' : 'i-lucide-phone-call'" class="w-4 h-4" />
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <span class="font-medium text-neutral-900 dark:text-white text-xs sm:text-sm">
                      {{ device.device_name }}
                    </span>
                    <span class="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 font-semibold">
                      {{ device.device_type === 'CAMERA' ? 'Камера' : 'Панель' }}
                    </span>
                  </div>
                  <p class="text-xs text-neutral-400 mt-0.5">
                    <span v-if="device.ip">IP: {{ device.ip }}</span>
                    <span v-if="device.port">:{{ device.port }}</span>
                    <span v-if="!device.ip && !device.port">Параметры сети не указаны</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
