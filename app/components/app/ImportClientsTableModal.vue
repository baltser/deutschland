<script setup lang="ts">
import { formatPhone } from '~/utils/phone'
import { useUploadFile } from '~/composables/files/useUploadClientsTable'
import {useAdminAddressesStore} from "~/stores/admin/addresses.ts";

const props = defineProps<{
  modelValue: boolean
  addressId: number | string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'update:uploading': [value: boolean]
  'imported': []
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const { uploading, error, parsedClients, upload, reset } = useUploadFile()

// Синхронизируем локальный статус загрузки с родителем через watch
watch(uploading, (val) => {
  emit('update:uploading', val)
})

const fileInputRef = ref<HTMLInputElement | null>(null)
const isImporting = ref(false)

defineExpose({
  triggerFileInput: () => fileInputRef.value?.click()
})

async function handleFileSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  isOpen.value = true
  reset()

  try {
    await upload(file)
  } catch (err) {
    console.error('Ошибка при чтении файла:', err)
  } finally {
    input.value = ''
  }
}

function removeClient(phone: string) {
  parsedClients.value = parsedClients.value.filter(client => client.phone !== phone)
}

const addressStore = useAdminAddressesStore()

async function handleConfirmImport() {
  if (!parsedClients.value.length) return

  isImporting.value = true
  try {
    const success = await addressStore.importClients(props.addressId, parsedClients.value)
    if (success) {
      isOpen.value = false
      reset()
      emit('imported')
    }
  } catch (err) {
    console.error('Ошибка импорта:', err)
  } finally {
    isImporting.value = false
  }
}

const previewColumns = [
  { key: 'index', label: '№', class: 'w-12 text-center' },
  { key: 'name', label: 'Имя' },
  { key: 'phone', label: 'Телефон' },
  { key: 'actions', label: '', class: 'w-12 text-center' }
]
</script>

<template>
  <div>
    <input
      ref="fileInputRef"
      type="file"
      accept=".txt,.xls,.xlsx,.csv"
      class="hidden"
      @change="handleFileSelected"
    >

    <UModal v-model:open="isOpen" title="Предпросмотр данных для импорта" size="lg">
      <template #body>
        <div class="space-y-4">

          <!-- СОВРЕМЕННЫЙ АНИМИРОВАННЫЙ СКЕЛЕТОН ЗАГРУЗКИ -->
          <div v-if="uploading" class="py-6 space-y-4">
            <div class="flex items-center justify-center gap-2.5 text-primary">
              <UIcon name="i-lucide-loader-2" class="w-5 h-5 animate-spin" />
              <span class="text-sm font-medium text-neutral-700 dark:text-neutral-200">
                Парсим файл и структурируем данные...
              </span>
            </div>

            <!-- Имитация строк таблицы с пульсацией -->
            <div class="space-y-2 rounded-xl border border-neutral-200 dark:border-neutral-800 p-3 bg-neutral-50/50 dark:bg-neutral-900/50">
              <div v-for="i in 5" :key="i" class="h-11 rounded-lg bg-white dark:bg-neutral-800/80 shadow-xs animate-pulse flex items-center px-4 gap-4">
                <!-- Номер -->
                <div class="w-5 h-4 rounded bg-neutral-200 dark:bg-neutral-700/60" />
                <!-- Имя -->
                <div class="flex-1 h-4 rounded bg-neutral-200 dark:bg-neutral-700/60 w-1/3" />
                <!-- Телефон -->
                <div class="h-4 rounded bg-neutral-200 dark:bg-neutral-700/60 w-28" />
                <!-- Иконка удаления -->
                <div class="w-6 h-6 rounded-full bg-neutral-200 dark:bg-neutral-700/60" />
              </div>
            </div>
          </div>

          <div v-else-if="error" class="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-sm">
            {{ error }}
          </div>

          <template v-else-if="parsedClients.length > 0">
            <div class="flex items-center justify-between text-xs text-neutral-500">
              <span>Отредактируйте имена или удалите лишние строки перед импортом:</span>
              <span class="font-semibold text-neutral-900 dark:text-white">
                Найдено: {{ parsedClients.length }} шт.
              </span>
            </div>

            <div class="max-h-96 overflow-y-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
              <AppBaseTable
                :data="parsedClients"
                :columns="previewColumns"
                row-key="phone"
              >
                <template #index="{ index }">
                  <span class="text-xs text-neutral-400 font-mono text-center block">
                    {{ index + 1 }}
                  </span>
                </template>

                <template #name="{ row }">
                  <UInput
                    v-model="row.name"
                    size="xs"
                    variant="outline"
                    placeholder="Введите имя клиента"
                    class="w-full"
                  />
                </template>

                <template #phone="{ value }">
                  <span class="font-mono text-xs text-neutral-600 dark:text-neutral-300 block py-1">
                    {{ formatPhone(value) }}
                  </span>
                </template>

                <template #actions="{ row }">
                  <div class="flex justify-center">
                    <UButton
                      color="error"
                      variant="ghost"
                      size="xs"
                      icon="i-lucide-trash-2"
                      @click="removeClient(row.phone)"
                    />
                  </div>
                </template>
              </AppBaseTable>
            </div>
          </template>

          <div v-else class="py-12 text-center text-sm text-neutral-400">
            Файл не выбран или пуст.
          </div>

        </div>
      </template>

      <template #footer>
        <div class="flex justify-end gap-2 w-full">
          <UButton color="neutral" variant="ghost" @click="isOpen = false">
            Отмена
          </UButton>
          <UButton
            color="primary"
            icon="i-lucide-upload"
            :loading="isImporting"
            :disabled="parsedClients.length === 0 || uploading"
            @click="handleConfirmImport"
          >
            Импортировать {{ parsedClients.length }} клиентов
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
