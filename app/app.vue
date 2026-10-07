<script setup lang="ts">
// Глобальные настройки тегов <head>
useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' }
  ],
  htmlAttrs: {
    lang: 'ru' // или 'de', в зависимости от целевой аудитории
  }
})

// Базовые SEO-метаданные с шаблоном заголовка
useSeoMeta({
  titleTemplate: title => title ? `${title} — DNZ` : 'Dvor na zamok',
  description: 'Описание вашего сайта или сервиса',
  ogImage: '/og-image.png',
  twitterCard: 'summary_large_image'
})
</script>

<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
