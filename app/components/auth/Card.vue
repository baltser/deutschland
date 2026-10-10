<!-- app/components/auth/AuthCard.vue -->
<script setup lang="ts">
defineProps<{
  title: string
  description: string
  errorMessage?: string
  footerText: string
  footerLinkText: string
  footerTo: string
}>()
</script>

<template>
  <UCard class="w-full max-w-md shadow-lg border border-(--ui-border)">
    <!-- Заголовок -->
    <template #header>
      <div class="text-center space-y-1 py-2">
        <AppLogo />
        <h1 class="text-2xl font-bold tracking-tight">
          {{ title }}
        </h1>
        <p class="text-sm text-neutral-500 dark:text-neutral-400">
          {{ description }}
        </p>
      </div>
    </template>

    <!-- Содержимое (форма) -->
    <div class="space-y-4">
      <UAlert
        v-if="errorMessage"
        color="error"
        variant="subtle"
        icon="i-lucide-alert-circle"
        :title="errorMessage"
      />
      <slot />
    </div>

    <!-- Подвал со ссылкой -->
    <template #footer>
      <div class="text-center text-sm text-neutral-500 dark:text-neutral-400 py-1">
        {{ footerText }}
        <NuxtLink
          :to="footerTo"
          class="font-medium text-primary hover:underline transition-colors ml-1"
        >
          {{ footerLinkText }}
        </NuxtLink>
      </div>
    </template>
  </UCard>
</template>
