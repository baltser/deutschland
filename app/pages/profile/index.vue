<!-- app/pages/profile.vue -->
<script setup lang="ts">
import { useProfile } from '~/composables/useProfile'

definePageMeta({
  layout: 'profile',
})

useSeoMeta({
  title: 'Личный кабинет',
  description: 'Управление учетной записью и профилем в системе'
})

const { user, fetch: refreshSession } = useUserSession()

const {
  state,
  isLoading,
  isSendingVerification,
  showPasswordFields,
  passwordError,
  isDirty,
  isEmailVerified,
  initProfile,
  saveProfile,
  sendVerificationEmail,
  handleAvatarUpdated
} = useProfile()

const route = useRoute()
const toast = useToast()

onMounted(async () => {
  initProfile()

  if (route.query.email_verified === 'true') {
    await refreshSession()
    toast.add({
      title: 'Email успешно подтвержден!',
      description: 'Теперь вы можете использовать его для восстановления доступа.',
      color: 'success',
      icon: 'i-lucide-mail-check'
    })
    navigateTo('/profile', { replace: true })
  }
})
</script>

<template>
  <div class="space-y-6 max-w-xl mx-auto pb-12">
    <!-- Шапка и кнопка возврата -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">Личный кабинет</h1>
        <p class="text-xs text-neutral-500 dark:text-neutral-400">Управление профилем и настройками</p>
      </div>
      <UButton
        to="/"
        variant="subtle"
        color="neutral"
        size="xs"
        icon="i-lucide-arrow-left"
      >
        В систему
      </UButton>
    </div>

    <!-- 1. Карточка профиля -->
    <UCard>
      <div class="flex items-center gap-4 pb-4 border-b border-default mb-4">
        <UserAvatar
          v-if="user?.user_id"
          :user-id="user.user_id"
          :avatar-url="user.avatar_path ? `/api/files/${user.avatar_path}` : null"
          :can-edit="true"
          class="w-16 h-16"
          @updated="handleAvatarUpdated"
        />
        <div class="space-y-1">
          <h2 class="font-semibold text-neutral-900 dark:text-white">{{ user?.user_name || 'Пользователь' }}</h2>
          <p class="text-xs text-neutral-500 dark:text-neutral-400">{{ user?.phone }}</p>
          <UBadge
            :color="user?.role_name === 'admin' ? 'primary' : user?.role_name === 'installer' ? 'warning' : 'neutral'"
            variant="subtle"
            size="xs"
            class="uppercase font-semibold mt-1"
          >
            {{ user?.role_name || 'user' }}
          </UBadge>
        </div>
      </div>

      <UForm :state="state" class="space-y-4" @submit="saveProfile">
        <UFormField label="Имя" name="name">
          <UInput v-model="state.name" type="text" placeholder="Ваше имя" icon="i-lucide-user" class="w-full" />
        </UFormField>

        <UFormField label="Email для восстановления" name="email">
          <div class="space-y-2">
            <div class="flex items-center gap-2">
              <UInput v-model="state.email" type="email" placeholder="example@domain.com" icon="i-lucide-mail" class="w-full" />

              <UBadge
                v-if="state.email && isEmailVerified"
                color="success"
                variant="subtle"
                size="xs"
                icon="i-lucide-check-circle"
              >
                Подтверждён
              </UBadge>

              <UBadge
                v-else-if="state.email"
                color="warning"
                variant="subtle"
                size="xs"
                icon="i-lucide-alert-circle"
              >
                Не подтверждён
              </UBadge>
            </div>

            <!-- Ссылка на отправку письма -->
            <div v-if="state.email && !isEmailVerified && !isDirty" class="text-xs">
              <UButton
                variant="link"
                color="primary"
                size="xs"
                class="p-0 h-auto"
                :loading="isSendingVerification"
                @click="sendVerificationEmail"
              >
                Отправить письмо с подтверждением
              </UButton>
            </div>
          </div>
        </UFormField>

        <!-- Сворачиваемая смена пароля -->
        <div class="pt-1">
          <UButton
            type="button"
            variant="ghost"
            color="neutral"
            size="xs"
            :icon="showPasswordFields ? 'i-lucide-chevron-up' : 'i-lucide-key'"
            @click="showPasswordFields = !showPasswordFields"
          >
            {{ showPasswordFields ? 'Скрыть изменение пароля' : 'Изменить пароль' }}
          </UButton>

          <div v-if="showPasswordFields" class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
            <UFormField label="Новый пароль" name="password">
              <UInput v-model="state.password" type="password" placeholder="••••••••" icon="i-lucide-lock" class="w-full" />
            </UFormField>

            <UFormField label="Подтверждение" name="confirmPassword" :error="passwordError">
              <UInput v-model="state.confirmPassword" type="password" placeholder="••••••••" icon="i-lucide-shield-check" class="w-full" />
            </UFormField>
          </div>
        </div>

        <!-- Кнопка сохранения появляется при изменениях -->
        <Transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="transform scale-95 opacity-0"
          enter-to-class="transform scale-100 opacity-100"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="transform scale-100 opacity-100"
          leave-to-class="transform scale-95 opacity-0"
        >
          <div v-if="isDirty" class="flex justify-end pt-3 border-t border-default">
            <UButton
              type="submit"
              color="primary"
              size="sm"
              icon="i-lucide-save"
              :loading="isLoading"
              :disabled="Boolean(passwordError)"
            >
              Сохранить изменения
            </UButton>
          </div>
        </Transition>
      </UForm>
    </UCard>

    <!-- 2. Внешний вид -->
    <UCard>
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-neutral-900 dark:text-white">Тема оформления</p>
          <p class="text-xs text-neutral-500 dark:text-neutral-400">Светлая или тёмная тема</p>
        </div>
        <UColorModeButton />
      </div>
    </UCard>
  </div>
</template>
