<script setup lang="ts">
import { ref, reactive, onUnmounted } from 'vue'

useSeoMeta({
  title: 'Регистрация',
  description: 'Создание нового аккаунта в системе DNZ'
})

const { fetch: refreshSession } = useUserSession()
const toast = useToast()

// Состояние формы
const state = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: ''
})

// Состояние аватара
const avatarFile = ref<File | null>(null)
const avatarPreview = ref<string>('')
const fileInputRef = ref<HTMLInputElement | null>(null)

// Состояние загрузки и ошибки
const isLoading = ref(false)
const errorMessage = ref('')

// Клиентская выборка и валидация аватара
function triggerAvatarSelect() {
  fileInputRef.value?.click()
}

function handleAvatarChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    toast.add({
      title: 'Недопустимый формат',
      description: 'Выберите изображение в формате JPG, PNG или WEBP',
      color: 'error'
    })
    return
  }

  // Ограничение 2 МБ
  if (file.size > 2 * 1024 * 1024) {
    toast.add({
      title: 'Файл слишком большой',
      description: 'Максимальный размер аватара — 2 МБ',
      color: 'error'
    })
    return
  }

  // Очищаем старое превью при наличии
  if (avatarPreview.value) {
    URL.revokeObjectURL(avatarPreview.value)
  }

  avatarFile.value = file
  avatarPreview.value = URL.createObjectURL(file)
}

function removeAvatar() {
  if (avatarPreview.value) {
    URL.revokeObjectURL(avatarPreview.value)
  }
  avatarFile.value = null
  avatarPreview.value = ''
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

// Освобождаем память при уходе со страницы
onUnmounted(() => {
  if (avatarPreview.value) {
    URL.revokeObjectURL(avatarPreview.value)
  }
})

// Обработчик отправки формы
async function onSubmit() {
  errorMessage.value = ''

  if (state.password !== state.confirmPassword) {
    errorMessage.value = 'Пароли не совпадают'
    return
  }

  isLoading.value = true

  try {
    // Собираем FormData для единовременной отправки текста и файла
    const formData = new FormData()
    formData.append('name', state.name)
    formData.append('email', state.email)
    formData.append('password', state.password)

    if (avatarFile.value) {
      formData.append('avatar', avatarFile.value)
    }

    // 1. Отправляем FormData
    await $fetch('/api/auth/register', {
      method: 'POST',
      body: formData
    })

    // 2. Обновляем сессию пользователя
    await refreshSession()

    // 3. Перенаправляем на главную
    await navigateTo('/')
  } catch (err: unknown) {
    const fetchError = err as { data?: { statusMessage?: string; message?: string } }
    toast.add({
      title: 'Ошибка',
      description: fetchError.data?.statusMessage || fetchError.data?.message || 'Ошибка регистрации',
      color: 'error'
    })
  } finally {
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
          <AppLogo />
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

        <!-- Блок загрузки Аватара -->
        <div class="flex flex-col items-center justify-center py-2 space-y-2">
          <div class="relative group">
            <button
              type="button"
              class="w-20 h-20 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center overflow-hidden border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-primary transition-colors focus:outline-none"
              @click="triggerAvatarSelect"
            >
              <img
                v-if="avatarPreview"
                :src="avatarPreview"
                alt="Превью аватара"
                class="w-full h-full object-cover"
              >
              <div v-else class="flex flex-col items-center text-neutral-400">
                <UIcon name="i-lucide-camera" class="w-7 h-7" />
                <span class="text-[10px] mt-0.5 font-medium">Фото</span>
              </div>

              <!-- Оверлей при наведении -->
              <div
                class="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <UIcon name="i-lucide-image-plus" class="w-6 h-6 text-white" />
              </div>
            </button>

            <!-- Кнопка удаления выбранного фото -->
            <button
              v-if="avatarPreview"
              type="button"
              class="absolute -top-1 -right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-sm"
              title="Удалить фото"
              @click.stop="removeAvatar"
            >
              <UIcon name="i-lucide-x" class="w-3.5 h-3.5" />
            </button>
          </div>

          <p class="text-xs text-neutral-400">
            Аватар (необязательно, до 2 МБ)
          </p>

          <input
            ref="fileInputRef"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            class="hidden"
            @change="handleAvatarChange"
          >
        </div>

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
