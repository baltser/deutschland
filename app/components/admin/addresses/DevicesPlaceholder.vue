<script setup lang="ts">
export interface DeviceItem {
  device_id: number
  device_name: string
  device_type: 'CAMERA' | 'PANEL'
  ip?: string | null
  port?: number | null
  login?: string | null
  password?: string | null
}

const props = defineProps<{
  devices: DeviceItem[]
  addressId: string | number
}>()

const emit = defineEmits(['refresh'])
const toast = useToast()

// Состояние формы
const deviceName = ref('')
const deviceType = ref<'CAMERA' | 'PANEL'>('CAMERA')
const deviceIp = ref('')
const devicePort = ref<number | null>(null)
const deviceLogin = ref('')
const devicePassword = ref('')
const isAdding = ref(false)

async function handleAddDevice() {
  if (!deviceName.value.trim()) {
    toast.add({ title: 'Ошибка', description: 'Укажите название устройства', color: 'error' })
    return
  }

  isAdding.value = true
  try {
    await $fetch(`/api/admin/addresses/${props.addressId}/devices`, {
      method: 'POST',
      body: {
        device_name: deviceName.value.trim(),
        device_type: deviceType.value,
        ip: deviceIp.value.trim() || undefined,
        port: devicePort.value ? Number(devicePort.value) : undefined,
        login: deviceLogin.value.trim() || undefined,
        password: devicePassword.value.trim() || undefined
      }
    })

    // Сброс формы
    deviceName.value = ''
    deviceType.value = 'CAMERA'
    deviceIp.value = ''
    devicePort.value = null
    deviceLogin.value = ''
    devicePassword.value = ''

    toast.add({
      title: 'Успешно',
      description: 'Устройство добавлено к объекту',
      color: 'success'
    })

    emit('refresh')
  } catch (err: unknown) {
    const fetchErr = err as { data?: { message?: string } }
    toast.add({
      title: 'Ошибка',
      description: fetchErr.data?.message || 'Не удалось добавить устройство',
      color: 'error'
    })
  } finally {
    isAdding.value = false
  }
}
</script>

<template>
  <div class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm space-y-4">
    <!-- Шапка карточки -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
          <UIcon name="i-lucide-cpu" class="w-5 h-5" />
        </div>
        <div>
          <h2 class="font-semibold text-neutral-900 dark:text-white text-sm">Оборудование</h2>
          <p class="text-xs text-neutral-500 dark:text-neutral-400">Камеры и вызывные панели объекта</p>
        </div>
      </div>
      <span class="text-xs px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-medium">
        {{ devices?.length || 0 }}
      </span>
    </div>

    <!-- Форма добавления со всеми полями -->
    <form class="space-y-3 pt-2 border-t border-neutral-100 dark:border-neutral-800" @submit.prevent="handleAddDevice">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">

        <!-- Название (на всю ширину) -->
        <div class="sm:col-span-2">
          <UInput
            v-model="deviceName"
            placeholder="Название (например, Камера у ворот)"
            icon="i-lucide-video"
            size="sm"
          />
        </div>

        <!-- Тип устройства -->
        <div>
          <select
            v-model="deviceType"
            class="w-full h-8 px-2.5 text-xs bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="CAMERA">📹 Камера</option>
            <option value="PANEL">🚪 Вызывная панель</option>
          </select>
        </div>

        <!-- IP-адрес -->
        <UInput
          v-model="deviceIp"
          placeholder="IP (192.168.1.10)"
          icon="i-lucide-globe"
          size="sm"
        />

        <!-- Порт -->
        <UInput
          v-model.number="devicePort"
          type="number"
          placeholder="Порт (80 / 37777)"
          icon="i-lucide-hash"
          size="sm"
        />

        <!-- Логин -->
        <UInput
          v-model="deviceLogin"
          placeholder="Логин (admin)"
          icon="i-lucide-user"
          size="sm"
        />

        <!-- Пароль (на всю ширину) -->
        <div class="sm:col-span-2">
          <UInput
            v-model="devicePassword"
            type="password"
            placeholder="Пароль"
            icon="i-lucide-key"
            size="sm"
          />
        </div>
      </div>

      <div class="flex justify-end pt-1">
        <UButton
          type="submit"
          color="primary"
          size="sm"
          :loading="isAdding"
          icon="i-lucide-plus"
        >
          Добавить устройство
        </UButton>
      </div>
    </form>

    <!-- Список устройств -->
    <div class="space-y-2 pt-2">
      <div v-if="!devices || devices.length === 0" class="py-6 text-center text-xs text-neutral-400 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl">
        Оборудование не добавлено
      </div>

      <div
        v-for="device in devices"
        :key="device.device_id"
        class="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between text-sm"
      >
        <div class="flex items-center gap-3">
          <div class="p-2 rounded-lg bg-neutral-200/70 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300">
            <UIcon :name="device.device_type === 'CAMERA' ? 'i-lucide-video' : 'i-lucide-phone-call'" class="w-4 h-4" />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="font-medium text-neutral-900 dark:text-white text-xs sm:text-sm">{{ device.device_name }}</span>
              <span class="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 font-semibold">
                {{ device.device_type === 'CAMERA' ? 'Камера' : 'Панель' }}
              </span>
            </div>
            <p class="text-xs text-neutral-400 mt-0.5">
              <span v-if="device.ip">IP: {{ device.ip }}</span>
              <span v-if="device.port">:{{ device.port }}</span>
              <span v-if="device.login"> • Логин: {{ device.login }}</span>
              <span v-if="!device.ip && !device.port">Параметры не указаны</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
