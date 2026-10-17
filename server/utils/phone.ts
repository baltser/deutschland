export function normalizeAndValidatePhone(rawPhone: string): string {
  if (!rawPhone) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Укажите номер телефона'
    })
  }

  // Очищаем от любых символов, оставляя только цифры
  let phone = rawPhone.replace(/\D/g, '')

  // Автозамена русской восьмерки на 7
  if (phone.startsWith('8') && phone.length === 11) {
    phone = '7' + phone.slice(1)
  }

  // Строгая проверка: ровно 11 цифр и начинается с 79 (мобильные РФ)
  const phoneRegex = /^79\d{9}$/
  if (!phoneRegex.test(phone)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Введите корректный мобильный номер телефона (например, +7 999 123-45-67)'
    })
  }

  return phone
}
