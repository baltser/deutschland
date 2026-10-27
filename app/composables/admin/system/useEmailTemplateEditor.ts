import { useEmailTemplatesStore } from '~/stores/admin/emailTemplates'

export function useEmailTemplateEditor() {
  const store = useEmailTemplatesStore()

  const previewMode = ref<'desktop' | 'mobile'>('desktop')
  const textareaRef = ref<HTMLTextAreaElement | null>(null)

  // Универсальная вставка текста в позицию курсора textarea
  function insertAtCursor(text: string) {
    const el = textareaRef.value as unknown as { $el?: HTMLElement }
    const textarea = el?.$el?.querySelector('textarea') || (textareaRef.value as unknown as HTMLTextAreaElement)

    if (!textarea || typeof textarea.selectionStart !== 'number') {
      store.form.body_html += text
      return
    }

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    store.form.body_html = store.form.body_html.substring(0, start) + text + store.form.body_html.substring(end)

    nextTick(() => {
      textarea.focus()
      textarea.setSelectionRange(start + text.length, start + text.length)
    })
  }

  // Вставка переменной в позицию курсора
  function insertVariable(variableName: string) {
    insertAtCursor(`{{${variableName}}}`)
  }

  // Вставка тега логотипа с cid
  function insertLogo() {
    const logoTag = '<div style="text-align: center; margin-bottom: 24px;">\n  <img src="cid:logo@dnz" alt="Логотип" style="max-width: 140px; height: auto;" />\n</div>'
    insertAtCursor(logoTag)
  }

  // Генерация HTML для превью с тестовыми данными
  const previewHtml = computed(() => {
    let html = store.form.body_html || ''
    const testVariables: Record<string, string> = {
      userName: 'Иван Иванов',
      verificationLink: 'http://localhost:3000/api/auth/verify?token=test_token_123',
      appUrl: 'http://localhost:3000'
    }

    for (const [key, val] of Object.entries(testVariables)) {
      html = html.replace(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g'), val)
    }

    // Подменяем cid на публичный путь для превью
    html = html.replace(/src="cid:logo@dnz"/g, 'src="/images/logo.light.png"')

    return html
  })

  return {
    previewMode,
    textareaRef,
    previewHtml,
    insertVariable,
    insertLogo
  }
}
