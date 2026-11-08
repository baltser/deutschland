<script setup lang="ts">
import ClientAddressList from '~/components/client/address/List.vue'
import UserAvatar from '~/components/user/UserAvatar.vue'
import type { UserEditTarget } from '~/composables/admin/user/useForm.ts' // ********* ИСПРАВИТЬ !!!
import { useUserEditForm } from '~/composables/admin/user/useForm.ts'

const props = defineProps<{
  modelValue: boolean
  user: UserEditTarget | null
  isSaving?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

// Управление открытием через v-model
const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

// Подключаем всю инкапсулированную логику формы и стора мутаций
const {
  form,
  isClient,
  modalTitle,
  displayAvatarUrl,
  hasChanges,
  isSaving: isFormSaving,
  handleAvatarSelected,
  save
} = useUserEditForm(() => props.user, () => { isOpen.value = false })

const staffRoleOptions = [
  { label: 'Администратор (admin)', value: 'admin' },
  { label: 'Монтажник (installer)', value: 'installer' },
]
</script>

<template>
  <UModal v-model:open="isOpen" :title="modalTitle">
    <template #body>
      <div v-if="user" class="space-y-6">
        <!-- Блок профиля и аватара -->
        <div class="flex items-center gap-4 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/80 dark:border-neutral-700/60">
          <UserAvatar
            :avatar-url="displayAvatarUrl"
            :can-edit="true"
            size="w-14 h-14"
            @select="handleAvatarSelected"
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

        <!-- Имя пользователя -->
        <UFormField label="Имя пользователя">
          <UInput
            v-model="form.user_name"
            placeholder="Введите имя и фамилию..."
            icon="i-lucide-user"
            class="w-full"
          />
        </UFormField>

        <!-- Роль (только для сотрудников) -->
        <UFormField v-if="!isClient" label="Роль сотрудника">
          <USelect
            v-model="form.role_name"
            :items="staffRoleOptions"
            icon="i-lucide-shield"
            class="w-full"
          />
        </UFormField>

        <!-- Список адресов (только для клиентов) -->
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
            :disabled="isFormSaving"
            @click="isOpen = false"
          >
            Отмена
          </UButton>
          <UButton
            color="primary"
            :loading="isFormSaving"
            :disabled="!hasChanges"
            @click="save"
          >
            Сохранить
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
