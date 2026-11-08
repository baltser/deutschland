<script setup lang="ts">
import { normalizeCarNumber } from '~/utils/inputCarNumber'

export interface FormState {
  carNumber: string
  totalHours: number
  comment: string
  selectedDeviceIds: number[]
  error: string
  submitting: boolean
}

export interface TimeIntervalOption {
  label: string
  hours: number
}

// Строгая двухсторонняя привязка формы через defineModel
const form = defineModel<FormState>('form', { required: true })

const emit = defineEmits<{
  submit: []
}>()

// Строго типизированный список интервалов доступа
const timeIntervals: readonly TimeIntervalOption[] = [
  { label: '3 мин.', hours: 3 / 60 },
  { label: '5 мин.', hours: 5 / 60 },
  { label: '3 ч.', hours: 3 },
  { label: '6 ч.', hours: 6 },
  { label: '12 ч.', hours: 12 },
  { label: '24 ч.', hours: 24 }
] as const

const handleCarNumberInput = (value: string) => {
  form.value.carNumber = normalizeCarNumber(value)
}

const selectInterval = (hours: number) => {
  form.value.totalHours = hours
}
</script>

<template>
  <form
    class="relative overflow-hidden p-6 rounded-3xl transition-all duration-300
           bg-white/80 border border-slate-200/80 shadow-xl shadow-slate-200/50 backdrop-blur-xl
           dark:bg-slate-900/85 dark:border-white/10 dark:shadow-2xl dark:shadow-black/40
           before:absolute before:inset-0 before:-z-10 before:bg-gradient-to-br
           before:from-primary-500/10 before:via-transparent before:to-emerald-500/10
           after:absolute after:inset-0 after:-z-10 after:bg-white/40 dark:after:bg-black/20"
    @submit.prevent="emit('submit')"
  >
    <!-- Декоративные свечения по углам (фирменные цвета брендинга) -->
    <div class="absolute -top-12 -left-12 w-36 h-36 bg-primary-500/15 rounded-full blur-2xl pointer-events-none" />
    <div class="absolute -bottom-12 -right-12 w-36 h-36 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />

    <!-- Содержимое формы -->
    <div class="relative z-10 space-y-4">
      <!-- Заголовок с фирменным акцентным бейджем -->
      <div class="flex items-center justify-between">
        <div class="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <div class="p-1 rounded-lg bg-primary-500/10 dark:bg-primary-500/20 text-primary-500">
            <UIcon name="i-lucide-sparkles" class="w-4 h-4" />
          </div>
          <span>Выписать пропуск на выбранные устройства ({{ form.selectedDeviceIds.length }})</span>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Номер -->
        <UFormField label="Госномер автомобиля" required :error="form.error">
          <UInput
            v-model="form.carNumber"
            placeholder="M802AO799"
            size="md"
            icon="i-lucide-car"
            class="w-full font-mono uppercase font-bold bg-white/90 dark:bg-slate-950/70 border-slate-200 dark:border-slate-800 shadow-xs focus:ring-2 focus:ring-primary-500"
            @input="handleCarNumberInput(form.carNumber)"
          />
        </UFormField>

        <!-- Комментарий -->
        <UFormField label="Назначение / Комментарий">
          <UInput
            v-model="form.comment"
            placeholder="Такси, Курьер, Гости..."
            icon="i-lucide-user"
            size="md"
            class="w-full bg-white/90 dark:bg-slate-950/70 border-slate-200 dark:border-slate-800 shadow-xs focus:ring-2 focus:ring-primary-500"
          />
        </UFormField>

        <!-- Выбор интервала -->
        <div class="space-y-1.5">
          <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Период доступа
          </label>

          <div class="flex flex-wrap gap-1.5">
            <UButton
              v-for="item in timeIntervals"
              :key="item.hours"
              type="button"
              size="xs"
              :variant="form.totalHours === item.hours ? 'solid' : 'outline'"
              :color="form.totalHours === item.hours ? 'primary' : 'neutral'"
              :class="[
                'font-semibold transition-all duration-200 rounded-xl px-3 py-1.5 shadow-2xs',
                form.totalHours === item.hours
                  ? 'shadow-md shadow-primary-500/25 ring-2 ring-primary-500/40 bg-primary-600 text-white'
                  : 'bg-white/80 dark:bg-slate-950/60 text-slate-700 dark:text-slate-200 border-slate-300/80 dark:border-slate-700 hover:border-primary-400 dark:hover:border-primary-500 hover:bg-primary-50/50 dark:hover:bg-primary-950/30'
              ]"
              @click="selectInterval(item.hours)"
            >
              {{ item.label }}
            </UButton>
          </div>
        </div>
      </div>

      <!-- Кнопка добавления номера -->
      <div class="flex justify-end pt-3">
        <UButton
          type="submit"
          color="primary"
          size="md"
          icon="i-lucide-key-round"
          :loading="form.submitting"
          class="group relative px-6 py-2.5 font-medium tracking-wide text-white
                 bg-gradient-to-r from-primary-600 via-primary-500 to-emerald-600
                 hover:from-primary-500 hover:to-emerald-500
                 shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/40
                 transition-all duration-300 rounded-xl border border-white/20 active:scale-[0.98]"
        >
          <template #icon>
            <UIcon
              name="i-lucide-key-round"
              class="w-4 h-4 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110"
            />
          </template>
          <span>Активировать пропуск</span>
        </UButton>
      </div>
    </div>
  </form>
</template>
