<template>
  <NuxtLink to="/" class="inline-flex items-center shrink-0">
    <div class="h-12 w-36 flex items-center justify-start overflow-hidden">
      <img
        :src="currentLogoUrl"
        class="h-full w-full object-contain transition-all duration-150"
        alt="Двор на замок"
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
  if (!isMounted.value) return lightLogo
  return colorMode.value === 'dark' ? darkLogo : lightLogo
})

onMounted(() => {
  isMounted.value = true
})
</script>
