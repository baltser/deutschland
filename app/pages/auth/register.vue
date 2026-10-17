<script setup lang="ts">
import {formatPhone} from "~/utils/formatPhone.ts";

definePageMeta({ layout: 'auth' })

useSeoMeta({
  title: 'Регистрация',
  description: 'Создание нового аккаунта по номеру телефона'
})

const { isLoading, errorMessage } = useAuth()
const { fetch: refreshSession } = useUserSession()
const router = useRouter()

const state = reactive({
  phone: '',
  password: ''
})

const showPassword = ref(false)
const step = ref<'input' | 'phone-verify'>('input')
const phoneCode = ref('')


const handlePhoneInput = (val: string) => {
  state.phone = formatPhone(val)
}

// Шаг 1: Валидация и отправка запроса на звонок
async function onSubmit() {
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

  if (state.password.length < 6) {
    errorMessage.value = 'Пароль должен быть не менее 6 символов'
    return
  }

  try {
    isLoading.value = true
    await $fetch('/api/auth/send-code', {
      method: 'POST',
      body: {
        phone: rawPhone,
        password: state.password
      }
    })
    step.value = 'phone-verify'
  } catch (err: unknown) {
    const fetchErr = err as { data?: { message?: string; statusMessage?: string } }
    errorMessage.value = fetchErr?.data?.statusMessage || fetchErr?.data?.message || 'Не удалось отправить звонок'
  } finally {
    isLoading.value = false
  }
}

// Шаг 2: Проверка 4 цифр из звонка
async function verifyPhoneCode() {
  errorMessage.value = ''

  if (phoneCode.value.length < 4) {
    errorMessage.value = 'Введите 4 цифры входящего номера'
    return
  }

  try {
    isLoading.value = true
    const rawPhone = state.phone.replace(/\D/g, '')

    await $fetch('/api/auth/verify-and-register', {
      method: 'POST',
      body: {
        phone: rawPhone,
        code: phoneCode.value
      }
    })

    await refreshSession()
    await router.push('/')
  } catch (err: unknown) {
    const fetchErr = err as { data?: { message?: string; statusMessage?: string } }
    errorMessage.value = fetchErr?.data?.statusMessage || fetchErr?.data?.message || 'Не удалось отправить звонок'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <AuthCard
    title="Регистрация"
    :description="step === 'input' ? 'Введите телефон и придумайте пароль' : 'Введите последние 4 цифры входящего номера'"
    :error-message="errorMessage"
    footer-text="Уже есть аккаунт?"
    footer-link-text="Войти"
    footer-to="/auth/login"
  >
    <!-- Шаг 1: Форма ввода -->
    <UForm v-if="step === 'input'" :state="state" class="space-y-4" @submit="onSubmit">
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
        icon="i-lucide-phone-call"
        :loading="isLoading"
        class="mt-6"
      >
        Получить звонок и зарегистрироваться
      </UButton>
    </UForm>

    <!-- Шаг 2: Ввод кода из входящего звонка -->
    <div v-else class="space-y-4">
      <div class="text-sm text-neutral-600 dark:text-neutral-300 text-center pb-2">
        Вам поступает звонок. Введите последние 4 цифры номера входящего вызова.
      </div>

      <UFormField label="Код подтверждения (4 цифры)" name="code" required>
        <UInput
          v-model="phoneCode"
          placeholder="1234"
          maxlength="4"
          icon="i-lucide-shield-check"
          size="lg"
          class="w-full text-center text-lg tracking-widest"
        />
      </UFormField>

      <UButton
        color="primary"
        block
        size="lg"
        icon="i-lucide-check-circle"
        :loading="isLoading"
        class="mt-4"
        @click="verifyPhoneCode"
      >
        Подтвердить и войти
      </UButton>

      <div class="text-center pt-2">
        <UButton variant="link" size="xs" @click="step = 'input'">
          Изменить номер телефона
        </UButton>
      </div>
    </div>
  </AuthCard>
</template>
