<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean
  phone: string
  userName: string
  role: 'admin' | 'installer'
  isCreating: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'update:phone': [value: string]
  'update:userName': [value: string]
  'update:role': [value: string]
  submit: []
  success: []
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const currentPhone = computed({
  get: () => props.phone,
  set: (val) => emit('update:phone', val)
})

const currentUserName = computed({
  get: () => props.userName,
  set: (val) => emit('update:userName', val)
})

const currentRole = computed({
  get: () => props.role,
  set: (val) => emit('update:role', val)
})
</script>

<template>
  <UModal v-model:open="isOpen" title="Добавить нового сотрудника">
    <template #body>
      <form class="space-y-4" @submit.prevent="$emit('submit')">
        <UFormField label="Номер телефона *">
          <UInput
            v-model="currentPhone"
            placeholder="+7 (999) 000-00-00"
            icon="i-lucide-phone"
            class="w-full"
            @update:model-value="(val) => emit('update:phone', val)"
          />
        </UFormField>

        <UFormField label="Имя и фамилия (необязательно)">
          <UInput
            v-model="currentUserName"
            placeholder="Иван Иванов"
            icon="i-lucide-user"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Должность / Роль">
          <USelect
            v-model="currentRole"
            :items="[
              { label: 'Монтажник (installer)', value: 'installer' },
              { label: 'Администратор (admin)', value: 'admin' }
            ]"
            class="w-full"
          />
        </UFormField>
      </form>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2 w-full">
        <UButton color="neutral" variant="ghost" @click="isOpen = false">
          Отмена
        </UButton>
        <UButton color="primary" :loading="isCreating" @click="$emit('submit')">
          Добавить
        </UButton>
      </div>
    </template>
  </UModal>
</template>
