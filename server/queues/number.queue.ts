// server/queues/number.queue.ts
import { Queue, Worker, type Job } from 'bullmq'
import { getBullMQConnection, registerQueue, registerWorker } from '~~/server/utils/bullmq'
import { carLogger } from '~~/server/services/car-logger'
import { clientLogger } from '~~/server/services/client-logger'
import { callDeviceEndpoint } from '~~/server/utils/device-api'

const log = carLogger.withTag('queue:number')
const connection = getBullMQConnection()

export interface NumberJobData {
  recordId: string | number
  deviceId: number
  addressId?: number | null
  carNumber: string
  userId?: number | string
  comment?: string
  longRetryCount?: number
}

// Строгий интерфейс данных пропуска в Redis
export interface PassRedisRecord {
  id: string | number
  recordId?: number | string
  deviceId: number
  addressId?: number | null
  userId?: number | string
  carNumber: string
  comment?: string | null
  expiresAt: string
  status: string
  errorMessage?: string
}

export const numberQueue = new Queue<NumberJobData>('number-queue', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 10000 },
    removeOnComplete: true,
    removeOnFail: false,
  }
})
registerQueue(numberQueue)

export const numberWorker = new Worker<NumberJobData>(
  'number-queue',
  async (job: Job<NumberJobData>) => {
    const { recordId, deviceId, addressId, carNumber, userId, comment } = job.data
    const normalizedCar = carNumber.toUpperCase()
    const storage = useStorage('redis')
    const redisKey = `pass:${deviceId}:${normalizedCar}`

    // Используем строгий интерфейс вместо any
    const passData = await storage.getItem<PassRedisRecord>(redisKey)

    if (!passData) {
      log.info(`[Worker Status Check] Ключ ${redisKey} уже отсутствует в Redis. Задача пропущена.`, { recordId, deviceId, carNumber })
      return { success: true, note: 'Pass already removed from Redis' }
    }

    log.info(`[Worker Status Check] Обработка задачи для ${normalizedCar} на устройстве #${deviceId}. Текущий статус в Redis: "${passData.status}"`, { recordId, deviceId })

    // Защита от преждевременного срабатывания после рестарта
    if (passData.expiresAt && passData.status === 'success') {
      const expiresTime = new Date(passData.expiresAt).getTime()
      const now = Date.now()
      if (now < expiresTime) {
        log.info(`[Worker] Пропуск еще активен (осталось ${Math.round((expiresTime - now) / 1000)} сек). Пропускаем задачу.`, { redisKey })
        return { success: true, note: 'Pass is still active, ignoring premature job' }
      }
    }

    // СЦЕНАРИЙ 1: Если запись имеет статус 'error' (при создании произошел сбой связи)
    if (passData.status === 'error') {
      await storage.removeItem(redisKey)
      log.info(`[Worker] 🧹 Очищен просроченный ошибочный пропуск из Redis для устройства #${deviceId} (номер ${normalizedCar} не был добавлен на камеру)`, { recordId, deviceId, carNumber: normalizedCar })
      return { success: true, note: 'Expired error pass cleaned from redis without device call' }
    }

    // СЦЕНАРИЙ 2: Пропуск был успешным, наступило время удаления (TTL).
    if (passData.status !== 'deleting') {
      passData.status = 'deleting'
      await storage.setItem(redisKey, passData)
      log.info(`[Worker] Статус ключа ${redisKey} изменен на 'deleting'. Запрос на удаление с камеры...`, { deviceId, carNumber: normalizedCar })
    }

    try {
      const result = await callDeviceEndpoint(deviceId, 'cgi-bin__lnpr_cgi', {
        method: 'POST',
        body: { action: 'remove', carNumber: normalizedCar }
      })

      if (result.status !== 200) {
        const errorMsg = String(result.error || '')
        const isAlreadyGone = result.status === 404 || errorMsg.includes('not found') || errorMsg.includes('не найден')

        if (isAlreadyGone) {
          await storage.removeItem(redisKey)
          log.warn(`⚠️ Номер ${normalizedCar} на устройстве #${deviceId} уже отсутствовал на камере при удалении. Очистка Redis выполнена.`, { deviceId, carNumber: normalizedCar })

          if (userId) {
            clientLogger.logEvent({
              userId,
              carNumber: normalizedCar,
              deviceId,
              addressId: addressId || null,
              action: 'expire',
              status: 'expire',
              label: 'Истек срок',
              comment: comment || passData.comment || null,
              recordId
            })
          }

          return { success: true, note: 'Pass was already missing on device' }
        }

        throw new Error(`Ошибка устройства #${deviceId} (статус ${result.status}): ${errorMsg}`)
      }

      // Успешно удалено с камеры — стираем из Redis
      await storage.removeItem(redisKey)

      carLogger.audit('expire', 'Номер успешно удален с камеры и стерт из Redis', {
        action: 'expire',
        recordId,
        deviceId,
        addressId: addressId || null,
        carNumber: normalizedCar,
        userId,
        comment: comment || null
      })

      if (userId) {
        clientLogger.logEvent({
          userId,
          carNumber: normalizedCar,
          deviceId,
          addressId: addressId || null,
          action: 'expire',
          status: 'expire',
          label: 'Истек срок',
          comment: comment || passData.comment || null,
          recordId
        })
      }
      log.info(`[Worker] Успешно удалено: ${normalizedCar} с устройства #${deviceId}`, { recordId })
      return { success: true }

    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err))
      log.error(`[Worker Error] Не удалось удалить номер ${normalizedCar} с устройства #${deviceId}:`, error)
      throw error
    }
  },
  { connection }
)

// Долгосрочный фоновый брокер для неудачных попыток удаления
numberWorker.on('failed', async (job: Job<NumberJobData> | undefined, err: Error) => {
  if (!job) return

  const maxLongRetries = 48 // Повторять в течение 12 часов (каждые 15 минут)
  const currentRetry = job.data.longRetryCount || 0 // Безопасный доступ без any

  if (currentRetry < maxLongRetries) {
    const nextDelay = 15 * 60 * 1000 // 15 минут в миллисекундах

    log.warn(`[Persistent Broker] Устройство недоступно. Откладываем повторное удаление номера ${job.data.carNumber} (попытка ${currentRetry + 1}/${maxLongRetries}) через 15 мин. Ошибка: ${err.message}`)

    await numberQueue.add(
      'expire-pass-retry',
      {
        ...job.data,
        longRetryCount: currentRetry + 1
      },
      {
        delay: nextDelay,
        jobId: `${job.data.recordId}_retry_${currentRetry + 1}`
      }
    ).catch((e: unknown) => log.error('Не удалось перепланировать задачу настойчивого удаления:', e as Error))
  } else {
    log.error(`[Persistent Broker 🚨] Исчерпаны все попытки удаления номера ${job.data.carNumber} с устройства #${job.data.deviceId}. Требуется ручная проверка!`, err)
  }
})

registerWorker(numberWorker)
