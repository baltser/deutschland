<script setup lang="ts">
defineProps<{
  clients: Array<{
    user: {
      user_id: number
      user_name?: string | null
      phone: string
    }
  }>
  clientName: string
  clientPhone: string
  isAdding: boolean
}>()

const emit = defineEmits(['update:clientName', 'update:clientPhone', 'add', 'phoneInput'])
</script>

<template>
  <div class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm space-y-5">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
          <UIcon name="i-lucide-users" class="w-5 h-5" />
        </div>
        <h2 class="font-semibold text-neutral-900 dark:text-white">Клиенты на объекте</h2>
      </div>
      <span class="text-xs px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
        {{ clients?.length || 0 }}
      </span>
    </div>

    <p class="text-xs text-neutral-500 dark:text-neutral-400">
      Добавьте номер телефона жильца. Если пользователя еще нет в системе, он создастся автоматически.
    </p>

    <!-- Форма добавления -->
    <form class="space-y-3 pt-2 border-t border-neutral-100 dark:border-neutral-800" @submit.prevent="emit('add')">
      <UInput
        :model-value="clientName"
        placeholder="Имя клиента (необязательно)"
        icon="i-lucide-user"
        size="sm"
        @update:model-value="val => emit('update:clientName', val)"
      />
      <div class="flex gap-2">
        <UInput
          :model-value="clientPhone"
          placeholder="+7 (999) 000-00-00"
          icon="i-lucide-phone"
          class="flex-1"
          size="sm"
          @update:model-value="val => emit('phoneInput', val)"
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

    <!-- Список -->
    <div class="space-y-2 pt-2">
      <div v-if="!clients || clients.length === 0" class="py-6 text-center text-xs text-neutral-400 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl">
        К этому адресу пока не привязано ни одного клиента.
      </div>

      <div
        v-for="item in clients"
        :key="item.user.user_id"
        class="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 flex items-center justify-between text-sm"
      >
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            {{ (item.user.user_name?.[0] || 'К').toUpperCase() }}
          </div>
          <div>
            <p class="font-medium text-neutral-900 dark:text-white">{{ item.user.user_name || 'Без имени' }}</p>
            <p class="text-xs text-neutral-400">{{ item.user.phone }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
