<script setup lang="ts">
import {formatPhone} from "~/utils/formatPhone.ts";

definePageMeta({ layout: 'admin' })

const route = useRoute()
const addressId = route.params.id
const toast = useToast()

// Данные адреса
const { data: addressData, pending, error, refresh } = await useFetch(`/api/admin/addresses/${addressId}`)
const address = computed(() => addressData.value?.address)

// Состояние формы добавления клиента
const clientPhone = ref('')
const clientName = ref('')
const isAddingClient = ref(false)

const handlePhoneInput = (val: string) => {
  clientPhone.value = formatPhone(val)
  clientPhone.value = formatPhone(val)
}
async function handleAddClient() {
  if (!clientPhone.value.trim()) return

  isAddingClient.value = true
  try {
    await $fetch(`/api/admin/addresses/${addressId}/clients`, {
      method: 'POST',
      body: {
        phone: clientPhone.value.trim(),
        user_name: clientName.value.trim() || undefined
      }
    })

    clientPhone.value = ''
    clientName.value = ''
    await refresh()

    toast.add({
      title: 'Успешно',
      description: 'Клиент успешно привязан к объекту',
      color: 'success'
    })
  } catch (err: unknown) {
    const fetchErr = err as { data?: { message?: string } }
    toast.add({
      title: 'Ошибка',
      description: fetchErr.data?.message || 'Не удалось привязать клиента',
      color: 'error'
    })
  } finally {
    isAddingClient.value = false
  }
}

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

        <!-- Карточка 1: Клиенты на объекте -->
        <div class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm space-y-5">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
                <UIcon name="i-lucide-users" class="w-5 h-5" />
              </div>
              <h2 class="font-semibold text-neutral-900 dark:text-white">Клиенты на объекте</h2>
            </div>
            <span class="text-xs px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
              {{ address?.clients?.length || 0 }}
            </span>
          </div>

          <p class="text-xs text-neutral-500 dark:text-neutral-400">
            Добавьте номер телефона жильца. Если пользователя еще нет в системе, он создастся автоматически.
          </p>

          <!-- Форма добавления клиента -->
          <form class="space-y-3 pt-2 border-t border-neutral-100 dark:border-neutral-800" @submit.prevent="handleAddClient">
            <UInput
              v-model="clientName"
              placeholder="Имя клиента (необязательно)"
              icon="i-lucide-user"
              size="sm"
            />
            <div class="flex gap-2">
              <UInput
                v-model="clientPhone"
                placeholder="+7 (999) 000-00-00"
                icon="i-lucide-phone"
                class="flex-1"
                size="sm"
                @update:model-value="handlePhoneInput"
              />
              <UButton
                type="submit"
                color="primary"
                size="sm"
                :loading="isAddingClient"
                icon="i-lucide-plus"
              >
                Привязать
              </UButton>
            </div>
          </form>

          <!-- Список привязанных клиентов -->
          <div class="space-y-2 pt-2">
            <div v-if="!address?.clients || address.clients.length === 0" class="py-6 text-center text-xs text-neutral-400 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl">
              К этому адресу пока не привязано ни одного клиента.
            </div>

            <div
              v-for="item in address?.clients"
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

        <!-- Карточка 2: Заглушка (будущий функционал) -->
        <div class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm space-y-4 opacity-75">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
                <UIcon name="i-lucide-cpu" class="w-5 h-5" />
              </div>
              <h2 class="font-semibold text-neutral-900 dark:text-white">Оборудование</h2>
            </div>
            <span class="text-xs px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
              0
            </span>
          </div>

          <p class="text-xs text-neutral-500 dark:text-neutral-400">
            Тепловые насосы и приборы автоматики на объекте.
          </p>

          <div class="py-12 text-center text-xs text-neutral-400 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl">
            Раздел временно скрыт до завершения работы с клиентами.
          </div>
        </div>

      </div>
    </template>
  </div>
</template>
