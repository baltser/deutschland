<script setup lang="ts">
import type { FormState } from '~/components/client/address/number/Form.vue'
import DeviceSelector, { type Device } from '~/components/client/address/card/DeviceSelector.vue'

const form = defineModel<FormState>('form', { required: true })

defineProps<{
  addressName: string
  activePassesCount?: number
  devices?: Device[]
}>()

const emit = defineEmits<{
  toggleDevice: [deviceId: number]
  submitForm: []
}>()
</script>

<template>
  <div class="relative overflow-hidden p-6 bg-white/95 dark:bg-neutral-900/95 space-y-4">
    <!-- Фоновое изображение формы объекта -->
    <div class="absolute inset-0 z-0 pointer-events-none">
      <img
        src="/images/form-bg.jpg"
        alt="Form Background"
        class="w-full h-full object-cover opacity-25 dark:opacity-15"
      >
    </div>

    <!-- Верхняя строка: Адрес + Выбор устройств -->
    <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <!-- Левая часть: Иконка и адрес -->
      <div class="flex items-center gap-4">
        <div class="p-3.5 rounded-2xl bg-white/90 dark:bg-neutral-800/90 text-primary-600 dark:text-primary-400 border border-neutral-200/80 dark:border-neutral-700 shadow-xs flex-shrink-0">
          <UIcon name="i-lucide-building-2" class="w-6 h-6" />
        </div>
        <div>
          <h2 class="font-bold text-neutral-900 dark:text-white text-base sm:text-lg">
            {{ addressName }}
          </h2>
          <div class="flex items-center gap-3 text-xs text-neutral-600 dark:text-neutral-300 mt-1">
            <span class="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
              <span class="w-2 h-2 rounded-full bg-emerald-500"/>
              Активных пропусков: {{ activePassesCount || 0 }}
            </span>
          </div>
        </div>
      </div>

      <!-- Правая часть: Вынесенный подкомпонент устройств -->
      <DeviceSelector
        v-if="devices && devices.length > 0"
        :devices="devices"
        :selected-device-ids="form.selectedDeviceIds"
        @toggle-device="(id: number) => emit('toggleDevice', id)"
      />
    </div>

    <!-- Встроенная форма добавления номера -->
    <div class="relative z-10 pt-2 border-t border-neutral-200/60 dark:border-neutral-800/80">
      <ClientAddressNumberForm
        v-model:form="form"
        @submit="emit('submitForm')"
      />
    </div>
  </div>
</template>
