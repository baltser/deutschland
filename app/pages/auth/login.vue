<!-- app/pages/auth/login.vue -->
<script setup lang="ts">
definePageMeta({ layout: 'auth' })

useSeoMeta({
  title: 'Вход в систему',
  description: 'Авторизация в системе DNZ'
})

const { login, isLoading, errorMessage } = useAuth()
const state = reactive({ email: '', password: '' })

async function onSubmit() {
  await login(state)
}
</script>

<template>
  <AuthCard
    title="Вход в систему"
    description="Введите ваши данные для входа"
    :error-message="errorMessage"
    footer-text="Ещё нет аккаунта?"
    footer-link-text="Зарегистрироваться"
    footer-to="/auth/register"
  >
    <UForm :state="state" class="space-y-4" @submit="onSubmit">
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
          autocomplete="current-password"
          class="w-full"
        />
      </UFormField>

      <UButton
        type="submit"
        color="primary"
        block
        size="lg"
        icon="i-lucide-log-in"
        :loading="isLoading"
        class="mt-6"
      >
        Войти
      </UButton>
    </UForm>
  </AuthCard>
</template>
