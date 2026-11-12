import { Queue, Worker, type Job } from 'bullmq'
import { getBullMQConnection, registerQueue, registerWorker } from '~~/server/utils/bullmq'
import { carLogger } from '~~/server/services/car-logger'
import { clientLogger } from '~~/server/services/client-logger'
import { callDeviceEndpoint } from '#server/utils/devices/device-api.ts'
import { removeDahuaPass } from '#server/utils/devices/dahua.driver' // 💡 Импортируем драйвер удаления Dahua

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
  deviceRecordId?: number | string // 💡 Добавили recno для Dahua
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
  deviceRecordId?: number | string // 💡 Добавили recno в Redis-запись
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
    const { recordId, deviceId, addressId, carNumber, userId, comment, deviceRecordId } = job.data
    const normalizedCar = carNumber.toUpperCase()
    const storage = useStorage('redis')
    const redisKey = `pass:${deviceId}:${normalizedCar}`

    // Получаем данные пропуска из Redis
    let passData = await storage.getItem<PassRedisRecord>(redisKey)

    // 💡 ЕСЛИ КЛЮЧ УПАЛ ИЛИ УДАЛЕН ПРИ ПЕРЕЗАГРУЗКЕ СЕРВЕРА:
    if (!passData) {
      log.warn(`⚠️ [Worker] Ключ ${redisKey} не найден в Redis (возможно, из-за рестарта сервера). Выполняем принудительное удаление номера с камеры!`, { recordId, deviceId, carNumber })

      passData = {
        id: `${recordId}_${deviceId}`,
        recordId,
        deviceId,
        addressId: addressId || null,
        userId: userId || undefined,
        carNumber: normalizedCar,
        comment: comment || null,
        expiresAt: new Date().toISOString(),
        status: 'deleting',
        deviceRecordId // Подтягиваем из джоба, если было сохранено
      }
    }

    log.info(`[Worker Status Check] Обработка задачи для ${normalizedCar} на устройстве #${deviceId}. Статус: "${passData.status}"`, { recordId, deviceId })

    // Защита от преждевременного срабатывания после рестарта
    if (passData.expiresAt && passData.status === 'success') {
      const expiresTime = new Date(passData.expiresAt).getTime()
      const now = Date.now()
      if (now < expiresTime) {
        const remainingSec = Math.round((expiresTime - now) / 1000)
        log.info(`[Worker] Пропуск еще активен (осталось ${remainingSec} сек). Пропускаем задачу.`, { redisKey })
        return { success: true, note: 'Pass is still active, ignoring premature job' }
      }
    }

    // СЦЕНАРИЙ 1: Если запись имеет статус 'error'
    if (passData.status === 'error') {
      await storage.removeItem(redisKey)
      log.info(`[Worker] 🧹 Очищен просроченный ошибочный пропуск из Redis для устройства #${deviceId}`, { recordId, deviceId, carNumber: normalizedCar })
      return { success: true, note: 'Expired error pass cleaned from redis without device call' }
    }

    // СЦЕНАРИЙ 2: Переводим в статус deleting (если еще не переведен)
    if (passData.status !== 'deleting') {
      passData.status = 'deleting'
      await storage.setItem(redisKey, passData)
      log.info(`[Worker] Статус ключа ${redisKey} изменен на 'deleting'. Запрос на удаление с камеры...`, { deviceId, carNumber: normalizedCar })
    }

    try {
      // 💡 ОПРЕДЕЛЯЕМ ВЕНДОР УСТРОЙСТВА И ВЫПОЛНЯЕМ УДАЛЕНИЕ
      const vendor = await storage.getItem<string>(`device:vendor:${deviceId}`) || 'beward'

      if (vendor === 'dahua') {
        const recno = passData.deviceRecordId || deviceRecordId
        if (recno !== undefined && recno !== null) {
          const dahuaRes = await removeDahuaPass(deviceId, recno)
          if (!dahuaRes.success) {
            throw new Error(`Ошибка устройства Dahua #${deviceId}: ${dahuaRes.error}`)
          }
        } else {
          log.warn(`⚠️ Для камеры Dahua #${deviceId} не найден recno при истечении TTL, пропускаем физическое удаление`, { carNumber: normalizedCar })
        }
      } else {
        // Стандартное удаление для Beward
        const result = await callDeviceEndpoint(deviceId, 'cgi-bin__lnpr_cgi', {
          method: 'POST',
          body: { action: 'remove', Number: normalizedCar }
        })

        if (result.status !== 200) {
          const errorMsg = String(result.error || '')

          const isAlreadyGone =
            result.status === 404 ||
            errorMsg.includes('not found') ||
            errorMsg.includes('не найден') ||
            errorMsg.includes('Param error')

          if (isAlreadyGone) {
            await storage.removeItem(redisKey)
            log.warn(`⚠️ Номер ${normalizedCar} на устройстве #${deviceId} уже отсутствовал на камере или вызвал Param error. Очистка выполнена.`, { deviceId, carNumber: normalizedCar })
            return { success: true, note: 'Pass was already missing or invalid on device' }
          }

          throw new Error(`Ошибка устройства #${deviceId} (статус ${result.status}): ${errorMsg}`)
        }
      }

      // Успешно удалено с камеры — стираем остатки из Redis
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

registerWorker(numberWorker)
