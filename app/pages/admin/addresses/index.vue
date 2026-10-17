<script setup lang="ts">
import { useAdminAddresses } from '~/composables/admin/addresses/useAdminAddresses.ts'

definePageMeta({ layout: 'admin' })

useSeoMeta({
  title: 'Управление адресами',
  description: 'Список объектов и физических адресов'
})

const {
  addresses,
  newAddressText,
  pending,
  isSubmitting,
  handleAddAddress
} = useAdminAddresses()

// Обработка клика по адресу из списка
function handleSelectAddress(item: unknown) {
  const addressItem = item as { address_id: number }
  navigateTo(`/admin/addresses/${addressItem.address_id}`)
}

</script>

<template>
  <div class="p-6 md:p-8 space-y-8 max-w-5xl mx-auto">
    <!-- Шапка страницы -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h1 class="text-2xl font-bold text-neutral-900 dark:text-white">Адреса и объекты</h1>
        <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Добавление физических адресов и управление объектами</p>
      </div>

      <UButton
        to="/admin"
        variant="ghost"
        color="neutral"
        size="sm"
        icon="i-lucide-arrow-left"
      >
        На главную
      </UButton>
    </div>

    <!-- Компонент формы добавления -->
    <AdminAddressesAddForm
      v-model="newAddressText"
      :is-submitting="isSubmitting"
      @submit="handleAddAddress"
    />

    <!-- Компонент списка адресов -->
    <AdminAddressesList
      :addresses="addresses"
      :pending="pending"
      @select="handleSelectAddress"
    />
  </div>
</template>
