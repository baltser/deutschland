<script setup lang="ts">
import type { ClientUser } from '~/types/user'

const props = defineProps<{
  clients: ClientUser[]
  loading?: boolean
  error?: unknown
}>()

defineEmits<{
  select: [client: ClientUser]
}>()

// Безопасное извлечение текста ошибки
const errorMessage = computed(() => {
  if (!props.error) return ''
  if (typeof props.error === 'object') {
    const err = props.error as { message?: string; data?: { message?: string } }
    return err.message || err.data?.message || 'Произошла неизвестная ошибка'
  }
  return String(props.error)
})
</script>

<template>
  <UCard>
    <!-- Индикатор загрузки -->
    <div v-if="loading" class="flex justify-center py-12">
      <UIcon name="i-lucide-loader-2" class="animate-spin text-2xl text-primary" />
    </div>

    <!-- Сообщение об ошибке -->
    <UAlert
      v-else-if="error"
      color="error"
      variant="soft"
      title="Ошибка загрузки"
      :description="errorMessage"
      class="mb-6"
    />

    <!-- Пустое состояние -->
    <div v-else-if="clients.length === 0" class="p-12 text-center text-neutral-400">
      Клиенты не найдены
    </div>

    <!-- Таблица -->
    <div v-else class="overflow-x-auto">
      <table class="w-full text-left border-collapse">
        <thead>
        <tr class="border-b border-neutral-200 dark:border-neutral-800 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
          <th class="p-4">Клиент</th>
          <th class="p-4">Телефон</th>
          <th class="p-4">Email</th>
          <th class="p-4">Статус</th>
          <th class="p-4">Привязанные адреса</th>
        </tr>
        </thead>
        <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800 text-sm">
        <tr
          v-for="client in clients"
          :key="client.user_id"
          class="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors cursor-pointer"
          @click="$emit('select', client)"
        >
          <!-- Аватар и имя -->
          <td class="p-4 font-medium text-neutral-900 dark:text-white flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center font-semibold text-xs overflow-hidden shrink-0">
              <img v-if="client.avatar_path" :src="`/api/files/${client.avatar_path}`" class="w-full h-full object-cover" >
              <span v-else>{{ (client.user_name?.[0] || 'К').toUpperCase() }}</span>
            </div>
            <span>{{ client.user_name || 'Без имени' }}</span>
          </td>

          <!-- Телефон -->
          <td class="p-4 text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
            {{ client.phone }}
          </td>

          <!-- Email -->
          <td class="p-4 text-neutral-600 dark:text-neutral-400">
            <span v-if="client.email" class="inline-flex items-center gap-1.5 text-xs text-neutral-700 dark:text-neutral-300">
              <UIcon name="i-lucide-mail" class="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              {{ client.email }}
            </span>
            <span v-else class="text-xs text-neutral-400 italic">
              Не указан
            </span>
          </td>

          <!-- Статус активации -->
          <td class="p-4 whitespace-nowrap">
            <UBadge :color="client.activated_at ? 'success' : 'neutral'" variant="subtle" size="xs">
              {{ client.activated_at ? 'Активен' : 'Ожидает входа' }}
            </UBadge>
          </td>

          <!-- Привязанные адреса -->
          <td class="p-4">
            <div v-if="client.addresses && client.addresses.length > 0" class="flex flex-wrap gap-1.5">
                <span
                  v-for="item in client.addresses"
                  :key="item.address_id"
                  class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-xs text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700"
                >
                  <UIcon name="i-lucide-map-pin" class="w-3 h-3 text-neutral-400 shrink-0" />
                  {{ item.address?.address_name || `Адрес #${item.address_id}` }}
                </span>
            </div>
            <span v-else class="text-xs text-neutral-400 italic">Нет привязанных адресов</span>
          </td>
        </tr>
        </tbody>
      </table>
    </div>
  </UCard>
</template>
