<script setup lang="ts">

import {useForm} from "~/composables/auth/useForm.ts";
import {getCleanPhone} from "~/utils/phone.ts";

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
  login
} = useForm()

async function onLogin() {
  const phone = getCleanPhone(state.phone)
  if (!phone) {
    errorMessage.value = 'Введите номер телефона'
    return
  }

  await login({ phone, password: state.password })
}
</script>

<template>
  <AuthCard
    title="Вход в систему"
    description="Введите ваш номер телефона и пароль"
    :error-message="errorMessage ?? undefined"
    footer-text="Еще нет аккаунта?"
    footer-link-text="Зарегистрироваться"
    footer-to="/auth/register"
  >
    <UForm :state="state" class="space-y-4" @submit="onLogin">

        <AppPhoneInput
          v-model="state.phone"
          label="Номер телефона"
          name="phone"
          required
        />

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
