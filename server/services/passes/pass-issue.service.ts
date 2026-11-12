import { passRepository, type PassRedisRecord } from '#server/repositories/redis/pass.repository'
import { callDeviceEndpoint } from '#server/utils/devices/device-api'
import { addDahuaPass } from '#server/utils/devices/dahua.driver' // 💡 Импортируем драйвер Dahua
import { numberQueue } from '#server/queues/number.queue'
import { carLogger } from '#server/services/car-logger'
import { clientLogger } from '#server/services/client-logger'
import { deviceRepository } from '#server/repositories/prisma/device.repository'

export interface IssuePassInput {
  carNumber: string
  totalHours: number
  comment?: string | null
  deviceIds: number[]
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

export const passIssueService = {
  /** Пакетное добавление госномера на выбранные устройства (камеры/шлагбаумы) */
  async issuePasses(userId: number, input: IssuePassInput) {
    const { carNumber, totalHours, comment, deviceIds } = input

    const recordId = Date.now()
    const delayMs = totalHours * 3600 * 1000 // Исправлен расчет миллисекунд
    const normalizedNumber = carNumber.toUpperCase()
    const normalizedComment = comment ? String(comment) : undefined
    const expiresAt = new Date(Date.now() + delayMs).toISOString()

    // 1. Параллельно забираем конфигурации устройств через репозиторий
    const deviceConfigs = await Promise.all(
      deviceIds.map(async (deviceId) => {
        const cfg = await deviceRepository.findById(deviceId)
        return { deviceId, addressId: cfg?.address?.address_id ? Number(cfg.address.address_id) : null }
      })
    )

    const deviceResults: { deviceId: number; addressId?: number | null; status: string; message?: string }[] = []
    const validDeviceIds: number[] = []
    const deviceIdToConfig = new Map()

    // 2. Проверка на дубликаты через наш passRepository
    for (let i = 0; i < deviceIds.length; i++) {
      const deviceId = deviceIds[i]
      if (deviceId === undefined) continue

      const config = deviceConfigs[i]
      const addressId = config?.addressId ?? null

      deviceIdToConfig.set(deviceId, { addressId })

      const existingPass = await passRepository.getPass(deviceId, normalizedNumber)

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

    // 3. Отправка запросов на физические устройства с учетом вендора (Beward / Dahua)
    const results = await Promise.allSettled(
      validDeviceIds.map(async (deviceId) => {
        const storage = useStorage('redis')
        // Достаем вендор из кэша (или считаем бевардом по умолчанию)
        const vendor = await storage.getItem<string>(`device:vendor:${deviceId}`) || 'beward'

        if (vendor === 'dahua') {
          // Форматируем даты для Dahua
          const beginTimeStr = new Date().toISOString().replace('T', ' ').substring(0, 19)
          const cancelTimeStr = new Date(Date.now() + delayMs).toISOString().replace('T', ' ').substring(0, 19)

          const dahuaRes = await addDahuaPass(deviceId, normalizedNumber, beginTimeStr, cancelTimeStr, normalizedComment || 'system')

          if (!dahuaRes.success) {
            throw new Error(dahuaRes.error || `Ошибка устройства Dahua #${deviceId}`)
          }

          // Возвращаем успех и recno для сохранения в Redis
          return { success: true, recno: dahuaRes.recno }
        } else {
          // Стандартный метод для Beward
          const res = await callDeviceEndpoint(deviceId, 'cgi-bin__lnpr_cgi', {
            method: 'POST',
            body: {
              action: 'add',
              Number: normalizedNumber,
              Note: normalizedComment || ''
            }
          })

          if (res.status !== 200) {
            throw new Error(res.error || `Ошибка устройства #${deviceId}: статус ${res.status}`)
          }

          return { success: true }
        }
      })
    )

    let hasSuccess = false

    // 4. Обработка результатов, сохранение в Redis и постановка в очередь
    results.forEach((result, index) => {
      const deviceId = validDeviceIds[index]
      if (!deviceId) return

      const configEntry = deviceIdToConfig.get(deviceId)
      if (!configEntry) return

      const { addressId } = configEntry
      const passId = `${recordId}_${deviceId}`

      const isFulfilled = result.status === 'fulfilled'
      if (isFulfilled) hasSuccess = true

      // Достаем recno, если камера вернула его (актуально для Dahua)
      const value = isFulfilled ? (result.value as { success: boolean; recno?: number | string }) : undefined
      const deviceRecordId = value?.recno

      const rawError = !isFulfilled
        ? (result.reason instanceof Error ? result.reason.message : String(result.reason))
        : undefined

      const clientErrorMessage = rawError ? getCleanErrorMessage(rawError) : undefined

      const passData: PassRedisRecord & { deviceRecordId?: number | string } = {
        id: passId,
        recordId,
        deviceId,
        addressId,
        userId,
        carNumber: normalizedNumber,
        comment: normalizedComment,
        expiresAt,
        status: isFulfilled ? 'success' : 'error',
        ...(deviceRecordId ? { deviceRecordId } : {}), // 💡 Сохраняем recno для последующего удаления с Dahua
        ...(clientErrorMessage ? { errorMessage: clientErrorMessage } : {})
      }

      // Сохраняем в Redis через репозиторий пропусков
      passRepository.savePass(deviceId, normalizedNumber, passData as PassRedisRecord)

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

        // Ставим задачу на TTL в очередь (BullMQ) — передаем deviceRecordId в джоб, если понадобится при удалении
        numberQueue.add(
          'expire-pass',
          {
            recordId: passId,
            deviceId,
            addressId,
            carNumber: normalizedNumber,
            userId,
            comment: normalizedComment,
            deviceRecordId // 💡 Передаем в воркер удаления
          },
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
  }
}
