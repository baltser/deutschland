import * as XLSX from 'xlsx'
import {getCleanPhone} from '~/utils/phone'
import {getErrorMessage} from '~/types/error'

export interface ParsedClient {
  key: string
  name: string
  phone: string
}

export const useUploadFile = () => {
  const uploading = ref(false)
  const error = ref<string | null>(null)
  const parsedClients = ref<ParsedClient[]>([])

  // Регулярное выражение для поиска автомобильных номеров РФ (например: А437ВО13, К673РН799, У163АН250)
  const CAR_NUMBER_REGEX = /[АВЕКМНОРСТУХA-Z]\d{3}[АВЕКМНОРСТУХA-Z]{1,2}\d{2,3}/gi

  // Функция глубокой очистки имени от госномеров и служебного мусора
  const cleanClientName = (text: string): string => {
    if (!text) return ''

    const cleaned = text
      // Удаляем автономера
      .replace(CAR_NUMBER_REGEX, '')
      // Удаляем приписки вроде "нет в базе", "нет авто"
      .replace(/нет\s+(авто\s+)?в\s+базе/gi, '')
      // Удаляем даты типа "до 20-31" или "до 12.05"
      .replace(/до\s+\d{2}[-./]\d{2}/gi, '')
      // Очищаем лишнюю пунктуацию и пробелы по краям
      .replace(/[,.\s-]+$/, '')
      .replace(/^[,.\s-]+/, '')
      .replace(/\s+/g, ' ')
      .trim()

    if (cleaned.length < 2) return ''
    return cleaned
  }

  const parseFile = async (file: File) => {
    let rows: unknown[][]

    // 1. Чтение файла в зависимости от формата
    if (file.name.endsWith('.txt') || file.name.endsWith('.csv')) {
      const text = await file.text()
      rows = text.split('\n').map(line => line.split(/[\t,;]/).map(cell => cell.trim()))
    } else if (file.name.endsWith('.xls') || file.name.endsWith('.xlsx')) {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data, { type: 'array' })
      const firstSheetName = workbook.SheetNames?.[0]
      if (!firstSheetName) throw new Error('Не удалось найти лист в Excel-файле')
      const sheet = workbook.Sheets[firstSheetName]
      if (!sheet) throw new Error('Не удалось получить данные из листа')
      rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as unknown[][]
    } else {
      throw new Error('Неподдерживаемый формат файла (.txt, .csv, .xls, .xlsx)')
    }

    if (!rows || rows.length === 0) throw new Error('Файл пуст')

    // Определяем наличие заголовка (пропускаем первую строку, если там есть слово "Абонент")
    const firstRow = rows[0]
    const hasHeader = firstRow?.some(cell =>
      typeof cell === 'string' && cell.toLowerCase().includes('абонент')
    )
    const dataRows = hasHeader ? rows.slice(1) : rows

    const clientMap = new Map<string, ParsedClient>()

    // 2. Построчный обход данных
    for (const row of dataRows) {
      if (!row || !Array.isArray(row)) continue

      const abonentCol = String(row[0] ?? '').trim()
      const typeCol = String(row[1] ?? '').trim()
      const identifierCol = String(row[2] ?? '').trim()
      const noteCol = String(row[4] ?? '').trim() // Примечание абонента

      // Нам нужны только строки с типом 1 (телефоны)
      if (typeCol !== '1') continue

      // Очищаем и проверяем телефон
      const phone = getCleanPhone(identifierCol)
      if (!phone || phone.length !== 11) continue

      // Определяем имя:
      // Сначала проверяем колонку "Примечание абонента" (если там записано ФИО с машиной)
      let rawName = ''
      if (noteCol && isNaN(Number(noteCol))) {
        rawName = noteCol
      } else if (abonentCol && isNaN(Number(abonentCol))) {
        // Иначе берем из колонки "Абонент"
        rawName = abonentCol
      }

      const cleanName = cleanClientName(rawName)

      // Сохраняем в карту с ключом по телефону (защита от дубликатов в файле)
      clientMap.set(phone, {
        key: phone,
        name: cleanName || 'Без имени',
        phone: phone
      })
    }

    if (clientMap.size === 0) {
      throw new Error('Не удалось найти строки с номерами телефонов (тип 1) в файле')
    }

    parsedClients.value = Array.from(clientMap.values())
    return parsedClients.value
  }

  const upload = async (file: File) => {
    uploading.value = true
    error.value = null
    parsedClients.value = []

    try {
      await parseFile(file)
      return parsedClients.value
    } catch (e: unknown) {
      error.value = getErrorMessage ? getErrorMessage(e, 'Ошибка при чтении файла') : (e as Error)?.message || 'Ошибка при чтении файла'
      throw e
    } finally {
      uploading.value = false
    }
  }

  const reset = () => {
    parsedClients.value = []
    error.value = null
  }

  return {
    uploading,
    error,
    parsedClients,
    upload,
    reset
  }
}
