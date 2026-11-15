<script setup lang="ts">
defineProps<{
  isAdding: boolean
  totalClients: number
  isImportingFile: boolean
}>()

const clientName = defineModel<string>('clientName', { default: '' })
const clientPhone = defineModel<string>('clientPhone', { default: '' })

const emit = defineEmits(['add', 'open-import'])
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
          {{ totalClients }} жильцов
        </span>

        <UButton
          size="xs"
          variant="subtle"
          color="neutral"
          icon="i-lucide-file-up"
          :loading="isImportingFile"
          @click="emit('open-import')"
        >
          Импорт
        </UButton>
      </div>
    </div>

    <p class="text-xs text-neutral-500 dark:text-neutral-400">
      Добавьте номер телефона жильца или загрузите список из файла (.xlsx, .csv).
    </p>


    <!-- Форма добавления -->
    <form class="space-y-3 pt-2 border-t border-neutral-100 dark:border-neutral-800" @submit.prevent="emit('add')">
      <UInput
        v-model="clientName"
        size="sm"
        placeholder="Имя клиента (необязательно)"
        icon="i-lucide-user"
      />
      <div class="flex gap-2">
        <AppPhoneInput
          v-model="clientPhone"
          size="sm"
          placeholder="+7 (999) 000-00-00"
          class="flex-1"
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
  </div>
</template>
