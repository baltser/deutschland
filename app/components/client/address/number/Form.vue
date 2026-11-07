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
    class="relative overflow-hidden p-6 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-xl space-y-4"
    @submit.prevent="emit('submit')"
  >
    <!-- Фоновое изображение формы -->
    <div class="absolute inset-0 z-0 pointer-events-none">
      <img
        src="/images/form-bg.jpg"
        alt="Form Background"
        class="w-full h-full object-cover opacity-80 dark:opacity-50"
      >
    </div>

    <!-- Содержимое формы -->
    <div class="relative z-10 space-y-4">
      <div class="flex items-center justify-between">
        <div class="font-bold text-xs uppercase tracking-wider text-neutral-900 dark:text-white flex items-center gap-2">
          <UIcon name="i-lucide-sparkles" class="w-4 h-4 text-primary-500" />
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
            class="w-full font-mono uppercase font-bold bg-white dark:bg-neutral-800"
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
            class="w-full bg-white dark:bg-neutral-800"
          />
        </UFormField>

        <!-- Выбор интервала -->
        <div class="space-y-1.5">
          <label class="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
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
                  ? 'shadow-md shadow-primary-500/20 ring-2 ring-primary-500/30'
                  : 'bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-200 border-neutral-300 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800'
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
          class="group relative px-6 py-2.5 font-medium tracking-wide text-white bg-gradient-to-r from-primary-600 via-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-600 shadow-lg shadow-primary-500/20 hover:shadow-xl hover:shadow-primary-500/30 transition-all duration-300 rounded-xl border border-primary-400/30 active:scale-[0.98]"
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
