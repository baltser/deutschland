<script setup lang="ts">
definePageMeta({ layout: 'auth' })

useSeoMeta({
  title: 'Вход в систему',
  description: 'Авторизация в системе DNZ'
})

const { fetch: refreshSession } = useUserSession()
const toast = useToast()

const state = reactive({ email: '', password: '' })
const isLoading = ref(false)
const errorMessage = ref('')

async function onSubmit() {
  errorMessage.value = ''
  isLoading.value = true

  try {
    await $fetch('/api/auth/login', { method: 'POST', body: state })
    await refreshSession()
    await navigateTo('/')
  } catch (err: unknown) {
    const fetchError = err as { data?: { statusMessage?: string; message?: string } }
    errorMessage.value = fetchError.data?.statusMessage || fetchError.data?.message || 'Ошибка входа'
    toast.add({ title: 'Ошибка', description: errorMessage.value, color: 'error' })
  } finally {
    isLoading.value = false
  }
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
