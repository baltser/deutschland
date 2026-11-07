// server/api/client/camera-anpr/[id]/number.delete.ts
import { callDeviceEndpoint } from '~~/server/utils/device-api'
import { carLogger } from '~~/server/services/car-logger'
import { clientLogger } from '~~/server/services/client-logger'

interface PassRedisRecord {
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

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, message: 'Необходима авторизация' })
  }

  const rawId = getRouterParam(event, 'id')
  if (!rawId) {
    throw createError({ statusCode: 400, message: 'Некорректный ID пропуска' })
  }

  const storage = useStorage('redis')

  const keys = await storage.getKeys('pass:')
  let targetKey: string | null = null
  let passData: PassRedisRecord | null = null // Явно разрешаем null для предотвращения TS2454

  for (const key of keys) {
    const data = await storage.getItem<PassRedisRecord>(key)
    if (data && (String(data.id) === String(rawId) || key === rawId)) {
      targetKey = key
      passData = data
      break
    }
  }

  if (!targetKey || !passData) {
    throw createError({ statusCode: 404, message: 'Пропуск не найден в активных' })
  }

  const currentUserId = Number(session.user.user_id)
  const isAdmin = session.user.role_name === 'admin'

  if (!isAdmin && Number(passData.userId) !== currentUserId) {
    throw createError({ statusCode: 403, message: 'У вас нет прав на удаление этого пропуска' })
  }

  carLogger.audit('delete', `Пользователь отзывает пропуск`, {
    action: 'delete',
    userId: currentUserId,
    addressId: passData.addressId,
    recordId: passData.recordId ? Number(String(passData.recordId).split('_')[0]) : null,
    deviceId: passData.deviceId,
    carNumber: passData.carNumber,
    comment: passData.comment || null
  })

  try {
    if (passData.status === 'error') {
      await storage.removeItem(targetKey)

      carLogger.audit('delete', `Ошибка-пропуск успешно очищена из Redis без запроса на камеру`, {
        action: 'delete',
        userId: currentUserId,
        deviceId: passData.deviceId,
        carNumber: passData.carNumber
      })

      clientLogger.logEvent({
        userId: currentUserId,
        carNumber: passData.carNumber,
        deviceId: passData.deviceId,
        addressId: passData.addressId,
        action: 'delete',
        status: 'delete',
        label: 'Отозван пользователем',
        comment: passData.comment || null,
        recordId: passData.recordId
      })

      return {
        success: true,
        message: 'Запись с ошибкой успешно удалена'
      }
    }

    const result = await callDeviceEndpoint(passData.deviceId, 'cgi-bin__lnpr_cgi', {
      method: 'POST',
      body: {
        action: 'remove',
        carNumber: passData.carNumber
      }
    })

    if (result.status !== 200) {
      carLogger.warn(`⚠️ Устройство ответило ошибкой при удалении, но стираем из Redis: ${result.error}`, {
        deviceId: passData.deviceId,
        carNumber: passData.carNumber
      })
    }

    await storage.removeItem(targetKey)

    carLogger.audit('delete', `Пропуск успешно отозван пользователем`, {
      action: 'delete',
      userId: currentUserId,
      addressId: passData.addressId,
      recordId: passData.recordId ? Number(String(passData.recordId).split('_')[0]) : null,
      deviceId: passData.deviceId,
      carNumber: passData.carNumber,
      comment: passData.comment || null
    })

    clientLogger.logEvent({
      userId: currentUserId,
      carNumber: passData.carNumber,
      deviceId: passData.deviceId,
      addressId: passData.addressId,
      action: 'delete',
      status: 'delete',
      label: 'Отозван пользователем',
      comment: passData.comment || null,
      recordId: passData.recordId
    })

    return {
      success: true,
      message: 'Пропуск успешно отозван'
    }

  } catch (error: unknown) {
    const err = error as Error
    carLogger.error(`[API Error] Ошибка при отзыве пропуска:`, err)
    if (targetKey) {
      await storage.removeItem(targetKey)
    }

    return {
      success: true,
      message: 'Пропуск удален из системы'
    }
  }
})
