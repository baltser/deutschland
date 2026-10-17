<script setup lang="ts">
import { useEmailTemplates } from '~/composables/admin/useEmailTemplates'

definePageMeta({ layout: 'admin' })

useSeoMeta({
  title: 'Управление шаблонами писем',
  description: 'Настройка тем и HTML-верстки системных email-уведомлений'
})

const {
  templates,
  selectedSlug,
  isLoading,
  isSaving,
  previewMode,
  textareaRef,
  form,
  previewHtml,
  fetchTemplates,
  selectTemplate,
  insertVariable,
  saveTemplate
} = useEmailTemplates()

onMounted(() => {
  fetchTemplates()
})
</script>

<template>
  <div class="max-w-5xl mx-auto p-6 md:p-8 space-y-6">
    <!-- Шапка страницы и переключатель шаблонов -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
      <div>
        <h1 class="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
          <UIcon name="i-lucide-mail-template" class="text-primary w-5 h-5" />
          Шаблоны email-рассылок
        </h1>
        <p class="text-xs text-neutral-500">Управление темами и версткой системных писем</p>
      </div>

      <!-- Вкладки выбора шаблона -->
      <div class="flex flex-wrap items-center gap-1.5 bg-neutral-100 dark:bg-neutral-800 p-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700">
        <UButton
          v-for="t in templates"
          :key="t.slug"
          size="xs"
          :variant="selectedSlug === t.slug ? 'solid' : 'ghost'"
          :color="selectedSlug === t.slug ? 'primary' : 'neutral'"
          @click="selectTemplate(t.slug)"
        >
          {{ t.title }}
        </UButton>
      </div>
    </div>

    <!-- Индикатор загрузки -->
    <div v-if="isLoading" class="text-center py-24 text-neutral-400 text-sm">
      Загрузка шаблонов...
    </div>

    <!-- Основной вертикальный стек -->
    <div v-else class="space-y-6">

      <!-- БЛОК 1 (ВВЕРХУ): Живой превью в почтовом клиенте -->
      <div class="space-y-3 bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
        <div class="flex items-center justify-between">
          <h2 class="text-sm font-semibold text-neutral-900 dark:text-white flex items-center gap-1.5">
            <UIcon name="i-lucide-eye" class="w-4 h-4 text-primary" /> Предпросмотр письма
          </h2>
          <!-- Переключатель Desktop / Mobile превью -->
          <div class="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg border border-neutral-200 dark:border-neutral-700">
            <button
              class="px-2.5 py-1 text-xs rounded-md font-medium transition-colors"
              :class="previewMode === 'desktop' ? 'bg-white dark:bg-neutral-700 shadow-xs text-neutral-900 dark:text-white' : 'text-neutral-500'"
              @click="previewMode = 'desktop'"
            >
              Desktop
            </button>
            <button
              class="px-2.5 py-1 text-xs rounded-md font-medium transition-colors"
              :class="previewMode === 'mobile' ? 'bg-white dark:bg-neutral-700 shadow-xs text-neutral-900 dark:text-white' : 'text-neutral-500'"
              @click="previewMode = 'mobile'"
            >
              Mobile
            </button>
          </div>
        </div>

        <!-- Окно почтового клиента -->
        <div class="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 overflow-hidden">
          <div class="bg-neutral-100 dark:bg-neutral-900 px-4 py-2.5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs">
            <div class="flex items-center gap-1.5">
              <div class="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
              <div class="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
              <div class="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
            </div>
            <span class="text-neutral-400 font-mono truncate max-w-md">Тема: {{ form.subject }}</span>
          </div>

          <div class="p-6 bg-white dark:bg-neutral-900 min-h-[460px] flex justify-center items-start overflow-auto">
            <div
              :class="previewMode === 'mobile' ? 'w-[340px] h-[480px] border rounded-xl shadow-md bg-white overflow-hidden' : 'w-full max-w-3xl h-[480px] bg-white overflow-hidden'"
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

      <!-- БЛОК 2 (СНИЗУ): Редактор кода, темы и полей -->
      <div class="space-y-6 bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
        <div class="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-4">
          <h2 class="text-sm font-semibold text-neutral-900 dark:text-white flex items-center gap-1.5">
            <UIcon name="i-lucide-code" class="w-4 h-4 text-primary" /> Редактирование верстки и настроек
          </h2>
          <UBadge color="neutral" variant="subtle" size="xs" class="font-mono">
            slug: {{ selectedSlug }}
          </UBadge>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UFormField label="Название шаблона" required>
            <UInput v-model="form.title" class="w-full" icon="i-lucide-tag" />
          </UFormField>
          <UFormField label="Тема письма (Subject)" required>
            <UInput v-model="form.subject" class="w-full" icon="i-lucide-heading" />
          </UFormField>
        </div>

        <!-- Быстрая вставка переменных -->
        <div class="space-y-2 bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-xl border border-neutral-200/80 dark:border-neutral-700/60">
          <span class="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Быстрая вставка переменных:</span>
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

        <!-- Текстареа для HTML-кода -->
        <UFormField label="HTML-код тела письма" required>
          <UTextarea
            ref="textareaRef"
            v-model="form.body_html"
            :rows="14"
            class="w-full font-mono text-xs leading-relaxed"
            placeholder="Введите HTML-код письма..."
          />
        </UFormField>

        <div class="flex justify-end pt-4 border-t border-neutral-200 dark:border-neutral-800">
          <UButton color="primary" icon="i-lucide-save" size="md" :loading="isSaving" @click="saveTemplate">
            Сохранить изменения
          </UButton>
        </div>
      </div>

    </div>
  </div>
</template>
