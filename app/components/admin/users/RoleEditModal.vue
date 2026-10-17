<script setup lang="ts">
import ClientAddressList from '../../client/address/List.vue'
import UserAvatar from '~/components/user/UserAvatar.vue'
import { useUserEditModal, type UserEditTarget } from '~/composables/admin/users/useUserEditModal'

const props = defineProps<{
  modelValue: boolean
  user: UserEditTarget | null
  isSaving: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  save: [payload: { user_name: string; role_name: string; avatar_path?: string | null; avatarFile?: File | null }]
}>()

// Подключаем всю логику из композибла (передаем точечно нужные рефы)
const userRef = toRef(props, 'user')
const modelValueRef = toRef(props, 'modelValue')

const {
  form,
  isOpen,
  isClient,
  modalTitle,
  staffRoleOptions,
  displayAvatarUrl,
  hasChanges,
  handleAvatarFileSelected,
  handleSave
} = useUserEditModal(userRef, modelValueRef, emit)
</script>

<template>
  <UModal v-model:open="isOpen" :title="modalTitle">
    <template #body>
      <div v-if="user" class="space-y-6">
        <!-- Блок профиля -->
        <div class="flex items-center gap-4 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/80 dark:border-neutral-700/60">
          <UserAvatar
            :user-id="user.user_id"
            :avatar-url="displayAvatarUrl"
            :can-edit="true"
            :immediate-upload="false"
            size="w-14 h-14"
            @select-file="handleAvatarFileSelected"
          />
          <div class="space-y-1 min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <span class="text-sm font-semibold text-neutral-900 dark:text-white font-mono truncate">
                {{ user.phone }}
              </span>
              <UBadge :color="user.activated_at ? 'success' : 'neutral'" variant="subtle" size="xs">
                {{ user.activated_at ? 'Активен' : 'Ожидает входа' }}
              </UBadge>
            </div>
            <p v-if="user.email" class="text-xs text-neutral-500 dark:text-neutral-400 truncate">
              {{ user.email }}
            </p>
            <p class="text-[11px] text-primary hover:underline cursor-pointer">
              Нажмите на аватар для изменения
            </p>
          </div>
        </div>

        <!-- Поле редактирования имени -->
        <UFormField label="Имя пользователя">
          <UInput
            v-model="form.user_name"
            placeholder="Введите имя и фамилию..."
            icon="i-lucide-user"
            class="w-full"
          />
        </UFormField>

        <!-- Выбор роли (Только для сотрудников) -->
        <UFormField v-if="!isClient" label="Роль сотрудника">
          <USelect
            v-model="form.role_name"
            :items="staffRoleOptions"
            icon="i-lucide-shield"
            class="w-full"
          />
        </UFormField>

        <!-- Суб-компонент списка адресов (Только для клиентов) -->
        <ClientAddressList
          v-if="isClient"
          :addresses="user.addresses"
        />
      </div>
    </template>

    <template #footer>
      <div class="flex items-center justify-between w-full">
        <span v-if="hasChanges" class="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1 font-medium">
          <UIcon name="i-lucide-alert-circle" class="w-3.5 h-3.5" />
          Есть несохраненные изменения
        </span>
        <span v-else />

        <div class="flex items-center gap-2">
          <UButton
            color="neutral"
            variant="ghost"
            :disabled="isSaving"
            @click="isOpen = false"
          >
            Отмена
          </UButton>
          <UButton
            color="primary"
            :loading="isSaving"
            :disabled="!hasChanges"
            @click="handleSave(isSaving)"
          >
            Сохранить
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
