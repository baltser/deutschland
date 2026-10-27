export interface ApiError {
  statusCode?: number
  statusMessage?: string
  message?: string
  data?: {
    message?: string
    [key: string]: unknown
  }
}

/**
 * Безопасно извлекает читаемый текст ошибки из любого неизвестного типа catch (err)
 */
export function getErrorMessage(err: unknown, defaultMessage = 'Произошла неизвестная ошибка'): string {
  if (typeof err === 'object' && err !== null) {
    const apiErr = err as ApiError
    // Проверяем кастомное сообщение от сервера в data.message, затем стандартное message
    return apiErr.data?.message || apiErr.message || defaultMessage
  }

  if (typeof err === 'string') {
    return err
  }

  return defaultMessage
}
