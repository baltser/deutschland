<script setup lang="ts">
import type { UserItem } from '@/stores/adminUsers'
import UserAvatar from "~/components/user/UserAvatar.vue";

const props = defineProps<{
  modelValue: boolean
  user: UserItem | null
  role: string
  isSaving: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'update:role': [value: string]
  'update:avatar': [newAvatarUrl: string] // Событие при смене аватара
  save: []
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const currentRole = computed({
  get: () => props.role,
  set: (val) => emit('update:role', val)
})

const roleOptions = [
  { label: 'Пользователь (user)', value: 'user' },
  { label: 'Администратор (admin)', value: 'admin' },
]

function handleAvatarUpdated(newUrl: string) {
  if (props.user) {
    // Извлекаем относительный путь для бэкенда/хранилища из полного URL или передаем дальше
    const relativePath = newUrl.replace('/api/files/', '')
    // props.user.avatar = relativePath
    emit('update:avatar', relativePath)
  }
}
</script>

<template>
  <UModal v-model:open="isOpen" title="Управление пользователем">
    <template #body>
      <div v-if="user" class="space-y-6">
        <!-- Блок профиля с возможностью смены аватара администратором -->
        <div class="flex items-center gap-4 p-4 rounded-xl bg-neutral-100 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700">
          <UserAvatar
            :user-id="user.id"
            :avatar-url="user.avatar ? `/api/files/${user.avatar}` : null"
            :can-edit="true"
            size="w-14 h-14"
            @updated="handleAvatarUpdated"
          />
          <div>
            <p class="text-base font-semibold text-gray-900 dark:text-white">{{ user.name }}</p>
            <p class="text-xs text-neutral-500 dark:text-neutral-400">{{ user.email }}</p>
            <p class="text-[11px] text-primary mt-1">Кликните на аватар, чтобы заменить его</p>
          </div>
        </div>

        <!-- Выбор роли -->
        <UFormField label="Роль пользователя">
          <USelect
            v-model="currentRole"
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
          @click="isOpen = false"
        >
          Отмена
        </UButton>
        <UButton
          color="primary"
          :loading="isSaving"
          @click="$emit('save')"
        >
          Сохранить роль
        </UButton>
      </div>
    </template>
  </UModal>
</template>
