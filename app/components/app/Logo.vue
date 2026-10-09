<template>
  <NuxtLink to="/" class="inline-block">
    <div class="h-14 flex items-center justify-center">
      <img
        :src="currentLogoUrl"
        class="h-14 w-auto object-contain"
        alt="DNZ Web"
      >
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
const colorMode = useColorMode()
const isMounted = ref(false)

const lightLogo = '/images/logo.light.png'
const darkLogo = '/images/logo.dark.png'

const currentLogoUrl = computed(() => {
  // На сервере всегда показываем светлый логотип
  if (!isMounted.value) return lightLogo
  // На клиенте уже определяем по теме
  return colorMode.value === 'dark' ? darkLogo : lightLogo
})

onMounted(() => {
  isMounted.value = true
})
</script>
