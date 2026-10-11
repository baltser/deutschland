<script setup lang="ts">
import { useAdminUsersStore } from '@/stores/adminUsers'

definePageMeta({
  middleware: [
    async () => {
      const { loggedIn } = useUserSession()
      if (!loggedIn.value) return navigateTo('/auth/login')
    },
  ],
})

const store = useAdminUsersStore()

await useAsyncData('admin-users', async () => {
  await store.fetchUsers()
  return true
})

</script>

<template>
  <div class="max-w-7xl mx-auto p-6">
    <h1 class="text-2xl font-bold mb-6">Пользователи</h1>

    <AdminUserTable
      :users="store.users"
      :loading="store.loading"
      :error="store.error"
      @select="store.openEditModal"
    />
    <AdminRoleEditModal
      v-model="store.isModalOpen"
      v-model:role="store.selectedRole"
      :user="store.selectedUser"
      :is-saving="store.isSaving"
      @save="store.saveRole"
      @update:avatar="store.updateUserAvatar"
    />

  </div>
</template>
