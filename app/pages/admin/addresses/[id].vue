<script setup lang="ts">
import { useAdminAddressesStore } from '~/stores/admin/addresses'
import type AppImportClientsTableModal from '~/components/app/ImportClientsTableModal.vue'
// 💡 Импортируем тип устройства прямо из компонента DevicesPlaceholder, чтобы типы сошлись на 100%
import type { DeviceItem } from '~/components/admin/addresses/DevicesPlaceholder.vue'

definePageMeta({ layout: 'admin' })

const route = useRoute()
const addressId = (Array.isArray(route.params.id) ? route.params.id[0] : route.params.id) || ''

const addressStore = useAdminAddressesStore()
const {
  currentAddress: address,
  loading: pending,
  error,
  addressClients: rawClients,
  addressClientsTotal: totalClients,
  addressClientsPage: currentPage,
  addressClientsLimit: limit,
  addressClientsLoading: clientsLoading
} = storeToRefs(addressStore)

// Приводим клиентов к типу AdminClient (с обязательным role_name и чистыми адресами)
const clients = computed(() => {
  return (rawClients.value || []).map((client) => ({
    user_id: client.user_id,
    user_name: client.user_name,
    phone: client.phone,
    email: client.email,
    avatar_path: client.avatar_path,
    activated_at: client.activated_at,
    role_name: (client as unknown as { role_name?: string }).role_name || 'client',
    addresses: (client.addresses || [])
      .filter((addr): addr is { address_id: number; address: { address_id: number; address_name: string } } => Boolean(addr.address))
      .map(addr => ({
        address: addr.address!
      }))
  }))
})

// Приводим устройства к типу DeviceItem[], требуемому компонентом DevicesPlaceholder
const formattedDevices = computed<DeviceItem[]>(() => {
  if (!address.value?.devices) return []
  return address.value.devices.map((device) => ({
    ...device,
    device_type: (device.device_type === 'PANEL' ? 'PANEL' : 'CAMERA') as 'CAMERA' | 'PANEL'
  }))
})

// Стейт формы
const clientPhone = ref('')
const clientName = ref('')
const searchQuery = ref('')
const isAddingClient = ref(false)

// Стейт удаления объекта
const isDeleting = ref(false)

// Стейт импорта
const isImportModalOpen = ref(false)
const isImportingFile = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)
const importModalRef = ref<InstanceType<typeof AppImportClientsTableModal> | null>(null)

onMounted(async () => {
  await addressStore.fetchAddressById(addressId)
  await addressStore.fetchClientsForAddress(addressId, 1, '')
})

const refresh = async () => {
  await addressStore.fetchAddressById(addressId)
  await addressStore.fetchClientsForAddress(addressId, currentPage.value, searchQuery.value)
}

// Дебаунс поиск через watch за переменной searchQuery
let searchTimeout: NodeJS.Timeout
watch(searchQuery, (newVal) => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(async () => {
    await addressStore.fetchClientsForAddress(addressId, 1, newVal)
  }, 300)
})

// Обработка выбора файла на уровне страницы
function handleFileSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  isImportModalOpen.value = true
  importModalRef.value?.triggerFileInput()
  input.value = ''
}

// Пагинация
async function handlePageChange(newPage: number) {
  await addressStore.fetchClientsForAddress(addressId, newPage, searchQuery.value)
}

// Добавление клиента
async function handleAddClient() {
  if (!clientPhone.value || clientPhone.value.length < 10) return

  isAddingClient.value = true
  try {
    await addressStore.addClientToAddress(addressId, {
      phone: clientPhone.value,
      user_name: clientName.value.trim() || undefined
    })

    clientPhone.value = ''
    clientName.value = ''
    await addressStore.fetchClientsForAddress(addressId, currentPage.value, searchQuery.value)
  } catch {
    console.log('Ошибка уже обработана в сторе')
  } finally {
    isAddingClient.value = false
  }
}

// Удаление объекта
async function handleDeleteAddress() {
  const confirmed = window.confirm(
    `Вы уверены, что хотите удалить объект "${address.value?.address_name || ''}"?\nВсе привязанные устройства и связанные данные будут удалены.`
  )
  if (!confirmed) return

  isDeleting.value = true
  try {
    await addressStore.deleteAddress(addressId)
  } finally {
    isDeleting.value = false
  }
}

useSeoMeta({
  title: computed(() => address.value ? `Адрес: ${address.value.address_name}` : 'Детали адреса'),
  description: 'Управление объектом и привязанными клиентами'
})
</script>

<template>
  <div class="p-6 md:p-8 space-y-8 max-w-5xl mx-auto">
    <!-- Шапка и навигация -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div class="space-y-1">
        <div class="flex items-center gap-2">
          <UButton to="/admin/addresses" variant="ghost" color="neutral" size="xs" icon="i-lucide-arrow-left">
            Назад к списку
          </UButton>
          <span class="text-xs text-neutral-400">/ Объект #{{ addressId }}</span>
        </div>
        <h1 class="text-2xl font-bold text-neutral-900 dark:text-white">
          {{ pending && !address ? 'Загрузка адреса...' : address?.address_name }}
        </h1>
      </div>

      <!-- Кнопка удаления объекта -->
      <UButton
        color="error"
        variant="subtle"
        size="sm"
        icon="i-lucide-trash-2"
        :loading="isDeleting"
        @click="handleDeleteAddress"
      >
        Удалить объект
      </UButton>
    </div>

    <!-- Скрытый инпут для импорта файлов -->
    <input
      ref="fileInputRef"
      type="file"
      accept=".txt,.xls,.xlsx,.csv"
      class="hidden"
      @change="handleFileSelected"
    >

    <!-- Основной контент -->
    <template v-if="!error">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="space-y-6">
          <AdminAddressesClientsAddForm
            v-model:client-name="clientName"
            v-model:client-phone="clientPhone"
            :is-adding="isAddingClient"
            :total-clients="totalClients"
            :is-importing-file="isImportingFile"
            @add="handleAddClient"
            @open-import="fileInputRef?.click()"
          />

          <AdminAddressesClientsTable
            v-model:search-query="searchQuery"
            :clients="clients"
            :loading="clientsLoading"
            :total-clients="totalClients"
            :current-page="currentPage"
            :limit="limit"
            @update:current-page="handlePageChange"
          />
        </div>

        <div>
          <AdminAddressesDevicesPlaceholder
            :devices="formattedDevices"
            :address-id="Number(addressId)"
            @refresh="refresh"
          />
        </div>
      </div>
    </template>

    <!-- Модальное окно импорта -->
    <AppImportClientsTableModal
      ref="importModalRef"
      v-model="isImportModalOpen"
      v-model:uploading="isImportingFile"
      :address-id="addressId"
      @imported="refresh"
    />
  </div>
</template>
