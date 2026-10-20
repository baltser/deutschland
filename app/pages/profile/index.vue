<script setup lang="ts">
definePageMeta({
  layout: 'profile',
})

useSeoMeta({
  title: 'Личный кабинет',
  description: 'Управление учетной записью и профилем в системе'
})

const { user } = useUserSession()
const { state, isLoading, saveProfile, handleAvatarUpdated } = useProfile()

const onSubmit = async () => {
  await saveProfile()
  await navigateTo('/')
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">Личный кабинет</h1>
      <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Управляйте своими личными данными и настройками безопасности</p>
    </div>

    <!-- Карточка с текущими данными и аватаром -->
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
          <h2 class="text-lg font-semibold text-neutral-900 dark:text-white">{{ user?.user_name || 'Пользователь' }}</h2>
          <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ user?.email || user?.phone }}</p>
          <div class="pt-1">
            <UBadge
              :color="user?.role_name === 'admin' ? 'primary' : user?.role_name === 'installer' ? 'warning' : 'neutral'"
              variant="subtle"
              size="xs"
              class="uppercase font-semibold"
            >
              Роль: {{ user?.role_name || 'user' }}
            </UBadge>
          </div>
        </div>
      </div>
    </UCard>

    <!-- 🎨 Карточка: Внешний вид / Тема оформления -->
    <UCard>
      <template #header>
        <div class="flex items-center gap-2 font-semibold text-sm">
          <UIcon name="i-lucide-palette" class="w-4 h-4 text-primary" />
          <span>Внешний вид</span>
        </div>
      </template>

      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-neutral-900 dark:text-white">Тема оформления</p>
          <p class="text-xs text-neutral-500 dark:text-neutral-400">Выберите комфортную цветовую схему (светлая / темная)</p>
        </div>
        <UColorModeButton />
      </div>
    </UCard>

    <!-- Форма редактирования -->
    <UCard>
      <template #header>
        <div class="flex items-center gap-2 font-semibold text-sm">
          <UIcon name="i-lucide-user-cog" class="w-4 h-4 text-primary" />
          <span>Редактирование профиля</span>
        </div>
      </template>

      <!-- Изменили @submit="saveProfile" на @submit="onSubmit" -->
      <UForm :state="state" class="space-y-4" @submit="onSubmit">
        <UFormField label="Новое имя" name="name">
          <UInput v-model="state.name" type="text" placeholder="Введите новое имя, если хотите изменить" icon="i-lucide-user" class="w-full" />
        </UFormField>

        <UFormField label="Новый email" name="email">
          <UInput v-model="state.email" type="email" placeholder="Введите новый email, если хотите изменить" icon="i-lucide-mail" class="w-full" />
        </UFormField>

        <div class="border-t border-default pt-4 mt-4">
          <h4 class="text-sm font-medium text-neutral-900 dark:text-white mb-3">
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
