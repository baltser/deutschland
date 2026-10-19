<script setup lang="ts">

definePageMeta({ layout: 'admin' })

const route = useRoute()
const addressId = (Array.isArray(route.params.id) ? route.params.id[0] : route.params.id) || ''

// Данные адреса
const { data: addressData, pending, error, refresh } = await useFetch(`/api/admin/addresses/${addressId}`)
const address = computed(() => addressData.value?.address)

// Подключаем логику клиентов из composable
const {
  clientPhone,
  clientName,
  isAddingClient,
  handlePhoneInput,
  handleAddClient
} = useAddressClients(addressId, refresh)

useSeoMeta({
  title: computed(() => address.value ? `Адрес: ${address.value.address_name}` : 'Детали адреса'),
  description: 'Управление объектом и привязанными клиентами'
})
</script>

<template>
  <div class="p-6 md:p-8 space-y-8 max-w-5xl mx-auto">
    <!-- Шапка и навигация назад -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div class="space-y-1">
        <div class="flex items-center gap-2">
          <UButton
            to="/admin/addresses"
            variant="ghost"
            color="neutral"
            size="xs"
            icon="i-lucide-arrow-left"
          >
            Назад к списку
          </UButton>
          <span class="text-xs text-neutral-400">/ Объект #{{ addressId }}</span>
        </div>
        <h1 class="text-2xl font-bold text-neutral-900 dark:text-white">
          {{ pending ? 'Загрузка адреса...' : address?.address_name }}
        </h1>
      </div>
    </div>

    <!-- Ошибка / Загрузка -->
    <div v-if="error" class="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-2xl p-6 text-red-600 dark:text-red-400 text-sm">
      Не удалось загрузить данные адреса. Возможно, он был удален.
    </div>

    <div v-else-if="pending" class="py-16 text-center text-neutral-400 text-sm">
      Загрузка информации об объекте...
    </div>

    <template v-else>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Карточка клиентов -->
        <AdminAddressesClientsCard
          v-model:client-name="clientName"
          v-model:client-phone="clientPhone"
          :clients="address?.clients || []"
          :is-adding="isAddingClient"
          @phone-input="handlePhoneInput"
          @add="handleAddClient"
        />

        <!-- Карточка оборудования (заглушка) -->
        <AdminAddressesDevicesPlaceholder
          :devices="address?.devices || []"
          :address-id="addressId"
          @refresh="refresh"
        />
      </div>
    </template>
  </div>
</template>
