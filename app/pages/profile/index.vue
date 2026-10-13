<script setup lang="ts">
definePageMeta({
  layout: 'default',
  // middleware: 'auth'
})

useSeoMeta({
  title: 'Личный кабинет',
  description: 'Управление учетной записью и профилем в системе'
})

const { user } = useUserSession()
const { state, isLoading, saveProfile, handleAvatarUpdated } = useProfile()
</script>

<template>
  <div class="max-w-3xl mx-auto p-6 space-y-6">
    <div>
      <h1 class="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Личный кабинет</h1>
      <p class="text-sm text-gray-500 dark:text-gray-400">Управляйте своими личными данными и настройками безопасности</p>
    </div>

    <!-- Карточка с аватаром -->
    <UCard>
      <div class="flex flex-col sm:flex-row items-center gap-6">
        <UserAvatar
          v-if="user?.user_id"
          :user-id="user.user_id"
          :avatar-url="user.avatar_path ? `/api/files/${user.avatar_path}` : null"
          :can-edit="true"
          class="w-20 h-20"
          @updated="handleAvatarUpdated"
        />
        <div class="space-y-1 text-center sm:text-left">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">{{ user?.user_name }}</h2>
          <p class="text-sm text-gray-500 dark:text-gray-400">{{ user?.email }}</p>
          <div class="pt-1">
            <UBadge
              :color="user?.role_name === 'admin' ? 'primary' : 'neutral'"
              variant="subtle"
              size="xs"
              class="uppercase"
            >
              Роль: {{ user?.role_name || 'user' }}
            </UBadge>
          </div>
        </div>
      </div>
    </UCard>

    <!-- Форма редактирования -->
    <UCard>
      <template #header>
        <h3 class="font-semibold text-gray-900 dark:text-white">Редактирование профиля</h3>
      </template>

      <UForm :state="state" class="space-y-4" @submit="saveProfile">
        <UFormField label="Имя" name="name" required>
          <UInput v-model="state.name" type="text" placeholder="Ваше имя" icon="i-lucide-user" class="w-full" />
        </UFormField>

        <UFormField label="Email" name="email" required>
          <UInput v-model="state.email" type="email" placeholder="name@example.com" icon="i-lucide-mail" class="w-full" />
        </UFormField>

        <div class="border-t border-default pt-4 mt-4">
          <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Изменение пароля (оставьте пустыми, если не нужно менять)
          </h4>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <UFormField label="Новый пароль" name="password">
              <UInput v-model="state.password" type="password" placeholder="••••••••" icon="i-lucide-lock" class="w-full" />
            </UFormField>

            <UFormField label="Подтвердите пароль" name="confirmPassword">
              <UInput v-model="state.confirmPassword" type="password" placeholder="••••••••" icon="i-lucide-shield-check" class="w-full" />
            </UFormField>
          </div>
        </div>

        <div class="flex justify-end pt-4">
          <UButton type="submit" color="primary" icon="i-lucide-save" :loading="isLoading">
            Сохранить изменения
          </UButton>
        </div>
      </UForm>
    </UCard>
  </div>
</template>
