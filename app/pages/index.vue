<script setup lang="ts">
// Описываем метаданные страницы для SEO
useSeoMeta({
  title: 'Главная панель',
  description: 'Добро пожаловать на платформу Двор на замок'
})
</script>

<template>
  <div class="space-y-8 max-w-4xl mx-auto p-6 md:p-8">
    <!-- Приветствие и инструкция -->
    <div class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 md:p-8 shadow-sm space-y-6">

      <!-- Заголовок -->
      <div class="space-y-3">
        <h2 class="text-xl md:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
          Добро пожаловать на платформу
        </h2>
        <h1 class="text-2xl md:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
          «Двор на замок»!
        </h1>

        <div class="space-y-3 text-sm md:text-base text-neutral-600 dark:text-neutral-300 leading-relaxed pt-2">
          <p>
            Если вы являетесь нашим клиентом и имеете доступ к номеру телефона, который указан в договоре,
            вы можете получить все необходимые функции для доступа ваших гостей через шлагбаум.
          </p>
          <p>
            Если вы пользуетесь платформой <strong>впервые</strong>, вам необходимо пройти регистрацию и указать пароль для последующего входа.
          </p>
          <p class="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-200 text-xs md:text-sm">
            💡 <strong>Настоятельно рекомендуем</strong> после входа перейти в личный кабинет (нажав на кнопку с вашим именем) и указать ваш реальный email, по которому вы в будущем сможете восстановить пароль в случае его утери.
          </p>
        </div>
      </div>

      <!-- Блок связи с поддержкой -->
      <div class="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs md:text-sm text-neutral-500 dark:text-neutral-400">
        <span>В случае проблем или вопросов:</span>
        <a
          href="mailto:support@example.com"
          class="inline-flex items-center gap-1.5 font-medium text-primary-600 dark:text-primary-400 hover:underline"
        >
          <UIcon name="i-lucide-mail" class="w-4 h-4" />
          Обратитесь к нам на почту: support@example.com
        </a>
      </div>

    </div>
  </div>
</template>
