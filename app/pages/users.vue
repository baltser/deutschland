<script setup lang="ts">
definePageMeta({
  middleware: [
    async () => {
      const { loggedIn } = useUserSession()
      if (!loggedIn.value) return navigateTo('/login')
    },
  ],
})

interface UserItem {
  id: string | number
  name: string
  email: string
  ruleName: string
  avatar?: string | null // <-- Добавлено поле аватара
  createdAt: string
}

const toast = useToast()
const { data: users, pending: loading, error, refresh } = await useFetch<UserItem[]>('/api/admin/users')

// Состояние модального окна редактирования роли
const isModalOpen = ref(false)
const selectedUser = ref<UserItem | null>(null)
const selectedRole = ref<string>('user')
const isSaving = ref(false)

const roleOptions = [
  { label: 'Пользователь (user)', value: 'user' },
  { label: 'Администратор (admin)', value: 'admin' },
]

// Клик по строке открывает модалку
function onUserClick(user: UserItem) {
  selectedUser.value = user
  selectedRole.value = user.ruleName
  isModalOpen.value = true
}

// Отправка изменения роли на сервер
async function saveRole() {
  if (!selectedUser.value) return

  isSaving.value = true
  try {
    await $fetch(`/api/admin/users/${selectedUser.value.id}`, {
      method: 'PATCH',
      body: { ruleName: selectedRole.value },
    })

    toast.add({
      title: 'Успешно',
      description: `Роль пользователя ${selectedUser.value.name} изменена`,
      color: 'success',
    })

    isModalOpen.value = false
    await refresh()
  } catch (err: unknown) {
    const fetchError = err as { data?: { statusMessage?: string } }
    toast.add({
      title: 'Ошибка',
      description: fetchError.data?.statusMessage || 'Не удалось обновить роль',
      color: 'error',
    })
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <div class="max-w-7xl mx-auto p-6">
    <h1 class="text-2xl font-bold mb-6">Пользователи</h1>

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
        :description="error.message"
        class="mb-6"
      />

      <!-- Таблица -->
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
          <tr class="border-b border-gray-200 dark:border-gray-800 text-sm font-semibold text-gray-500 dark:text-gray-400">
            <th class="p-3">Имя</th>
            <th class="p-3">Email</th>
            <th class="p-3">Роль</th>
          </tr>
          </thead>
          <tbody>
          <tr
            v-for="u in users"
            :key="u.id"
            class="border-b border-gray-100 dark:border-gray-800/60 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
            @click="onUserClick(u)"
          >
            <td class="p-3">
              <div class="flex items-center gap-3">
                <!-- Контейнер аватара с динамическим изображением из MinIO -->
                <div class="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 overflow-hidden border border-neutral-200 dark:border-neutral-700">
                  <img
                    v-if="u.avatar"
                    :src="`/api/files/${u.avatar}`"
                    :alt="u.name"
                    class="w-full h-full object-cover"
                  >
                  <UIcon v-else name="i-lucide-user" class="w-4 h-4" />
                </div>
                <span class="font-medium text-gray-900 dark:text-white">{{ u.name }}</span>
              </div>
            </td>
            <td class="p-3 text-gray-600 dark:text-gray-400 text-sm">
              {{ u.email }}
            </td>
            <td class="p-3">
              <UBadge
                :color="u.ruleName === 'admin' ? 'primary' : 'neutral'"
                variant="subtle"
                size="sm"
                class="uppercase"
              >
                {{ u.ruleName }}
              </UBadge>
            </td>
          </tr>
          </tbody>
        </table>
      </div>
    </UCard>

    <!-- Модальное окно изменения роли -->
    <UModal v-model:open="isModalOpen" title="Изменение роли">
      <template #body>
        <div v-if="selectedUser" class="space-y-4">
          <div class="p-3 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-neutral-400 overflow-hidden shrink-0">
              <img
                v-if="selectedUser.avatar"
                :src="`/api/files/${selectedUser.avatar}`"
                :alt="selectedUser.name"
                class="w-full h-full object-cover"
              >
              <UIcon v-else name="i-lucide-user" class="w-5 h-5" />
            </div>
            <div>
              <p class="text-sm font-semibold text-gray-900 dark:text-white">{{ selectedUser.name }}</p>
              <p class="text-xs text-neutral-500 dark:text-neutral-400">{{ selectedUser.email }}</p>
            </div>
          </div>

          <UFormField label="Выберите новую роль">
            <USelect
              v-model="selectedRole"
              :items="roleOptions"
              class="w-full"
            />
          </UFormField>
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end gap-2 w-full">
          <UButton
            color="neutral"
            variant="ghost"
            @click="isModalOpen = false"
          >
            Отмена
          </UButton>
          <UButton
            color="primary"
            :loading="isSaving"
            @click="saveRole"
          >
            Сохранить
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
