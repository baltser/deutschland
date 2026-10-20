<script setup lang="ts">
useSeoMeta({
  title: 'Настройки системы',
  description: 'Управление темой, безопасностью и уведомлениями'
})

const { user } = useUserSession()
const toast = useToast()

// Состояние формы смены пароля
const passwordState = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const isChangingPassword = ref(false)

// Состояние настроек уведомлений
const notifications = reactive({
  smsAlerts: true,
  emailAlerts: false
})

async function onChangePassword() {
  if (passwordState.newPassword !== passwordState.confirmPassword) {
    toast.add({ title: 'Пароли не совпадают', color: 'error' })
    return
  }

  try {
    isChangingPassword.value = true
    // Здесь отправка на ваш API смены пароля
    // await $fetch('/api/user/change-password', { method: 'POST', body: passwordState })

    toast.add({ title: 'Пароль успешно изменён', color: 'success' })
    passwordState.currentPassword = ''
    passwordState.newPassword = ''
    passwordState.confirmPassword = ''
  } catch {
    toast.add({ title: 'Ошибка при смене пароля', color: 'error' })
  } finally {
    isChangingPassword.value = false
  }
}
</script>

<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-neutral-900 dark:text-white">Настройки</h1>
      <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
        Управление внешним видом приложения, параметрами безопасности и уведомлениями
      </p>
    </div>

    <!-- 1. Оформление -->
    <UCard>
      <template #header>
        <div class="flex items-center gap-2 font-semibold text-sm">
          <UIcon name="i-lucide-palette" class="w-4 h-4 text-primary" />
          <span>Внешний вид</span>
        </div>
      </template>

      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium">Тема оформления</p>
          <p class="text-xs text-neutral-400">Выберите комфортную цветовую схему для работы</p>
        </div>
        <UColorModeButton />
      </div>
    </UCard>

    <!-- 2. Безопасность -->
    <UCard>
      <template #header>
        <div class="flex items-center gap-2 font-semibold text-sm">
          <UIcon name="i-lucide-shield-check" class="w-4 h-4 text-primary" />
          <span>Безопасность</span>
        </div>
      </template>

      <UForm :state="passwordState" class="space-y-4 max-w-md" @submit="onChangePassword">
        <UFormField label="Текущий пароль" name="currentPassword">
          <UInput v-model="passwordState.currentPassword" type="password" placeholder="••••••••" class="w-full" />
        </UFormField>

        <UFormField label="Новый пароль" name="newPassword">
          <UInput v-model="passwordState.newPassword" type="password" placeholder="••••••••" class="w-full" />
        </UFormField>

        <UFormField label="Подтвердите новый пароль" name="confirmPassword">
          <UInput v-model="passwordState.confirmPassword" type="password" placeholder="••••••••" class="w-full" />
        </UFormField>

        <UButton
          type="submit"
          color="primary"
          size="sm"
          icon="i-lucide-key-round"
          :loading="isChangingPassword"
        >
          Обновить пароль
        </UButton>
      </UForm>
    </UCard>

    <!-- 3. Уведомления -->
    <UCard>
      <template #header>
        <div class="flex items-center gap-2 font-semibold text-sm">
          <UIcon name="i-lucide-bell" class="w-4 h-4 text-primary" />
          <span>Уведомления</span>
        </div>
      </template>

      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium">SMS-оповещения</p>
            <p class="text-xs text-neutral-400">Получать важные сервисные SMS на телефон {{ user?.phone }}</p>
          </div>
          <USwitch v-model="notifications.smsAlerts" />
        </div>

        <div class="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-neutral-800">
          <div>
            <p class="text-sm font-medium">Email-рассылка</p>
            <p class="text-xs text-neutral-400">Отправлять отчеты и системные логи на почту</p>
          </div>
          <USwitch v-model="notifications.emailAlerts" />
        </div>
      </div>
    </UCard>
  </div>
</template>
