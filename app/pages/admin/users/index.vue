<script setup lang="ts">
import { useAdminUserTabs } from '~/composables/admin/user/useTabs'
import { useAdminUserEdit } from '~/composables/admin/user/useEdit'
import { useAdminUserCreate } from '~/composables/admin/user/useCreate'

definePageMeta({ layout: 'admin' })

useSeoMeta({
  title: 'Управление пользователями',
  description: 'Список сотрудников, монтажников и клиентов с адресами'
})

// Подключаем разделенные логические модули
const { store, selectedTab, searchQuery, roleTabs, filteredStaff, filteredClients } = useAdminUserTabs()
const { isEditModalOpen, selectedUser, isSaving, openEditModal, handleSaveUser } = useAdminUserEdit()
const { isAddModalOpen, newPhone, newUserName, newRole, isCreating, openAddModal, handleCreateStaff } = useAdminUserCreate()
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
    <AdminUsersStaffTable
      v-if="selectedTab !== 'client'"
      :users="filteredStaff"
      :loading="store.staffPending"
      :error="store.staffError"
      @select="openEditModal"
    />

    <!-- Таблица клиентов -->
    <AdminUsersClientsTable
      v-else
      :clients="filteredClients"
      :loading="store.clientsPending"
      :error="store.clientsError"
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
      @submit="handleCreateStaff"
    />
  </div>
</template>
