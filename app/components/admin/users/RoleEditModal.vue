<!-- app/components/admin/users/AdminUsersRoleEditModal.vue -->
<script setup lang="ts">
import ClientAddressList from '~/components/client/address/List.vue'
import UserAvatar from '~/components/user/UserAvatar.vue'

// Интерфейс целевого пользователя для редактирования
export interface UserEditTarget {
  user_id: number
  user_name?: string | null
  phone: string
  email?: string | null
  avatar_path?: string | null
  role_name?: string
  activated_at?: string | null
  role?: { role_name: string }
  addresses?: any[]
}

const props = defineProps<{
  modelValue: boolean
  user: UserEditTarget | null
  isSaving: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  save: [payload: { user_name: string; role_name: string; avatarFile?: File | null }]
}>()

// --- ЛОГИКА ФОРМЫ И СОСТОЯНИЯ ---

const form = reactive({
  user_name: '',
  role_name: '',
  avatar_path: null as string | null,
  newAvatarFile: null as File | null,
  localPreviewUrl: null as string | null
})

// Определяем исходную роль пользователя
const initialRole = computed(() => {
  if (!props.user) return 'client'
  const raw = props.user.role_name || props.user.role?.role_name || 'installer'
  return raw.toLowerCase().trim()
})

const isClient = computed(() => initialRole.value === 'client')

// Заголовок модалки
const modalTitle = computed(() => {
  if (!props.user) return 'Пользователь'
  const name = form.user_name || props.user.user_name || 'Без имени'
  return isClient.value ? `Клиент: ${name}` : `Сотрудник: ${name}`
})

const staffRoleOptions = [
  { label: 'Администратор (admin)', value: 'admin' },
  { label: 'Монтажник (installer)', value: 'installer' },
]

// Актуальный URL для отображения (превью нового файла имеет приоритет)
const displayAvatarUrl = computed(() => {
  if (form.localPreviewUrl) return form.localPreviewUrl
  const path = form.avatar_path || props.user?.avatar_path
  if (!path) return null
  return path.startsWith('/api/files/') ? path : `/api/files/${path}`
})

// Проверка: были ли сделаны изменения в форме
const hasChanges = computed(() => {
  if (!props.user) return false
  const origName = props.user.user_name || ''
  const origRole = initialRole.value

  return (
    form.user_name !== origName ||
    form.newAvatarFile !== null ||
    (!isClient.value && form.role_name !== origRole)
  )
})

// Очистка памяти Blob URL
const revokePreview = () => {
  if (form.localPreviewUrl) {
    URL.revokeObjectURL(form.localPreviewUrl)
    form.localPreviewUrl = null
  }
}

// Синхронизация формы при открытии модалки или смене юзера
watch(
  () => props.user,
  (newUser) => {
    revokePreview()
    if (newUser) {
      form.user_name = newUser.user_name || ''
      form.role_name = initialRole.value
      form.avatar_path = newUser.avatar_path || null
      form.newAvatarFile = null
      form.localPreviewUrl = null
    }
  },
  { immediate: true, deep: true }
)

// Обработка выбора нового аватара
function handleAvatarFileSelected(file: File) {
  revokePreview()
  form.newAvatarFile = file
  form.localPreviewUrl = URL.createObjectURL(file)
}

// Управление открытием через v-model
const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

// Сохранение
function handleSave() {
  if (!hasChanges.value || props.isSaving) return

  emit('save', {
    user_name: form.user_name.trim(),
    role_name: form.role_name,
    avatarFile: form.newAvatarFile
  })
}

onUnmounted(() => {
  revokePreview()
})
</script>

<template>
  <UModal v-model:open="isOpen" :title="modalTitle">
    <template #body>
      <div v-if="user" class="space-y-6">
        <!-- Блок профиля и аватара -->
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
            :disabled="isSaving"
            @click="isOpen = false"
          >
            Отмена
          </UButton>
          <UButton
            color="primary"
            :loading="isSaving"
            :disabled="!hasChanges"
            @click="handleSave"
          >
            Сохранить
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
