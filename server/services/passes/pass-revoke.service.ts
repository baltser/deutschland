import { passRepository, type PassRedisRecord } from '#server/repositories/redis/pass.repository'
import { callDeviceEndpoint } from '#server/utils/devices/device-api'
import { removeDahuaPass } from '#server/utils/devices/dahua.driver'
import { carLogger } from '#server/services/car-logger'
import { clientLogger } from '#server/services/client-logger'

export const passRevokeService = {
  /** Отзыв/удаление пропуска пользователем или администратором */

  async revokePass(rawId: string, currentUserId: number, isAdmin: boolean) {
    // 1. Ищем пропуск среди активных в Redis через наш репозиторий
    const activePasses = await passRepository.getAllActivePasses()

    let targetKey: string | null = null
    let passData: (PassRedisRecord & { deviceRecordId?: number | string }) | null = null

    for (const item of activePasses) {
      if (String(item.data.id) === String(rawId) || item.key === rawId) {
        targetKey = item.key
        passData = item.data as PassRedisRecord & { deviceRecordId?: number | string }
        break
      }
    }

    if (!targetKey || !passData) {
      throw createError({ statusCode: 404, message: 'Пропуск не найден в активных' })
    }

    // 🔒 2. Проверка прав: клиент может удалить только свой пропуск, админ — любой
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
      // Если запись изначально была с ошибкой — просто стираем из Redis без запроса на камеру
      if (passData.status === 'error') {
        await passRepository.removeByKey(targetKey)

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

        return { success: true, message: 'Запись с ошибкой успешно удалена' }
      }

      // 3. Определяем вендора устройства через Redis-кэш
      const storage = useStorage('redis')
      const vendor = await storage.getItem<string>(`device:vendor:${passData.deviceId}`) || 'beward'

      if (vendor === 'dahua') {
        // Для Dahua удаляем по сохраненному recno (deviceRecordId)
        const recno = passData.deviceRecordId
        if (recno !== undefined && recno !== null) {
          const dahuaRes = await removeDahuaPass(passData.deviceId, recno)
          if (!dahuaRes.success) {
            carLogger.warn(`⚠️ Устройство Dahua ответило ошибкой при удалении, но стираем из Redis: ${dahuaRes.error}`, {
              deviceId: passData.deviceId,
              carNumber: passData.carNumber
            })
          }
        } else {
          carLogger.warn(`⚠️ Для камеры Dahua #${passData.deviceId} не найден recno в Redis, пропускаем физическое удаление`, {
            carNumber: passData.carNumber
          })
        }
      } else {
        // Стандартный метод удаления для Beward
        const result = await callDeviceEndpoint(passData.deviceId, 'cgi-bin__lnpr_cgi', {
          method: 'POST',
          body: {
            action: 'remove',
            Number: passData.carNumber
          }
        })

        if (result.status !== 200) {
          carLogger.warn(`⚠️ Устройство ответило ошибкой при удалении, но стираем из Redis: ${result.error}`, {
            deviceId: passData.deviceId,
            carNumber: passData.carNumber
          })
        }
      }

      // 4. Удаляем из Redis через репозиторий
      await passRepository.removeByKey(targetKey)

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

      return { success: true, message: 'Пропуск успешно отозван' }

    } catch (error: unknown) {
      const err = error as Error
      carLogger.error(`[API Error] Ошибка при отзыве пропуска:`, err)
      if (targetKey) {
        await passRepository.removeByKey(targetKey)
      }

      return { success: true, message: 'Пропуск удален из системы' }
    }
  }
}
