<script setup lang="ts">
useSeoMeta({
  title: 'Вход в систему',
  description: 'Авторизация в системе DNZ'
})

const { fetch: refreshSession } = useUserSession()

const state = reactive({
  email: '',
  password: ''
})

const isLoading = ref(false)
const errorMessage = ref('')

async function onSubmit() {
  errorMessage.value = ''
  isLoading.value = true

  try {
    // Отправляем запрос на авторизацию
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: {
        email: state.email,
        password: state.password
      }
    })

    // Обновляем состояние сессии на клиенте
    await refreshSession()

    // Перенаправляем на главную
    await navigateTo('/')
  } catch (error: any) {
    errorMessage.value = error.data?.statusMessage || error.message || 'Ошибка авторизации'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-[calc(100vh-16rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <UCard class="w-full max-w-md shadow-lg border border-(--ui-border)">
      <!-- Заголовок -->
      <template #header>
        <div class="text-center space-y-1 py-2">
          <div class="inline-flex p-3 rounded-full bg-primary-500/10 text-primary mb-2">
            <UIcon name="i-lucide-log-in" class="w-6 h-6" />
          </div>
          <h1 class="text-2xl font-bold tracking-tight">
            Вход в систему
          </h1>
          <p class="text-sm text-neutral-500 dark:text-neutral-400">
            Введите ваши данные для входа
          </p>
        </div>
      </template>

      <!-- Форма -->
      <UForm :state="state" class="space-y-4" @submit="onSubmit">
        <UAlert
          v-if="errorMessage"
          color="error"
          variant="subtle"
          icon="i-lucide-alert-circle"
          :title="errorMessage"
        />

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

      <!-- Подвал -->
      <template #footer>
        <div class="text-center text-sm text-neutral-500 dark:text-neutral-400 py-1">
          Ещё нет аккаунта?
          <NuxtLink
            to="/register"
            class="font-medium text-primary hover:underline transition-colors ml-1"
          >
            Зарегистрироваться
          </NuxtLink>
        </div>
      </template>
    </UCard>
  </div>
</template>
