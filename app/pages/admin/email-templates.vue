<script setup lang="ts">
import { ref, computed, onMounted, nextTick, reactive } from 'vue'

definePageMeta({ layout: 'default' })
useSeoMeta({ title: 'Управление шаблонами писем' })

interface EmailTemplate {
  template_id: number
  slug: string
  title: string
  subject: string
  body_html: string
  updated_at: string
}

interface ApiError {
  data?: {
    message?: string
  }
}

const toast = useToast()
const templates = ref<EmailTemplate[]>([])
const selectedSlug = ref<string>('email_verification')
const isLoading = ref(false)
const isSaving = ref(false)
const previewMode = ref<'desktop' | 'mobile'>('desktop')
const textareaRef = ref<HTMLTextAreaElement | null>(null)

const form = reactive({
  title: '',
  subject: '',
  body_html: ''
})

async function fetchTemplates() {
  isLoading.value = true
  try {
    const data = await $fetch<{ success: boolean; templates: EmailTemplate[] }>('/api/admin/email-templates')
    templates.value = data.templates
    if (templates.value.length > 0) {
      selectTemplate(templates.value[0]!.slug)
    }
  } catch (err: unknown) {
    const apiErr = err as ApiError
    toast.add({
      title: 'Ошибка',
      description: apiErr?.data?.message || 'Не удалось загрузить шаблоны',
      color: 'error'
    })
  } finally {
    isLoading.value = false
  }
}

function selectTemplate(slug: string) {
  selectedSlug.value = slug
  const found = templates.value.find(t => t.slug === slug)
  if (found) {
    form.title = found.title
    form.subject = found.subject
    form.body_html = found.body_html
  }
}

function insertVariable(variableName: string) {
  const tag = `{{${variableName}}}`
  const el = textareaRef.value as unknown as { $el?: HTMLElement }
  const textarea = el?.$el?.querySelector('textarea') || (textareaRef.value as unknown as HTMLTextAreaElement)

  if (!textarea || typeof textarea.selectionStart !== 'number') {
    form.body_html += tag
    return
  }

  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  form.body_html = form.body_html.substring(0, start) + tag + form.body_html.substring(end)

  nextTick(() => {
    textarea.focus()
    textarea.setSelectionRange(start + tag.length, start + tag.length)
  })
}

async function saveTemplate() {
  isSaving.value = true
  try {
    const res = await $fetch<{ success: boolean; template: EmailTemplate }>(`/api/admin/email-templates/${selectedSlug.value}`, {
      method: 'PUT',
      body: form
    })
    const index = templates.value.findIndex(t => t.slug === selectedSlug.value)
    if (index !== -1 && res.template) {
      templates.value[index] = res.template
    }
    toast.add({ title: 'Успешно', description: 'Шаблон сохранен в базу данных', color: 'success' })
  } catch (err: unknown) {
    const apiErr = err as ApiError
    toast.add({
      title: 'Ошибка',
      description: apiErr?.data?.message || 'Не удалось сохранить',
      color: 'error'
    })
  } finally {
    isSaving.value = false
  }
}

const previewHtml = computed(() => {
  let html = form.body_html || ''
  const testVariables: Record<string, string> = {
    userName: 'Иван Иванов',
    verificationLink: 'http://localhost:3000/api/auth/verify?token=test_token_123',
    appUrl: 'http://localhost:3000'
  }

  for (const [key, val] of Object.entries(testVariables)) {
    html = html.replace(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g'), val)
  }
  return html
})

onMounted(() => fetchTemplates())
</script>

<template>
  <div class="max-w-6xl mx-auto p-6 lg:p-8 space-y-8">
    <!-- Шапка страницы -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
      <div>
        <h1 class="text-2xl font-bold flex items-center gap-2">
          <UIcon name="i-lucide-mail-template" class="text-primary size-6" />
          Шаблоны email-рассылок
        </h1>
        <p class="text-sm text-gray-500">Управление темами и версткой системных писем</p>
      </div>

      <div class="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-900 p-1.5 rounded-xl border">
        <button
          v-for="t in templates"
          :key="t.slug"
          class="px-3.5 py-2 text-xs font-medium rounded-lg transition-all"
          :class="selectedSlug === t.slug ? 'bg-white dark:bg-gray-800 text-primary shadow-xs font-semibold' : 'text-gray-600 dark:text-gray-400'"
          @click="selectTemplate(t.slug)"
        >
          {{ t.title }}
        </button>
      </div>
    </div>

    <div v-if="isLoading" class="text-center py-24 text-gray-400">
      Загрузка шаблонов...
    </div>

    <div v-else class="space-y-8">
      <!-- Блок 1: Редактор кода -->
      <UCard class="p-6 lg:p-7 space-y-6 shadow-sm rounded-2xl border">
        <div class="flex items-center justify-between border-b pb-4">
          <h2 class="text-base font-semibold">Редактирование шаблона</h2>
          <span class="text-xs font-mono text-gray-400 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-md">slug: {{ selectedSlug }}</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <UFormField label="Название шаблона" required>
            <UInput v-model="form.title" class="w-full" icon="i-lucide-tag" />
          </UFormField>
          <UFormField label="Тема письма (Subject)" required>
            <UInput v-model="form.subject" class="w-full" icon="i-lucide-heading" />
          </UFormField>
        </div>

        <!-- Переменные -->
        <div class="space-y-2 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border">
          <span class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Быстрая вставка переменных:</span>
          <div class="flex flex-wrap gap-2 pt-1">
            <UButton size="xs" variant="subtle" color="neutral" icon="i-lucide-plus" @click="insertVariable('userName')">
              &#123;&#123; userName &#125;&#125;
            </UButton>
            <UButton size="xs" variant="subtle" color="neutral" icon="i-lucide-plus" @click="insertVariable('verificationLink')">
              &#123;&#123; verificationLink &#125;&#125;
            </UButton>
            <UButton size="xs" variant="subtle" color="neutral" icon="i-lucide-plus" @click="insertVariable('appUrl')">
              &#123;&#123; appUrl &#125;&#125;
            </UButton>
          </div>
        </div>

        <UFormField label="HTML-код тела письма" required>
          <UTextarea ref="textareaRef" v-model="form.body_html" :rows="14" class="w-full font-mono text-xs leading-relaxed" />
        </UFormField>

        <div class="flex justify-end pt-4 border-t">
          <UButton color="primary" icon="i-lucide-save" size="lg" :loading="isSaving" @click="saveTemplate">
            Сохранить изменения
          </UButton>
        </div>
      </UCard>

      <!-- Блок 2: Предпросмотр через iframe -->
      <div class="space-y-4">
        <div class="flex items-center justify-between px-1">
          <h2 class="text-sm font-semibold flex items-center gap-1.5">
            <UIcon name="i-lucide-eye" /> Предпросмотр в почтовом клиенте
          </h2>
          <div class="flex items-center gap-1 bg-gray-100 dark:bg-gray-900 p-1 rounded-lg border">
            <button class="px-2.5 py-1 text-xs rounded-md font-medium" :class="previewMode === 'desktop' ? 'bg-white dark:bg-gray-800 shadow-xs' : 'text-gray-500'" @click="previewMode = 'desktop'">
              Desktop
            </button>
            <button class="px-2.5 py-1 text-xs rounded-md font-medium" :class="previewMode === 'mobile' ? 'bg-white dark:bg-gray-800 shadow-xs' : 'text-gray-500'" @click="previewMode = 'mobile'">
              Mobile
            </button>
          </div>
        </div>

        <div class="rounded-2xl border bg-gray-50 dark:bg-gray-950 overflow-hidden shadow-xl">
          <div class="bg-gray-100 dark:bg-gray-900 px-4 py-3 border-b flex items-center justify-between text-xs">
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded-full bg-rose-500/80" />
              <div class="w-3 h-3 rounded-full bg-amber-500/80" />
              <div class="w-3 h-3 rounded-full bg-emerald-500/80" />
            </div>
            <span class="text-gray-400 font-mono">Тема: {{ form.subject }}</span>
          </div>
          <div class="p-8 bg-white dark:bg-gray-900 min-h-[420px] flex justify-center items-start overflow-auto">
            <div
              :class="previewMode === 'mobile' ? 'w-[360px] h-[500px] border rounded-xl shadow-lg bg-white overflow-hidden' : 'w-full max-w-2xl h-[500px] bg-white overflow-hidden'"
            >
              <iframe
                role="region"
                title="Предпросмотр письма"
                :srcdoc="previewHtml"
                class="w-full h-full border-0 bg-white"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
