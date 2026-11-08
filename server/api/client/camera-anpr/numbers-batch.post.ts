import { z } from 'zod'
import { numberQueue } from '#server/queues/number.queue'
import { carLogger } from '#server/services/car-logger'
import { clientLogger } from '#server/services/client-logger'
import { callDeviceEndpoint } from '#server/utils/device-api'
import { getDeviceConfig } from '#server/utils/db/device-config'

// 1. Строгая Zod-схема валидации входящих данных
const batchBodySchema = z.object({
  carNumber: z.string().min(1, 'Госномер обязателен'),
  totalHours: z.number().positive('Количество часов должно быть больше 0'),
  comment: z.string().optional().nullable(),
  deviceIds: z.array(z.number()).min(1, 'Не выбраны устройства')
})

interface PassRedisRecord {
  id: string
  recordId: number
  deviceId: number
  addressId: number | null
  userId: number
  carNumber: string
  comment?: string | null
  expiresAt: string
  status: string
  errorMessage?: string
}

// Хелпер для преобразования системных ошибок в чистый текст для клиента
const getCleanErrorMessage = (rawError: string): string => {
  if (rawError.includes('401') || rawError.includes('Unauthorized')) {
    return 'Ошибка авторизации на устройстве'
  }
  if (rawError.includes('404') || rawError.includes('not found')) {
    return 'Устройство не найдено или недоступно'
  }
  if (rawError.includes('ETIMEDOUT') || rawError.includes('timeout') || rawError.includes('ECONNREFUSED')) {
    return 'Превышено время ожидания ответа от устройства'
  }
  return 'Ошибка связи с устройством'
}

export default defineEventHandler(async (event) => {
  // 1. Пользователь уже гарантированно есть благодаря нашему middleware
  const user = event.context.user
  const userId = Number(user.user_id)

  // 2. Нативная валидация тела через Zod (Nitro выбросит 400 при несоответствии)
  const body = await readValidatedBody(event, batchBodySchema.parse)
  const { carNumber, totalHours, comment, deviceIds } = body

  const recordId = Date.now()
  const delayMs = totalHours * 3600 * 1000 // Исправленный расчет задержки в мс
  const normalizedNumber = carNumber.toUpperCase()
  const normalizedComment = comment ? String(comment) : undefined
  const expiresAt = new Date(Date.now() + delayMs).toISOString()

  const storage = useStorage('redis')

  // 3. Параллельно забираем конфигурации устройств
  const deviceConfigs = await Promise.all(
    deviceIds.map(async (deviceId) => {
      const cfg = await getDeviceConfig(deviceId).catch(() => null)
      return { deviceId, addressId: cfg?.addressId ? Number(cfg.addressId) : null }
    })
  )

  const deviceResults: { deviceId: number; addressId?: number | null; status: string; message?: string }[] = []
  const validDeviceIds: number[] = []
  const deviceIdToConfig = new Map()

  // 4. Проверка на дубликаты в Redis
  for (let i = 0; i < deviceIds.length; i++) {
    const deviceId = deviceIds[i]
    if (deviceId === undefined) continue

    const config = deviceConfigs[i]
    const addressId = config?.addressId ?? null
    const redisKey = `pass:${deviceId}:${normalizedNumber}`

    deviceIdToConfig.set(deviceId, { addressId, redisKey })

    const existingPass = await storage.getItem<PassRedisRecord>(redisKey)

    if (existingPass && existingPass.status === 'success') {
      const errMsg = 'Этот госномер уже активен на данном устройстве'
      carLogger.warn(`⚠️ Попытка добавить уже существующий номер ${normalizedNumber} на устройство #${deviceId}`, {
        action: 'duplicate',
        recordId,
        userId,
        deviceId,
        addressId,
        carNumber: normalizedNumber
      })
      deviceResults.push({ deviceId, addressId, status: 'error', message: errMsg })
    } else {
      validDeviceIds.push(deviceId)
    }
  }

  if (validDeviceIds.length === 0) {
    return {
      success: false,
      recordId,
      deviceResults,
      message: `Госномер ${normalizedNumber} уже добавлен на все выбранные устройства.`
    }
  }

  // 5. Отправка запросов на устройства
  const results = await Promise.allSettled(
    validDeviceIds.map(async (deviceId) => {
      const res = await callDeviceEndpoint(deviceId, 'cgi-bin__lnpr_cgi', {
        method: 'POST',
        body: {
          action: 'add',
          carNumber: normalizedNumber,
          comment: normalizedComment,
          totalHours
        }
      })

      if (res.status !== 200) {
        throw new Error(res.error || `Ошибка устройства #${deviceId}: статус ${res.status}`)
      }

      return true
    })
  )

  let hasSuccess = false

  // 6. Обработка результатов сетевых запросов, сохранение в Redis и постановка в очередь
  results.forEach((result, index) => {
    const deviceId = validDeviceIds[index]
    if (!deviceId) return

    const configEntry = deviceIdToConfig.get(deviceId)
    if (!configEntry) return

    const { addressId, redisKey } = configEntry
    const passId = `${recordId}_${deviceId}`

    const isFulfilled = result.status === 'fulfilled'
    if (isFulfilled) hasSuccess = true

    const rawError = !isFulfilled
      ? (result.reason instanceof Error ? result.reason.message : String(result.reason))
      : undefined

    const clientErrorMessage = rawError ? getCleanErrorMessage(rawError) : undefined

    const passData: PassRedisRecord = {
      id: passId,
      recordId,
      deviceId,
      addressId,
      userId,
      carNumber: normalizedNumber,
      comment: normalizedComment,
      expiresAt,
      status: isFulfilled ? 'success' : 'error',
      ...(clientErrorMessage ? { errorMessage: clientErrorMessage } : {})
    }

    storage.setItem(redisKey, passData)

    if (isFulfilled) {
      carLogger.audit('add', 'Номер успешно добавлен на устройство и сохранен в Redis', {
        action: 'add',
        recordId,
        deviceId,
        addressId,
        userId,
        carNumber: normalizedNumber,
        hours: totalHours
      })

      deviceResults.push({ deviceId, addressId, status: 'success' })

      // Ставим задачу на TTL в очередь (только при успехе)
      numberQueue.add(
        'expire-pass',
        { recordId: passId, deviceId, addressId, carNumber: normalizedNumber, userId, comment: normalizedComment },
        { delay: delayMs, jobId: passId }
      ).catch((err: unknown) => {
        carLogger.error(`Не удалось поставить задачу TTL в очередь для устройства #${deviceId}:`, err instanceof Error ? err : String(err))
      })

    } else {
      carLogger.error(`Не удалось добавить номер на устройство #${deviceId}:`, new Error(rawError), {
        recordId,
        deviceId,
        carNumber: normalizedNumber
      })

      clientLogger.logEvent({
        userId,
        carNumber: normalizedNumber,
        deviceId,
        addressId,
        action: 'error',
        status: 'error',
        label: 'Ошибка связи',
        comment: normalizedComment,
        recordId: passId,
        error: clientErrorMessage
      })

      deviceResults.push({ deviceId, addressId, status: 'error', message: clientErrorMessage })
    }
  })

  return {
    success: hasSuccess,
    recordId,
    deviceResults,
    message: hasSuccess ? 'Пропуск обработан.' : 'Не удалось добавить пропуск ни на одно устройство.'
  }
})
