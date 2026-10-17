<script setup lang="ts">
definePageMeta({ layout: 'auth' })

useSeoMeta({
  title: 'Вход в систему',
  description: 'Авторизация по номеру телефона и паролю'
})

const { isLoading, errorMessage } = useAuth()
const { fetch: refreshSession } = useUserSession()
const router = useRouter()

const state = reactive({
  phone: '',
  password: ''
})

const showPassword = ref(false)

// 📞 Функция автоформатирования телефона на лету (точно такая же, как в регистрации)
const formatPhone = (value: string) => {
  let cleaned = value.replace(/\D/g, '')
  if (cleaned.length > 11) cleaned = cleaned.slice(0, 11)

  if (cleaned.startsWith('8') && cleaned.length === 11) {
    cleaned = '7' + cleaned.slice(1)
  }

  if (cleaned.length === 0) return ''

  let result = '+7'
  if (cleaned.length > 1) {
    result += ` (${cleaned.slice(1, 4)}`
  }
  if (cleaned.length >= 4) {
    result += `) ${cleaned.slice(4, 7)}`
  }
  if (cleaned.length >= 7) {
    result += `-${cleaned.slice(7, 9)}`
  }
  if (cleaned.length >= 9) {
    result += `-${cleaned.slice(9, 11)}`
  }
  return result
}

const handlePhoneInput = (val: string) => {
  state.phone = formatPhone(val)
}

// Обработка отправки формы входа
async function onLogin() {
  errorMessage.value = ''

  const rawPhone = state.phone.replace(/\D/g, '')
  if (rawPhone.length < 11) {
    errorMessage.value = 'Введите корректный номер телефона (11 цифр)'
    return
  }

  if (!state.password) {
    errorMessage.value = 'Введите пароль'
    return
  }

  try {
    isLoading.value = true
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: {
        phone: rawPhone,
        password: state.password
      }
    })

    // Обновляем сессию и перенаправляем в личный кабинет
    await refreshSession()
    await router.push('/')
  } catch (err: unknown) {
    const fetchErr = err as { data?: { message?: string; statusMessage?: string } }
    errorMessage.value = fetchErr?.data?.statusMessage || fetchErr?.data?.message || 'Неверный номер телефона или пароль'
  } finally {
    isLoading.value = false
  }
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
      <!-- Поле телефона с автоформатированием -->
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

      <!-- Поле пароля с глазиком -->
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
