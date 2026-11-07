<script setup lang="ts">
import type { DeviceStatusInfo } from '~/stores/client/history'

const props = defineProps<{
  devicesStatus: Record<string, DeviceStatusInfo>
  getDeviceName: (deviceId: number) => string
}>()

// Функция для получения короткого имени устройства (первые 3 символа или первое слово)
const getShortName = (deviceId: number) => {
  const fullName = props.getDeviceName(deviceId)
  // Убираем технические приставки, если они есть, и берем первые буквы
  const cleanName = fullName.replace(/Device\s*#\d+/i, '').trim()
  if (!cleanName) return `#${deviceId}`
  return cleanName.slice(0, 3)
}

const getBarrierStyles = (status: string) => {
  switch (status) {
    case 'success':
      return {
        wrapper: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20',
        text: 'text-emerald-400 font-medium',
        isExpired: false
      }
    case 'error':
      return {
        wrapper: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/40 hover:bg-red-500/20',
        text: 'text-red-400 font-bold',
        isExpired: false
      }
    case 'delete':
      return {
        wrapper: 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 border-neutral-300 dark:border-neutral-700',
        text: 'text-neutral-300 font-medium',
        isExpired: false
      }
    case 'expire':
      return {
        // Убрали overflow-hidden с обертки, чтобы тултип больше не обрезался!
        wrapper: 'bg-emerald-500/5 text-neutral-400 border-emerald-500/20 hover:bg-emerald-500/10',
        text: 'text-neutral-400 font-medium',
        isExpired: true
      }
    default:
      return {
        wrapper: 'bg-neutral-100 text-neutral-400 border-neutral-200',
        text: 'text-neutral-400',
        isExpired: false
      }
  }
}
</script>

<template>
  <div class="flex items-center gap-1.5 flex-wrap max-w-sm">
    <div
      v-for="(devInfo, devId) in devicesStatus"
      :key="devId"
      class="group relative inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs cursor-pointer transition-all shadow-2xs"
      :class="getBarrierStyles(devInfo.status).wrapper"
    >
      <!-- Иконка шлагбаума / ворот -->
      <div class="relative flex items-center justify-center">
        <UIcon name="mdi:barrier" class="w-4 h-4 shrink-0" />

        <!-- Диагональная линия поверх иконки для истекших по TTL (expire) -->
        <span
          v-if="getBarrierStyles(devInfo.status).isExpired"
          class="absolute inset-[-4px] flex items-center justify-center overflow-hidden pointer-events-none"
        >
          <span class="w-full h-[1.5px] bg-emerald-500/80 -rotate-45"/>
        </span>
      </div>

      <!-- Короткое имя устройства вместо ID -->
      <span class="text-[11px] font-mono font-medium uppercase tracking-tight">
        {{ getShortName(Number(devId)) }}
      </span>

      <!-- Подробный информативный тултип при наведении (теперь работает для всех статусов) -->
      <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 pointer-events-none">
        <div class="px-3 py-2 bg-neutral-900 text-white rounded-xl shadow-2xl text-xs whitespace-nowrap space-y-1 border border-neutral-800">
          <div class="font-semibold text-neutral-200 flex items-center gap-1.5 border-b border-neutral-800 pb-1">
            <UIcon name="i-lucide-hard-drive" class="w-3.5 h-3.5 text-primary-400 shrink-0" />
            <span>{{ getDeviceName(Number(devId)) }}</span>
          </div>
          <div class="flex items-center gap-2 text-[11px]">
            <span class="text-neutral-400">Статус:</span>
            <span :class="getBarrierStyles(devInfo.status).text">
              {{ devInfo.label }}
            </span>
          </div>
        </div>
        <!-- Стрелочка тултипа -->
        <div class="w-2 h-2 bg-neutral-900 rotate-45 mx-auto -mt-1 border-r border-b border-neutral-800"/>
      </div>
    </div>
  </div>
</template>
