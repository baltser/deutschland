<script setup lang="ts">
useSeoMeta({
  title: 'Регистрация',
  description: 'Создание нового аккаунта в системе DNZ'
})

// Подключаем управление сессией
const { fetch: refreshSession } = useUserSession()
const toast = useToast()
// Состояние формы
const state = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: ''
})

// Состояние загрузки и ошибки
const isLoading = ref(false)
const errorMessage = ref('')

// Обработчик отправки формы
async function onSubmit() {
  errorMessage.value = ''

  // Валидация совпадения паролей
  if (state.password !== state.confirmPassword) {
    errorMessage.value = 'Пароли не совпадают'
    return
  }

  isLoading.value = true

  try {
    // 1. Отправляем запрос на серверный эндпоинт
    await $fetch('/api/auth/register', {
      method: 'POST',
      body: {
        name: state.name,
        email: state.email,
        password: state.password
      }
    })

    // 2. Обновляем состояние useUserSession на клиенте
    await refreshSession()

    // 3. Перенаправляем на главную страницу
    await navigateTo('/')
  } catch (err: unknown) {
    const fetchError = err as { data?: { statusMessage?: string; message?: string } }
    toast.add({
      title: 'Ошибка',
      description: fetchError.data?.statusMessage || fetchError.data?.message || 'Ошибка регистрации',
      color: 'error',
    })
  }finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-[calc(100vh-16rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <UCard class="w-full max-w-md shadow-lg border border-(--ui-border)">
      <!-- Заголовок карточки -->
      <template #header>
        <div class="text-center space-y-1 py-2">
          <div class="inline-flex p-3 rounded-full bg-primary-500/10 text-primary mb-2">
            <UIcon name="i-lucide-user-plus" class="w-6 h-6" />
          </div>
          <h1 class="text-2xl font-bold tracking-tight">
            Создание аккаунта
          </h1>
          <p class="text-sm text-neutral-500 dark:text-neutral-400">
            Заполните данные для регистрации в системе
          </p>
        </div>
      </template>

      <!-- Форма регистрации -->
      <UForm :state="state" class="space-y-4" @submit="onSubmit">
        <!-- Сообщение об ошибке -->
        <UAlert
          v-if="errorMessage"
          color="error"
          variant="subtle"
          icon="i-lucide-alert-circle"
          :title="errorMessage"
        />

        <!-- Поле Имя -->
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

        <!-- Поле Email -->
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

        <!-- Поле Пароль -->
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

        <!-- Поле Подтверждение пароля -->
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

        <!-- Кнопка Регистрации -->
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

      <!-- Подвал карточки со ссылкой на вход -->
      <template #footer>
        <div class="text-center text-sm text-neutral-500 dark:text-neutral-400 py-1">
          Уже есть аккаунт?
          <NuxtLink
            to="/login"
            class="font-medium text-primary hover:underline transition-colors ml-1"
          >
            Войти
          </NuxtLink>
        </div>
      </template>
    </UCard>
  </div>
</template>
