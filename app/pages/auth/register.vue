<script setup lang="ts">
definePageMeta({ layout: 'auth' })

useSeoMeta({
  title: 'Регистрация',
  description: 'Создание нового аккаунта в системе DNZ'
})

const { fetch: refreshSession } = useUserSession()
const toast = useToast()

const state = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const avatarFile = ref<File | null>(null)
const isLoading = ref(false)
const errorMessage = ref('')

async function onSubmit() {
  errorMessage.value = ''

  if (state.password !== state.confirmPassword) {
    errorMessage.value = 'Пароли не совпадают'
    return
  }

  isLoading.value = true

  try {
    const formData = new FormData()
    formData.append('name', state.name)
    formData.append('email', state.email)
    formData.append('password', state.password)
    if (avatarFile.value) formData.append('avatar', avatarFile.value)

    await $fetch('/api/auth/register', { method: 'POST', body: formData })
    await refreshSession()
    await navigateTo('/')
  } catch (err: unknown) {
    const fetchError = err as { data?: { statusMessage?: string; message?: string } }
    errorMessage.value = fetchError.data?.statusMessage || fetchError.data?.message || 'Ошибка регистрации'
    toast.add({ title: 'Ошибка', description: errorMessage.value, color: 'error' })
  } finally {
    isLoading.value = false
  }
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
