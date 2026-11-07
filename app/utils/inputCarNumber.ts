const russianToLatinMap: Record<string, string> = {
  'А': 'A', 'В': 'B', 'Е': 'E', 'К': 'K', 'М': 'M', 'Н': 'H',
  'О': 'O', 'Р': 'P', 'С': 'C', 'Т': 'T', 'У': 'Y', 'Х': 'X'
}

/**
 * Преобразует кириллические буквы в латинские аналоги по ГОСТу и приводи к верхнему регистру
 */
export function normalizeCarNumber(input: string): string {
  if (!input) return ''
  let cleaned = input.toUpperCase().trim().replace(/\s/g, '')

  for (const [russian, latin] of Object.entries(russianToLatinMap)) {
    cleaned = cleaned.replace(new RegExp(russian, 'g'), latin)
  }

  return cleaned
}

/**
 * Проверяет корректность формата российского автономера
 */
export function validateCarNumber(rawNumber: string): { isValid: boolean; error?: string } {
  if (!rawNumber) {
    return { isValid: false, error: 'Введите номер машины' }
  }

  const normalized = normalizeCarNumber(rawNumber)

  if (normalized.length !== 8 && normalized.length !== 9) {
    return { isValid: false, error: 'Длина номера должна быть 8 или 9 символов (например, M802AO799)' }
  }

  const latinRegex = /^([ABEKMHOPCTXY])(\d{3})([ABEKMHOPCTXY]{2})(\d{2,3})$/i
  const match = normalized.match(latinRegex)

  if (!match) {
    return { isValid: false, error: 'Неверный формат номера. Пример: M802AO799' }
  }

  // Безопасно извлекаем группы (теперь TS знает, что они точно существуют)
  const seriesDigits = match[2]
  const regionDigits = match[4]

  if (!seriesDigits || !regionDigits) {
    return { isValid: false, error: 'Неверный формат номера' }
  }

  if (/^0+$/.test(seriesDigits)) {
    return { isValid: false, error: 'Номер не может состоять из одних нулей' }
  }

  if (/^0+$/.test(regionDigits)) {
    return { isValid: false, error: 'Регион не может состоять из одних нулей' }
  }

  return { isValid: true }
}

/**
 * Склонение часов для человекочитаемого вывода
 */
export function formatHours(hours: number): string {
  const wholeHours = Math.floor(hours)
  if (wholeHours % 10 === 1 && wholeHours % 100 !== 11) return `${wholeHours} час`
  if (wholeHours % 10 >= 2 && wholeHours % 10 <= 4 && (wholeHours % 100 < 10 || wholeHours % 100 >= 20)) {
    return `${wholeHours} часа`
  }
  return `${wholeHours} часов`
}
