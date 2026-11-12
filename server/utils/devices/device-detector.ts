import { callDeviceEndpoint } from '#server/utils/devices/device-api.ts'
import { logger } from '#server/utils/logger.ts'

const log = logger.withTag('utils:device-detector')

export type DeviceVendor = 'beward' | 'dahua' | 'unknown'

export async function detectDeviceVendor(deviceId: number): Promise<DeviceVendor> {
  const storage = useStorage('redis')
  const cacheKey = `device:vendor:${deviceId}`

  const cachedVendor = await storage.getItem<DeviceVendor>(cacheKey)
  if (cachedVendor && cachedVendor !== 'unknown') {
    log.info(`[Detector] Устройство #${deviceId} найдено в кэше Redis как вендор: ${cachedVendor}`)
    return cachedVendor
  }

  log.info(`[Detector] Кэш пуст для устройства #${deviceId}. Запускаем автоопределение (Fingerprint)...`)

  // Пробуем Beward
  try {
    const bewardCheck = await callDeviceEndpoint(deviceId, 'cgi-bin__ping_cgi~action=status')
    log.info(`[Detector] Проба Beward для #${deviceId}: статус ${bewardCheck.status}`)

    // 💡 Безопасно приводим data к строке, чтобы TypeScript не ругался на отсутствие метода includes
    if (bewardCheck.status === 200 && String(bewardCheck.data || '').includes('Status=')) {
      await storage.setItem(cacheKey, 'beward')
      log.info(`[Detector] Устройство #${deviceId} определено как BEWARD`)
      return 'beward'
    }
  } catch (err) {
    log.info(`[Detector] Проба Beward для #${deviceId} завершилась исключением (нормально для Dahua):`, err instanceof Error ? err.message : err)
  }

  // Пробуем Dahua
  try {
    const dahuaCheck = await callDeviceEndpoint(deviceId, 'cgi-bin__magicBox.cgi~action=getSystemInfo')
    log.info(`[Detector] Проба Dahua для #${deviceId}: статус ${dahuaCheck.status}`)

    // 💡 Безопасно приводим data к строке
    if (dahuaCheck.status === 200 && String(dahuaCheck.data || '').includes('deviceType=')) {
      await storage.setItem(cacheKey, 'dahua')
      log.info(`[Detector] Устройство #${deviceId} определено как DAHUA`)
      return 'dahua'
    }
  } catch (err) {
    log.error(`[Detector] Ошибка при пробое Dahua для #${deviceId}:`, err instanceof Error ? err.message : err)
  }

  log.warn(`[Detector] Не удалось автоматически определить вендор для устройства #${deviceId}`)
  return 'unknown'
}
