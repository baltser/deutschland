<script setup lang="ts">
import { useAdminAddressesStore } from '~/stores/admin/addresses'
import { useAdminPassesStore } from '~/stores/admin/passes'
import { validateCarNumber, normalizeCarNumber } from '~/utils/inputCarNumber'
import type { FormState } from '~/components/client/address/number/Form.vue'

definePageMeta({ layout: 'admin' })

const addressStore = useAdminAddressesStore()
const passesStore = useAdminPassesStore()

useSeoMeta({
  title: 'Управление пропусками и мониторинг камер',
  description: 'Панель администратора: список объектов, статистика устройств и контроль доступов',
})

const searchQuery = ref<string>('')
const activeAddressId = ref<number | null>(null) // ID выбранного для развертывания адреса

onMounted(async () => {
  // Грузим только легкие данные из базы — никаких сетевых запросов к камерам при открытии!
  await passesStore.fetchActiveNumbers()
  if (addressStore.addresses.length === 0) {
    await addressStore.fetchAddresses()
  }
})

interface AddressDevice {
  device_id: number
  device_name: string
  device_type: string
  ip?: string
}

interface AddressItem {
  address_id: number
  address_name: string
  devices?: AddressDevice[]
}

// Статистика устройств на основе данных из стора
const deviceStats = computed(() => {
  const allDevices = (addressStore.addresses as AddressItem[]).flatMap(addr => addr.devices ?? [])
  const total = allDevices.length
  let online = 0
  let offline = 0

  for (const device of allDevices) {
    const state = passesStore.deviceStatuses[device.device_id]
    if (!state) continue
    if (state.status === 200) {
      online++
    } else {
      offline++
    }
  }

  return {
    total,
    online,
    offline,
    unchecked: total - (online + offline)
  }
})

// Фильтрация полного списка объектов по поисковому запросу
const filteredAddresses = computed(() => {
  const list = addressStore.addresses as AddressItem[]
  const query = searchQuery.value.trim().toLowerCase()

  if (!query) return list

  return list.filter(addr => {
    const matchAddress = addr.address_name.toLowerCase().includes(query)
    const matchDevice = addr.devices?.some(d => d.device_name.toLowerCase().includes(query))
    return matchAddress || matchDevice
  })
})

const addressForms = reactive<Record<number, FormState>>({})

const getForm = (addressId: number): FormState => {
  if (!addressForms[addressId]) {
    const addr = (addressStore.addresses as AddressItem[]).find(a => a.address_id === addressId)
    addressForms[addressId] = {
      carNumber: '',
      totalHours: 3,
      comment: '',
      selectedDeviceIds: addr?.devices?.map((d: AddressDevice) => d.device_id) || [],
      error: '',
      submitting: false
    }
  }
  return addressForms[addressId]
}

const toggleDeviceSelection = (addressId: number, deviceId: number): void => {
  const form = getForm(addressId)
  const index = form.selectedDeviceIds.indexOf(deviceId)
  if (index > -1) {
    form.selectedDeviceIds.splice(index, 1)
  } else {
    form.selectedDeviceIds.push(deviceId)
  }
}

const handleAddressSubmit = async (addr: AddressItem): Promise<void> => {
  const form = getForm(addr.address_id)
  form.error = ''

  const validation = validateCarNumber(form.carNumber)
  if (!validation.isValid) {
    form.error = validation.error || 'Неверный формат номера'
    return
  }

  if (form.selectedDeviceIds.length === 0) {
    form.error = 'Выберите хотя бы одно устройство'
    return
  }

  form.submitting = true
  const normalizedNumber = normalizeCarNumber(form.carNumber)

  try {
    await passesStore.createPass({
      carNumber: normalizedNumber,
      totalHours: form.totalHours,
      comment: form.comment,
      deviceIds: form.selectedDeviceIds
    })

    form.carNumber = ''
    form.comment = ''
  } catch (err: unknown) {
    const error = err as { data?: { message?: string }; message?: string }
    form.error = error.data?.message ?? error.message ?? 'Не удалось выписать пропуск'
  } finally {
    form.submitting = false
  }
}

const handleRevokeRecords = async (records: Array<{ id: number | string; deviceId: number }>): Promise<void> => {
  const recordIds = records.map(r => r.id)
  await passesStore.revokePass(recordIds)
}

const getActiveNumbers = (addressId: number) => {
  const addr = (addressStore.addresses as AddressItem[]).find(a => a.address_id === addressId)
  const deviceIds = addr?.devices?.map((d: AddressDevice) => d.device_id) || []
  return passesStore.getNumbersForDevices(deviceIds)
}
</script>

<template>
  <div class="relative min-h-screen py-2 px-1 sm:px-4">
    <div
      class="fixed inset-0 pointer-events-none z-0 transition-opacity duration-300 opacity-70 dark:opacity-55 bg-repeat bg-[length:550px_auto]"
      style="background-image: url('/images/background/background-numbers.jpeg');"
    />
    <div
      class="fixed inset-0 pointer-events-none z-0 bg-gradient-to-b from-slate-100/40 via-slate-100/50 to-slate-200/60 dark:from-neutral-950/45 dark:via-neutral-950/60 dark:to-neutral-900/75"
    />

    <div class="relative z-10 space-y-6 max-w-5xl mx-auto pb-12">

      <!-- Шапка и Дашборд -->
      <div class="bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border border-neutral-200/80 dark:border-neutral-800/80 rounded-3xl p-6 shadow-md space-y-4">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 class="text-xl font-bold text-neutral-900 dark:text-white">
              Управление пропусками и мониторинг камер
            </h1>
            <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Все объекты системы. Нажмите «Управлять» на нужном объекте для выписки пропусков.
            </p>
          </div>

          <div class="flex items-center gap-2">
            <UButton
              icon="i-lucide-activity"
              color="neutral"
              variant="subtle"
              size="sm"
              :loading="passesStore.checkingDevices"
              @click="passesStore.checkAllDevicesStatus"
            >
              Проверить связи
            </UButton>
            <UButton
              icon="i-lucide-refresh-cw"
              color="neutral"
              variant="subtle"
              size="sm"
              :loading="addressStore.loading || passesStore.loading"
              @click="async () => {
                await addressStore.fetchAddresses();
                await passesStore.fetchActiveNumbers();
              }"
            >
              Обновить данные
            </UButton>
          </div>
        </div>

        <!-- Виджет статистики -->
        <div class="grid grid-cols-3 gap-3 pt-2 border-t border-neutral-200/60 dark:border-neutral-800/60">
          <div class="bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/70 dark:border-neutral-700/60 rounded-2xl p-3 text-center">
            <div class="text-xs text-neutral-500 dark:text-neutral-400">Всего устройств</div>
            <div class="text-lg font-bold text-neutral-900 dark:text-white">{{ deviceStats.total }}</div>
          </div>
          <div class="bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-900/50 rounded-2xl p-3 text-center">
            <div class="text-xs text-emerald-600 dark:text-emerald-400">Штатно (Online)</div>
            <div class="text-lg font-bold text-emerald-700 dark:text-emerald-300">{{ deviceStats.online }}</div>
          </div>
          <div class="bg-red-50/60 dark:bg-red-950/30 border border-red-200/70 dark:border-red-900/50 rounded-2xl p-3 text-center">
            <div class="text-xs text-red-600 dark:text-red-400">С ошибками</div>
            <div class="text-lg font-bold text-red-700 dark:text-red-300">{{ deviceStats.offline }}</div>
          </div>
        </div>

        <!-- Поиск по списку -->
        <div class="pt-2">
          <UInput
            v-model="searchQuery"
            icon="i-lucide-search"
            placeholder="Фильтрация объектов по названию или камере..."
            size="md"
            clearable
            class="w-full"
          />
        </div>
      </div>

      <!-- Ошибка / Загрузка -->
      <div v-if="addressStore.error" class="bg-red-50/90 dark:bg-red-950/60 backdrop-blur-md border border-red-200 dark:border-red-900 rounded-2xl p-6 text-red-600 dark:text-red-400 text-sm">
        Не удалось загрузить объекты системы. Попробуйте обновить страницу.
      </div>

      <div v-else-if="addressStore.loading" class="py-16 text-center text-neutral-400 text-sm">
        <UIcon name="i-lucide-loader-2" class="w-6 h-6 animate-spin mx-auto mb-2 text-primary-500" />
        Загрузка инфраструктуры объектов...
      </div>

      <!-- Если ничего не найдено по фильтру -->
      <div v-else-if="filteredAddresses.length === 0" class="py-16 text-center text-neutral-400 text-sm bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md rounded-3xl border border-neutral-200/80 dark:border-neutral-800/80">
        По запросу «{{ searchQuery }}» ничего не найдено.
      </div>

      <!-- Список всех объектов -->
      <div v-else class="space-y-4">
        <div
          v-for="addr in filteredAddresses"
          :key="addr.address_id"
          class="bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border border-neutral-200/80 dark:border-neutral-800/80 rounded-3xl shadow-md transition-all overflow-hidden"
        >
          <!-- Если объект НЕ выбран для управления — показываем компактную плашку -->
          <div v-if="activeAddressId !== addr.address_id" class="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 class="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <UIcon name="i-lucide-map-pin" class="w-4 h-4 text-primary-500" />
                {{ addr.address_name }}
              </h2>
              <div class="text-xs text-neutral-500 dark:text-neutral-400 mt-1 flex items-center gap-3">
                <span>Устройств: <strong>{{ addr.devices?.length || 0 }}</strong></span>
                <span>Активных пропусков: <strong>{{ getActiveNumbers(addr.address_id).length }}</strong></span>
              </div>
            </div>

            <UButton
              color="primary"
              variant="subtle"
              size="sm"
              icon="i-lucide-sliders-horizontal"
              @click="activeAddressId = addr.address_id"
            >
              Управлять объектом
            </UButton>
          </div>

          <!-- Если объект выбран (активирован) — разворачиваем полную форму и управление пропусками -->
          <div v-else class="space-y-2">
            <div class="bg-primary-50/60 dark:bg-primary-950/30 px-6 py-3 border-b border-primary-100 dark:border-primary-900/50 flex justify-between items-center">
              <span class="text-xs font-medium text-primary-700 dark:text-primary-300 flex items-center gap-1.5">
                <UIcon name="i-lucide-check-circle-2" class="w-4 h-4 text-primary-500" />
                Режим управления активен: <strong>{{ addr.address_name }}</strong>
              </span>
              <UButton
                size="xs"
                color="neutral"
                variant="ghost"
                icon="i-lucide-x"
                @click="activeAddressId = null"
              >
                Свернуть
              </UButton>
            </div>

            <ClientAddressCardHeader
              :address-name="addr.address_name"
              :active-passes-count="getActiveNumbers(addr.address_id).length"
              :devices="addr.devices || []"
              :form="getForm(addr.address_id)"
              @toggle-device="toggleDeviceSelection(addr.address_id, $event)"
              @submit-form="handleAddressSubmit(addr)"
            />

            <div class="p-6 pt-2 bg-transparent">
              <ClientAddressNumberList
                :active-numbers="getActiveNumbers(addr.address_id)"
                :devices="addr.devices || []"
                @revoke="handleRevokeRecords"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
