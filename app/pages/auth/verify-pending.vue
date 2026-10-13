<script setup lang="ts">
definePageMeta({
  layout: 'auth'
})
</script>

<template>
  <UCard class="max-w-md mx-auto mt-12 text-center p-6">
    <template #header>
      <div class="flex justify-center mb-2">
        <UIcon name="i-lucide-mail-check" class="w-12 h-12 text-primary" />
      </div>
      <h2 class="text-xl font-bold">Подтвердите вашу почту</h2>
    </template>

    <p class="text-gray-500 dark:text-gray-400 text-sm mb-6">
      Мы отправили письмо со ссылкой для подтверждения на ваш электронный адрес. Пожалуйста, перейдите по ней, чтобы активировать аккаунт.
    </p>

    <div class="space-y-3">
      <UButton to="/auth/login" variant="subtle" block>
        Вернуться к входу
      </UButton>
    </div>
  </UCard>
</template>
