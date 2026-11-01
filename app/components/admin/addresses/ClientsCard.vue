<script setup lang="ts">
import { formatPhone } from '~/utils/phone'
import type {ClientUser} from "~/types/user.ts";
import type ImportClientsTableModal from "~/components/app/ImportClientsTableModal.vue";

const props = defineProps<{
  addressId: number | string
  clients: ClientUser[]
  clientName: string
  clientPhone: string
  isAdding: boolean
}>()

const emit = defineEmits(['update:clientName', 'update:clientPhone', 'add', 'refresh'])

const isImportModalOpen = ref(false)
const isImportingFile = ref(false) // Стейт загрузки файла для анимации кнопки
const importModalRef = ref<InstanceType<typeof ImportClientsTableModal> | null>(null)

const columns = [
  { key: 'index', label: '№', class: 'w-12 text-center' },
  { key: 'client', label: 'Клиент' },
  { key: 'phone', label: 'Телефон' }
]

</script>

<template>
  <div class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm space-y-5">

    <!-- Шапка карточки -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
          <UIcon name="i-lucide-users" class="w-5 h-5" />
        </div>
        <h2 class="font-semibold text-neutral-900 dark:text-white">Клиенты на объекте</h2>
      </div>

      <div class="flex items-center gap-2">
        <span class="text-xs px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
          {{ clients?.length || 0 }}
        </span>

        <!-- Кнопка с реактивным индикатором загрузки файла -->
        <UButton
          size="xs"
          variant="subtle"
          color="neutral"
          icon="i-lucide-file-up"
          :loading="isImportingFile"
          @click="importModalRef?.triggerFileInput()"
        >
          Импорт
        </UButton>
      </div>
    </div>

    <p class="text-xs text-neutral-500 dark:text-neutral-400">
      Добавьте номер телефона жильца или загрузите список из файла (.xlsx, .csv).
    </p>

    <!-- Форма одиночного добавления -->
    <form class="space-y-3 pt-2 border-t border-neutral-100 dark:border-neutral-800" @submit.prevent="emit('add')">
      <UInput
        :model-value="clientName"
        size="sm"
        placeholder="Имя клиента (необязательно)"
        icon="i-lucide-user"
        @update:model-value="(val: any) => emit('update:clientName', val)"
      />
      <div class="flex gap-2">
        <AppPhoneInput
          :model-value="clientPhone"
          size="sm"
          placeholder="+7 (999) 000-00-00"
          class="flex-1"
          @update:model-value="(val: any) => emit('update:clientPhone', val)"
        />
        <UButton
          type="submit"
          color="primary"
          size="sm"
          :loading="isAdding"
          icon="i-lucide-plus"
        >
          Привязать
        </UButton>
      </div>
    </form>

    <!-- Основная таблица текущих клиентов -->
    <div class="pt-2">
      <AppBaseTable
        :data="clients"
        :columns="columns"
        row-key="user.user_id"
        empty-text="К этому адресу пока не привязано ни одного клиента."
      >
        <template #index="{ index }">
          <span class="text-xs text-neutral-400 font-mono text-center block">
            {{ index + 1 }}
          </span>
        </template>

        <template #client="{ row }">
          <div class="font-medium text-neutral-900 dark:text-white flex items-center gap-3">
            <div class="w-7 h-7 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center font-semibold text-xs overflow-hidden shrink-0">
              <img v-if="row.user?.avatar_path" :src="`/api/files/${row.user.avatar_path}`" class="w-full h-full object-cover">
              <span v-else>{{ (row.user?.user_name?.[0] || 'К').toUpperCase() }}</span>
            </div>
            <span>{{ row.user?.user_name || 'Без имени' }}</span>
          </div>
        </template>

        <template #phone="{ row }">
          <span class="text-neutral-600 dark:text-neutral-400 font-mono text-xs">
            {{ formatPhone(row.user?.phone) }}
          </span>
        </template>
      </AppBaseTable>
    </div>

    <!-- Модальное окно с привязкой стейта загрузки через v-model:uploading -->
    <AppImportClientsTableModal
      ref="importModalRef"
      v-model="isImportModalOpen"
      v-model:uploading="isImportingFile"
      :address-id="addressId"
      @imported="emit('refresh')"
    />

  </div>
</template>
