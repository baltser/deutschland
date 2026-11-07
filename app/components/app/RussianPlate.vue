<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  plateNumber: string
}>()

// Умный парсер и форматировщик под стандарт ГОСТ РФ
const parsedPlate = computed(() => {
  const clean = (props.plateNumber || '').toUpperCase().replace(/[^А-ЯA-Z0-9]/g, '')

  let main = clean
  let region = ''

  if (clean.length >= 5) {
    const match = clean.match(/^(.+?)(\d{2,3})$/)
    if (match) {
      main = match[1] ?? ""
      region = match[2] ?? ""
    }
  }

  let formattedMain = main
  if (main.length > 0) {
    const firstLetter = main[0] || ''
    const digits = main.slice(1, 4) || ''
    const tailLetters = main.slice(4) || ''

    let res = firstLetter
    if (digits) res += ` ${digits}`
    if (tailLetters) res += ` ${tailLetters}`
    formattedMain = res
  }

  return {
    formattedMain: formattedMain || 'А 000 АА',
    region: region || '77'
  }
})
</script>

<template>
  <!-- Добавили тонкую белую обводку (ring) для контраста на темном фоне и whitespace-nowrap -->
  <div class="inline-flex items-center bg-white text-neutral-950 border border-neutral-900 ring-1 ring-white/80 dark:ring-white/60 rounded px-1.5 sm:px-2 py-0.5 shadow-xs font-mono select-none bg-gradient-to-b from-white via-neutral-50 to-neutral-200 translate-y-0.5 whitespace-nowrap">
    <!-- Основной блок номера с адаптивным уменьшением на мобильных экранах -->
    <div class="flex items-center text-[11px] sm:text-xs md:text-sm font-black tracking-tight sm:tracking-wider pr-1.5 sm:pr-2 text-neutral-900 whitespace-nowrap">
      <span>{{ parsedPlate.formattedMain }}</span>
    </div>

    <!-- Правый блок: регион, RUS и триколор -->
    <div class="flex items-center pl-1.5 sm:pl-2 border-l border-neutral-900">
      <div class="flex flex-col items-center justify-center text-center leading-none">
        <span class="text-[10px] sm:text-xs font-black tracking-tighter text-neutral-900">{{ parsedPlate.region }}</span>
        <div class="flex items-center gap-0.5 mt-0.5">
          <span class="text-[6px] sm:text-[7px] font-black tracking-tighter text-neutral-900">RUS</span>
          <!-- Миниатюрный флаг РФ -->
          <div class="flex flex-col w-2 h-1.5 sm:w-2.5 sm:h-1.5 border border-neutral-900 rounded-[0.5px] overflow-hidden shadow-2xs">
            <div class="bg-white flex-1"/>
            <div class="bg-blue-600 flex-1"/>
            <div class="bg-red-600 flex-1"/>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
