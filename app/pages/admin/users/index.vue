<!-- app/pages/admin/users/index.vue -->
<script setup lang="ts">
definePageMeta({ layout: 'admin' })

useSeoMeta({
  title: 'Управление пользователями',
  description: 'Список сотрудников, монтажников и клиентов с адресами'
})

// --- 1. СОСТОЯНИЕ И ВКЛАДКИ ---
const selectedTab = ref<'admin' | 'installer' | 'client'>('admin')
const searchQuery = ref('')

const roleTabs = [
  { label: 'Администраторы', value: 'admin' },
  { label: 'Монтажники', value: 'installer' },
  { label: 'Клиенты', value: 'client' },
]

// --- 2. ЗАГРУЗКА ДАННЫХ С СЕРВЕРА ---
// Загружаем персонал (админы и монтажники)
const {
  data: staffResponse,
  pending: staffPending,
  error: staffError,
  refresh: refreshStaff
} = await useFetch('/api/admin/staff')

// Загружаем клиентов
const {
  data: clientsResponse,
  pending: clientsPending,
  error: clientsError,
  refresh: refreshClients
} = await useFetch('/api/admin/clients')

const staffList = computed(() => staffResponse.value?.users || [])
const clientsList = computed(() => clientsResponse.value?.clients || [])

const refreshAll = () => {
  refreshStaff()
  refreshClients()
}

// --- 3. ФИЛЬТРАЦИЯ (ПОИСК И РОЛИ) ---
const filteredStaff = computed(() => {
  let list = staffList.value.filter(u => u.role_name === selectedTab.value)

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    list = list.filter(u =>
      (u.user_name && u.user_name.toLowerCase().includes(query)) ||
      (u.phone && u.phone.toLowerCase().includes(query)) ||
      (u.email && u.email.toLowerCase().includes(query))
    )
  }
  return list
})

const filteredClients = computed(() => {
  let list = clientsList.value

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    list = list.filter(c =>
      (c.user_name && c.user_name.toLowerCase().includes(query)) ||
      (c.phone && c.phone.toLowerCase().includes(query)) ||
      (c.email && c.email.toLowerCase().includes(query))
    )
  }
  return list
})

// --- 4. МОДАЛКА РЕДАКТИРОВАНИЯ ---
const isEditModalOpen = ref(false)
const selectedUser = ref<any>(null)
const isSaving = ref(false)

function openEditModal(user: any) {
  selectedUser.value = user
  isEditModalOpen.value = true
}

async function handleSaveUser(payload: { user_name: string; role_name: string; avatarFile?: File | null }) {
  if (!selectedUser.value) return
  isSaving.value = true
  try {
    const userId = selectedUser.value.user_id

    // 1. Если пользователь выбрал новый файл аватара — загружаем его отдельно через FormData
    if (payload.avatarFile) {
      const formData = new FormData()
      formData.append('avatar', payload.avatarFile)

      await $fetch(`/api/profile/${userId}/avatar`, {
        method: 'POST',
        body: formData
      })
    }

    // 2. Отправляем обновленные текстовые данные (имя, роль)
    await $fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      body: {
        user_name: payload.user_name,
        role_name: payload.role_name
      }
    })

    isEditModalOpen.value = false
    refreshAll()
  } catch (err: any) {
    console.error('Ошибка сохранения пользователя:', err)
  } finally {
    isSaving.value = false
  }
}
// --- 5. МОДАЛКА ДОБАВЛЕНИЯ СОТРУДНИКА ---
const isAddModalOpen = ref(false)
const newPhone = ref('')
const newUserName = ref('')
const newRole = ref<'admin' | 'installer'>('admin')
const isCreating = ref(false)

function openAddModal(role: 'admin' | 'installer') {
  newRole.value = role
  newPhone.value = ''
  newUserName.value = ''
  isAddModalOpen.value = true
}

function handlePhoneInput(val: string) {
  newPhone.value = val
}

async function handleCreateStaff() {
  isCreating.value = true
  try {
    await $fetch('/api/admin/users', {
      method: 'POST',
      body: {
        phone: newPhone.value,
        user_name: newUserName.value,
        role_name: newRole.value
      }
    })
    isAddModalOpen.value = false
    refreshStaff()
  } catch (err: any) {
    console.error('Ошибка создания сотрудника:', err)
  } finally {
    isCreating.value = false
  }
}
</script>

<template>
  <div class="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
    <!-- Шапка страницы -->
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Пользователи системы</h1>
      <p class="text-sm text-neutral-500">Управление сотрудниками, ролями и привязанными клиентами</p>
    </div>

    <!-- Панель фильтров, поиска и кнопки добавления -->
    <div class="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
      <div class="flex flex-wrap gap-1">
        <UButton
          v-for="tab in roleTabs"
          :key="tab.value"
          size="sm"
          :variant="selectedTab === tab.value ? 'solid' : 'ghost'"
          :color="selectedTab === tab.value ? 'primary' : 'neutral'"
          @click="selectedTab = tab.value as any"
        >
          {{ tab.label }}
        </UButton>
      </div>

      <div class="flex items-center gap-2">
        <UInput
          v-model="searchQuery"
          icon="i-lucide-search"
          placeholder="Поиск по имени, телефону..."
          size="sm"
          class="w-full sm:w-64"
        />

        <!-- Кнопка отображается ТОЛЬКО на вкладках 'admin' и 'installer' -->
        <UButton
          v-if="selectedTab === 'admin' || selectedTab === 'installer'"
          icon="i-lucide-user-plus"
          color="primary"
          size="sm"
          @click="openAddModal(selectedTab)"
        >
          <span class="hidden md:inline">
            {{ selectedTab === 'admin' ? 'Добавить админа' : 'Добавить монтажника' }}
          </span>
        </UButton>
      </div>
    </div>

    <!-- Таблица сотрудников -->
    <AdminUsersUserTable
      v-if="selectedTab !== 'client'"
      :users="filteredStaff"
      :loading="staffPending"
      :error="staffError"
      @select="openEditModal"
    />

    <!-- Таблица клиентов -->
    <AdminUsersClientsTable
      v-else
      :clients="filteredClients"
      :loading="clientsPending"
      :error="clientsError"
      @select="openEditModal"
    />

    <!-- Модалка редактирования -->
    <AdminUsersRoleEditModal
      v-model="isEditModalOpen"
      :user="selectedUser"
      :is-saving="isSaving"
      @save="handleSaveUser"
    />

    <!-- Модалка добавления сотрудника -->
    <AdminUsersAddStaffModal
      v-model="isAddModalOpen"
      v-model:phone="newPhone"
      v-model:user-name="newUserName"
      v-model:role="newRole"
      :is-creating="isCreating"
      @update:phone="handlePhoneInput"
      @submit="handleCreateStaff"
    />
  </div>
</template>
