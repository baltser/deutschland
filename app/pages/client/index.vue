<script setup lang="ts">
import { useClientAddressesStore } from '~/stores/client/addresses'
import { useClientNumbersStore } from '~/stores/client/numbers'
import { validateCarNumber, normalizeCarNumber } from '~/utils/inputCarNumber'
import type { FormState } from '~/components/client/address/number/Form.vue'

definePageMeta({ layout: 'client' })

const addressStore = useClientAddressesStore()
const numbersStore = useClientNumbersStore()

useSeoMeta({
  title: 'Мои объекты и доступы',
  description: 'Интеллектуальная система управления доступом',
})

onMounted(async () => {
  await numbersStore.fetchActiveNumbers()
  if (addressStore.addresses.length === 0) {
    await addressStore.fetchAddresses()
  }
})

// Интерфейсы для строгой типизации объектов и устройств
interface AddressDevice {
  device_id: number
  device_name: string
}

interface AddressItem {
  address_id: number
  address_name: string
  devices?: AddressDevice[]
}

// Реактивные формы для каждого объекта
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

const toggleDeviceSelection = (addressId: number, deviceId: number) => {
  const form = getForm(addressId)
  const index = form.selectedDeviceIds.indexOf(deviceId)
  if (index > -1) {
    form.selectedDeviceIds.splice(index, 1)
  } else {
    form.selectedDeviceIds.push(deviceId)
  }
}

// Обработка отправки формы
const handleAddressSubmit = async (addr: AddressItem) => {
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
    await numbersStore.createPass({
      carNumber: normalizedNumber,
      totalHours: form.totalHours,
      comment: form.comment,
      deviceIds: form.selectedDeviceIds
    })

    form.carNumber = ''
    form.comment = ''
  } catch (err: unknown) {
    const error = err as { data?: { message?: string }; message?: string }
    form.error = error.data?.message || error.message || 'Не удалось выписать пропуск'
  } finally {
    form.submitting = false
  }
}

// Отзыв номеров по их ID записей
const handleRevokeRecords = async (records: { id: number | string; deviceId: number }[]) => {
  const recordIds = records.map(r => r.id)
  await numbersStore.revokePass(recordIds)
}

// Получение активных номеров через стор с точной типизацией
const getActiveNumbers = (addressId: number) => {
  const addr = (addressStore.addresses as AddressItem[]).find(a => a.address_id === addressId)
  const deviceIds = addr?.devices?.map((d: AddressDevice) => d.device_id) || []
  return numbersStore.getNumbersForDevices(deviceIds)
}
</script>

<template>
  <div class="space-y-6 max-w-5xl mx-auto pb-12">
    <!-- Баннер-шапка -->
    <ClientAddressHeader
      :pending="addressStore.pending"
      @refresh="async () => {
        await addressStore.fetchAddresses();
        await numbersStore.fetchActiveNumbers();
      }"
    />

    <!-- Ошибка загрузки -->
    <div v-if="addressStore.error" class="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-2xl p-6 text-red-600 dark:text-red-400 text-sm">
      Не удалось загрузить объекты. Попробуйте обновить страницу.
    </div>

    <!-- Загрузка -->
    <div v-else-if="addressStore.pending" class="py-16 text-center text-neutral-400 text-sm">
      <UIcon name="i-lucide-loader-2" class="w-6 h-6 animate-spin mx-auto mb-2 text-primary-500" />
      Подключение к оборудованию...
    </div>

    <!-- Список объектов -->
    <div v-else class="space-y-4">
      <div
        v-for="addr in addressStore.addresses"
        :key="addr.address_id"
        class="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-3xl shadow-sm hover:shadow-md transition-all overflow-hidden"
      >
        <!-- Шапка объекта с устройствами и формой ввода -->
        <ClientAddressCardHeader
          :address-name="addr.address_name"
          :active-passes-count="getActiveNumbers(addr.address_id).length"
          :devices="addr.devices || []"
          :form="getForm(addr.address_id)"
          @toggle-device="toggleDeviceSelection(addr.address_id, $event)"
          @submit-form="handleAddressSubmit(addr)"
        />

        <!-- Блок активных номеров -->
        <div class="p-6 pt-2 bg-white dark:bg-neutral-900">
          <ClientAddressNumberList
            :active-numbers="getActiveNumbers(addr.address_id)"
            :devices="addr.devices || []"
            @revoke="handleRevokeRecords"
          />

        </div>
      </div>
    </div>
  </div>
</template>
