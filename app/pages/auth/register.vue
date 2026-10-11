<script setup lang="ts">
definePageMeta({ layout: 'auth' })

useSeoMeta({
  title: 'Регистрация',
  description: 'Создание нового аккаунта в системе DNZ'
})

const { register, isLoading, errorMessage } = useAuth()

const state = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const avatarFile = ref<File | null>(null)

async function onSubmit() {
  await register(
    {
      name: state.name,
      email: state.email,
      password: state.password,
      avatar: avatarFile.value
    },
    state.confirmPassword
  )
}
</script>

<template>
  <AuthCard
    title="Создание аккаунта"
    description="Заполните данные для регистрации в системе"
    :error-message="errorMessage"
    footer-text="Уже есть аккаунт?"
    footer-link-text="Войти"
    footer-to="/auth/login"
  >
    <UForm :state="state" class="space-y-4" @submit="onSubmit">
      <!-- Загрузка аватара -->
      <AuthAvatarUpload v-model="avatarFile" />

      <UFormField label="Имя" name="name" required>
        <UInput
          v-model="state.name"
          type="text"
          placeholder="Иван Иванов"
          icon="i-lucide-user"
          autocomplete="name"
          class="w-full"
        />
      </UFormField>

      <UFormField label="Email" name="email" required>
        <UInput
          v-model="state.email"
          type="email"
          placeholder="name@example.com"
          icon="i-lucide-mail"
          autocomplete="email"
          class="w-full"
        />
      </UFormField>

      <UFormField label="Пароль" name="password" required>
        <UInput
          v-model="state.password"
          type="password"
          placeholder="••••••••"
          icon="i-lucide-lock"
          autocomplete="new-password"
          class="w-full"
        />
      </UFormField>

      <UFormField label="Подтвердите пароль" name="confirmPassword" required>
        <UInput
          v-model="state.confirmPassword"
          type="password"
          placeholder="••••••••"
          icon="i-lucide-shield-check"
          autocomplete="new-password"
          class="w-full"
        />
      </UFormField>

      <UButton
        type="submit"
        color="primary"
        block
        size="lg"
        icon="i-lucide-user-plus"
        :loading="isLoading"
        class="mt-6"
      >
        Зарегистрироваться
      </UButton>
    </UForm>
  </AuthCard>
</template>
