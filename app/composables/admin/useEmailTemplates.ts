// composables/admin/useEmailTemplates.ts
export interface EmailTemplate {
  template_id: number
  slug: string
  title: string
  subject: string
  body_html: string
  updated_at: string
}

export function useEmailTemplates() {
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

  // Получение списка шаблонов
  async function fetchTemplates() {
    isLoading.value = true
    try {
      const data = await $fetch<{ success: boolean; templates: EmailTemplate[] }>('/api/admin/email-templates')
      templates.value = data.templates
      if (templates.value.length > 0) {
        selectTemplate(templates.value[0]!.slug)
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

  // Вставка переменной в позицию курсора textarea
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

  // Сохранение шаблона
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

  // Генерация HTML для превью с тестовыми данными
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

  return {
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
  }
}
