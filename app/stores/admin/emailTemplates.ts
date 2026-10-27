import { defineStore } from 'pinia'
import type { EmailTemplate, TemplatesListResponse, TemplateUpdateResponse } from '~/types/template'

export const useEmailTemplatesStore = defineStore('email-templates', () => {
  const toast = useToast()

  const templates = ref<EmailTemplate[]>([])
  const selectedSlug = ref<string>('email_verification')
  const isLoading = ref(false)
  const isSaving = ref(false)

  // Форма редактора
  const form = reactive({
    title: '',
    subject: '',
    body_html: ''
  })

  // Получение списка шаблонов
  async function fetchTemplates() {
    isLoading.value = true
    try {
      const data = await $fetch<TemplatesListResponse>('/api/admin/email-templates')
      templates.value = data.templates
      if (templates.value.length > 0 && !templates.value.some(t => t.slug === selectedSlug.value)) {
        selectTemplate(templates.value[0]!.slug)
      } else if (templates.value.length > 0) {
        selectTemplate(selectedSlug.value)
      }
    } catch (err: unknown) {
      const fetchErr = err as { data?: { message?: string } }
      toast.add({
        title: 'Ошибка',
        description: fetchErr?.data?.message || 'Не удалось загрузить шаблоны',
        color: 'error'
      })
    } finally {
      isLoading.value = false
    }
  }

  // Выбор шаблона для редактирования
  function selectTemplate(slug: string) {
    selectedSlug.value = slug
    const found = templates.value.find(t => t.slug === slug)
    if (found) {
      form.title = found.title
      form.subject = found.subject
      form.body_html = found.body_html
    }
  }

  // Сохранение шаблона
  async function saveTemplate() {
    isSaving.value = true
    try {
      const res = await $fetch<TemplateUpdateResponse>(`/api/admin/email-templates/${selectedSlug.value}`, {
        method: 'PUT',
        body: form
      })
      const index = templates.value.findIndex(t => t.slug === selectedSlug.value)
      if (index !== -1 && res.template) {
        templates.value[index] = res.template
      }
      toast.add({ title: 'Успешно', description: 'Шаблон сохранен в базу данных', color: 'success' })
    } catch (err: unknown) {
      const fetchErr = err as { data?: { message?: string } }
      toast.add({
        title: 'Ошибка',
        description: fetchErr?.data?.message || 'Не удалось сохранить шаблон',
        color: 'error'
      })
    } finally {
      isSaving.value = false
    }
  }

  return {
    templates,
    selectedSlug,
    isLoading,
    isSaving,
    form,
    fetchTemplates,
    selectTemplate,
    saveTemplate
  }
})
