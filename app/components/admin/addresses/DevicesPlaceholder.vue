<script setup lang="ts">
import { useAdminDevicesStore } from '~/stores/admin/devices'

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
const devicesStore = useAdminDevicesStore()

// Состояние формы (Добавление / Редактирование)
const editingDeviceId = ref<number | null>(null)
const deviceName = ref('')
const deviceType = ref<'CAMERA' | 'PANEL'>('CAMERA')
const deviceIp = ref('')
const devicePort = ref<number | null>(null)
const deviceLogin = ref('')
const devicePassword = ref('')

// Подготовка формы к редактированию устройства
function startEdit(device: DeviceItem) {
  editingDeviceId.value = device.device_id
  deviceName.value = device.device_name
  deviceType.value = device.device_type
  deviceIp.value = device.ip || ''
  devicePort.value = device.port || null
  deviceLogin.value = device.login || ''
  devicePassword.value = '' // Пароль не подтягиваем в целях безопасности
}

// Отмена режима редактирования и сброс формы
function cancelEdit() {
  editingDeviceId.value = null
  resetForm()
}

function resetForm() {
  deviceName.value = ''
  deviceType.value = 'CAMERA'
  deviceIp.value = ''
  devicePort.value = null
  deviceLogin.value = ''
  devicePassword.value = ''
}

// Универсальный обработчик отправки (Создание или Обновление через PATCH)
async function handleSubmit() {
  if (!deviceName.value.trim()) return

  if (editingDeviceId.value) {
    // Режим обновления
    const success = await devicesStore.updateDevice(editingDeviceId.value, {
      device_name: deviceName.value.trim(),
      device_type: deviceType.value,
      ip: deviceIp.value.trim() || null,
      port: devicePort.value ? Number(devicePort.value) : null,
      login: deviceLogin.value.trim() || null,
      password: devicePassword.value.trim() || undefined // передаем только если введено
    })

    if (success) {
      cancelEdit()
      emit('refresh')
    }
  } else {
    // Режим создания
    const success = await devicesStore.createDevice(props.addressId, {
      device_name: deviceName.value.trim(),
      device_type: deviceType.value,
      ip: deviceIp.value.trim() || undefined,
      port: devicePort.value ? Number(devicePort.value) : undefined,
      login: deviceLogin.value.trim() || undefined,
      password: devicePassword.value.trim() || undefined
    })

    if (success) {
      resetForm()
      emit('refresh')
    }
  }
}

// Удаление устройства
async function handleDelete(deviceId: number) {
  if (!confirm('Вы действительно хотите удалить это устройство с объекта?')) return

  const success = await devicesStore.deleteDevice(deviceId)
  if (success) {
    // Если удалили устройство, которое в данный момент редактировали — сбрасываем форму
    if (editingDeviceId.value === deviceId) {
      cancelEdit()
    }
    emit('refresh')
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

    <!-- Форма добавления / редактирования -->
    <form class="space-y-3 pt-2 border-t border-neutral-100 dark:border-neutral-800" @submit.prevent="handleSubmit">

      <!-- Шапка режима редактирования (показывается, когда выбран элемент) -->
      <div v-if="editingDeviceId" class="flex items-center justify-between bg-purple-50/50 dark:bg-purple-950/30 px-3 py-1.5 rounded-lg border border-purple-100 dark:border-purple-900/50">
        <span class="text-xs font-medium text-purple-700 dark:text-green-300">
          Редактирование устройства #{{ editingDeviceId }}
        </span>
        <UButton size="xs" variant="ghost" color="neutral" @click="cancelEdit">Отмена</UButton>
      </div>

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
            <option value="PANEL">📱 Вызывная панель</option>
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
            :placeholder="editingDeviceId ? 'Новый пароль (оставьте пустым, если не меняется)' : 'Пароль'"
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
          :loading="devicesStore.loading || devicesStore.actionLoadingId !== null"
          :icon="editingDeviceId ? 'i-lucide-save' : 'i-lucide-plus'"
        >
          {{ editingDeviceId ? 'Сохранить изменения' : 'Добавить устройство' }}
        </UButton>
      </div>
    </form>

    <!-- Список устройств с кнопками управления -->
    <div class="space-y-2 pt-2">
      <div v-if="!devices || devices.length === 0" class="py-6 text-center text-xs text-neutral-400 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl">
        Оборудование не добавлено
      </div>

      <div
        v-for="device in devices"
        :key="device.device_id"
        class="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between text-sm gap-2"
      >
        <div class="flex items-center gap-3 min-w-0">
          <div class="p-2 rounded-lg bg-neutral-200/70 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 shrink-0">
            <UIcon :name="device.device_type === 'CAMERA' ? 'lucide:cctv' : 'lucide:grid-3x3'" class="w-4 h-4" />
          </div>
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <span class="font-medium text-neutral-900 dark:text-white text-xs sm:text-sm truncate">{{ device.device_name }}</span>
              <span class="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 font-semibold shrink-0">
                {{ device.device_type === 'CAMERA' ? 'Камера' : 'Панель' }}
              </span>
            </div>
            <p class="text-xs text-neutral-400 mt-0.5 truncate">
              <span v-if="device.ip">IP: {{ device.ip }}</span>
              <span v-if="device.port">:{{ device.port }}</span>
              <span v-if="device.login"> Логин: {{ device.login }}</span>
              <span v-if="!device.ip && !device.port">Параметры не указаны</span>
            </p>
          </div>
        </div>

        <!-- Кнопки управления (Редактировать / Удалить) -->
        <div class="flex items-center gap-1 shrink-0">
          <UButton
            size="xs"
            variant="ghost"
            color="neutral"
            icon="i-lucide-pencil"
            @click="startEdit(device)"
          />
          <UButton
            size="xs"
            variant="ghost"
            color="error"
            icon="i-lucide-trash-2"
            :loading="devicesStore.actionLoadingId === device.device_id"
            @click="handleDelete(device.device_id)"
          />
        </div>
      </div>
    </div>
  </div>
</template>
