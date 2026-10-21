<script setup lang="ts">
definePageMeta({ layout: 'auth' })

useSeoMeta({
  title: 'Вход в систему',
  description: 'Авторизация по номеру телефона и паролю'
})

const {
  state,
  showPassword,
  isLoading,
  errorMessage,
  login,
  handlePhoneInput,
  getCleanPhone
} = useAuthForm()

async function onLogin() {
  const phone = getCleanPhone()
  if (!phone) return

  if (!state.password) {
    errorMessage.value = 'Введите пароль'
    return
  }

  await login({ phone, password: state.password })
}
</script>

<template>
  <AuthCard
    title="Вход в систему"
    description="Введите ваш номер телефона и пароль"
    :error-message="errorMessage"
    footer-text="Еще нет аккаунта?"
    footer-link-text="Зарегистрироваться"
    footer-to="/auth/register"
  >
    <UForm :state="state" class="space-y-4" @submit="onLogin">
      <UFormField label="Номер телефона" name="phone" required>
        <UInput
          :model-value="state.phone"
          type="tel"
          placeholder="+7 (999) 000-00-00"
          icon="i-lucide-phone"
          size="lg"
          class="w-full"
          @update:model-value="handlePhoneInput"
        />
      </UFormField>

      <UFormField label="Пароль" name="password" required>
        <UInput
          v-model="state.password"
          :type="showPassword ? 'text' : 'password'"
          placeholder="••••••••"
          icon="i-lucide-lock"
          size="lg"
          class="w-full"
        >
          <template #trailing>
            <UButton
              color="neutral"
              variant="link"
              size="xs"
              :icon="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
              :padded="false"
              @click="showPassword = !showPassword"
            />
          </template>
        </UInput>
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
