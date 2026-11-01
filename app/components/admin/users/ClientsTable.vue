<script setup lang="ts">
import type { ClientUser } from '~/types/user'
import { useAdminAddressesStore } from '~/stores/admin/addresses'
import { formatPhone } from '~/utils/phone'
import {useAdminClientsStore} from "~/stores/admin/users/clients.ts";

const props = withDefaults(
  defineProps<{
    clients?: ClientUser[]
    loading?: boolean
    error?: unknown
    modelValue?: string
  }>(),
  {
    clients: () => [],
    loading: false,
    error: undefined,
    modelValue: 'all',
  }
)

const emit = defineEmits<{
  select: [client: ClientUser]
  'update:modelValue': [value: string]
}>()

// 1. Подключаем стор адресов прямо в компоненте
const addressStore = useAdminAddressesStore()
const usersStore = useAdminClientsStore()

// Автоматически подгружаем список всех адресов при открытии таблицы
onMounted(() => {
  if (!addressStore.addresses.length) {
    addressStore.fetchAddresses()
  }
})

// 2. Стейт выбранных клиентов для чекбоксов
const selectedUserIds = ref<number[]>([])

// 3. Вычисляем "Выбрать все" напрямую по входящему списку clients
const isAllSelected = computed(() => {
  if (!props.clients.length) return false
  return props.clients.every(c => selectedUserIds.value.includes(c.user_id))
})

function toggleSelectAll(checked: boolean | 'indeterminate') {
  if (checked === true) {
    const currentIds = props.clients.map(c => c.user_id)
    selectedUserIds.value = Array.from(new Set([...selectedUserIds.value, ...currentIds]))
  } else {
    const filteredIds = new Set(props.clients.map(c => c.user_id))
    selectedUserIds.value = selectedUserIds.value.filter(id => !filteredIds.has(id))
  }
}

function isClientSelected(userId: number): boolean {
  return selectedUserIds.value.includes(userId)
}

function toggleClientSelection(userId: number, checked: boolean | 'indeterminate') {
  if (checked === true) {
    if (!selectedUserIds.value.includes(userId)) {
      selectedUserIds.value.push(userId)
    }
  } else {
    selectedUserIds.value = selectedUserIds.value.filter(id => id !== userId)
  }
}

// Колонки таблицы
const columns = [
  { key: 'select', label: '', class: 'w-10 text-center' },
  { key: 'index', label: '№', class: 'w-12 text-center' },
  { key: 'client', label: 'Клиент' },
  { key: 'phone', label: 'Телефон' },
  { key: 'email', label: 'Email' },
  { key: 'activated_at', label: 'Статус' },
  { key: 'addresses', label: 'Привязанные адреса' }
]
</script>

<template>
  <div class="space-y-4">
    <!-- Панель управления: Фильтр по адресам и счетчик выбранных -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg">

      <!-- Фильтр по адресам (берет адреса прямо из useAdminAddressesStore) -->
      <div class="flex items-center gap-2 w-full sm:w-auto">
        <span class="text-xs font-medium text-neutral-500 uppercase">Адрес:</span>
        <USelect
          :model-value="modelValue"
          :items="[
            { label: 'Все адреса', value: 'all' },
            ...addressStore.addresses.map(a => ({ label: a.address_name, value: String(a.address_id) }))
          ]"
          :loading="addressStore.loading"
          size="sm"
          class="w-full sm:w-64"
          @update:model-value="(val) => emit('update:modelValue', val)"
        />
      </div>

      <!-- Выбранные чекбоксы -->
      <div v-if="selectedUserIds.length > 0" class="flex items-center gap-2">
        <span class="text-xs font-medium text-primary-600 dark:text-primary-400">
          Выбрано: {{ selectedUserIds.length }}
        </span>
        <UButton size="xs" variant="ghost" color="neutral" @click="selectedUserIds = []">
          Сбросить
        </UButton>
      </div>
    </div>

    <!-- Основная таблица без локальной фильтрации -->
    <AppBaseTable
      :data="clients"
      :columns="columns"
      :loading="loading"
      :error="error"
      row-key="user_id"
      empty-text="Клиенты не найдены"
      @row-click="$emit('select', $event as ClientUser)"
    >
      <template #header-select>
        <div class="flex justify-center" @click.stop>
          <UCheckbox :model-value="isAllSelected" @update:model-value="toggleSelectAll" />
        </div>
      </template>

      <template #select="{ row }">
        <div class="flex justify-center" @click.stop>
          <UCheckbox
            v-if="row && (row as ClientUser).user_id !== undefined"
            :model-value="isClientSelected((row as ClientUser).user_id)"
            @update:model-value="(val) => toggleClientSelection((row as ClientUser).user_id, val)"
          />
        </div>
      </template>

      <template #index="{ index }">
        <span class="text-xs text-neutral-400 font-mono text-center block">
          {{ (usersStore.page - 1) * usersStore.limit + index + 1 }}
        </span>
      </template>

      <template #client="{ row }">
        <div class="font-medium text-neutral-900 dark:text-white flex items-center gap-3">
          <div class="w-7 h-7 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center font-semibold text-xs overflow-hidden shrink-0">
            <img v-if="(row as ClientUser).avatar_path" :src="`/api/files/${(row as ClientUser).avatar_path}`" class="w-full h-full object-cover">
            <span v-else>{{ (((row as ClientUser).user_name)?.[0] || 'К').toUpperCase() }}</span>
          </div>
          <span>{{ (row as ClientUser).user_name || 'Без имени' }}</span>
        </div>
      </template>

      <template #phone="{ value }">
        <span class="text-neutral-600 dark:text-neutral-400 font-mono text-xs">{{ formatPhone(String(value || '')) }}</span>
      </template>

      <template #email="{ value }">
        <span v-if="value" class="inline-flex items-center gap-1.5 text-xs text-neutral-700 dark:text-neutral-300">
          <UIcon name="i-lucide-mail" class="w-3.5 h-3.5 text-neutral-400 shrink-0" />
          {{ value }}
        </span>
        <span v-else class="text-xs text-neutral-400 italic">Не указан</span>
      </template>

      <template #activated_at="{ value }">
        <UBadge :color="value ? 'success' : 'neutral'" variant="subtle" size="xs">
          {{ value ? 'Активен' : 'Ожидает входа' }}
        </UBadge>
      </template>

      <template #addresses="{ value }">
        <div v-if="Array.isArray(value) && value.length > 0" class="flex flex-wrap gap-1.5">
        <span
          v-for="item in (value as Array<{ address_id: number; address?: { address_name?: string } }>)"
          :key="item.address_id"
          class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-xs text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700"
        >
          <UIcon name="i-lucide-map-pin" class="w-3 h-3 text-neutral-400 shrink-0" />
          {{ item.address?.address_name || `Адрес #${item.address_id}` }}
        </span>
        </div>
        <span v-else class="text-xs text-neutral-400 italic">Нет привязанных адресов</span>
      </template>
    </AppBaseTable>
  </div>
</template>
