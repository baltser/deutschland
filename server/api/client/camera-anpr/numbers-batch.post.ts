import { numberQueue } from '~~/server/queues/number.queue'
import { carLogger } from '~~/server/services/car-logger'
import { clientLogger } from '~~/server/services/client-logger'
import { callDeviceEndpoint } from '~~/server/utils/device-api'
import { getDeviceConfig } from '~~/server/utils/db/device-config'

interface BatchRequestBody {
  carNumber: string
  totalHours: number
  comment?: string | null
  deviceIds: number[]
}

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

// Хелпер для преобразования системных ошибок в чистый человеко-читаемый текст для истории клиента
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
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const userId = Number(session.user.user_id)
  const body = await readBody<BatchRequestBody>(event)
  const { carNumber, totalHours, comment, deviceIds } = body

  if (!deviceIds || !Array.isArray(deviceIds) || deviceIds.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Не выбраны устройства' })
  }

  const recordId = Date.now()
  // Корректный расчет задержки: часы переводим в миллисекунды
  const delayMs = totalHours * 60 * 60 * 1000

  const normalizedNumber = carNumber.toUpperCase()
  const normalizedComment = comment ? String(comment) : undefined
  const expiresAt = new Date(Date.now() + delayMs).toISOString()

  const storage = useStorage('redis')

  const deviceConfigs = await Promise.all(
    deviceIds.map(async (deviceId) => {
      const cfg = await getDeviceConfig(deviceId).catch(() => null)
      return { deviceId, addressId: cfg?.addressId ? Number(cfg.addressId) : null }
    })
  )

  const deviceResults: { deviceId: number; addressId?: number | null; status: string; message?: string }[] = []
  const validDeviceIds: number[] = []
  const deviceIdToConfig = new Map()

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

    // Чистый текст ошибки для клиента и истории
    const clientErrorMessage = rawError ? getCleanErrorMessage(rawError) : undefined

    const passData = {
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
    } else {
      // Технический лог хранит полный стек ошибки для разработчика
      carLogger.error(`Не удалось добавить номер на устройство #${deviceId}:`, new Error(rawError), {
        recordId,
        deviceId,
        carNumber: normalizedNumber
      })

      // В чистую историю клиента записываем понятный человеко-читаемый текст (без лишних полей)
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

    numberQueue.add(
      'expire-pass',
      { recordId: passId, deviceId, addressId, carNumber: normalizedNumber, userId, comment: normalizedComment },
      { delay: delayMs, jobId: passId }
    ).catch((err: unknown) => {
      carLogger.error(`Не удалось поставить задачу TTL в очередь для устройства #${deviceId}:`, err instanceof Error ? err : String(err))
    })
  })

  return {
    success: hasSuccess,
    recordId,
    deviceResults,
    message: hasSuccess ? 'Пропуск обработан.' : 'Не удалось добавить пропуск ни на одно устройство.'
  }
})
