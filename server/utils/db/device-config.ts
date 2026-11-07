import { PrismaClient } from '@prisma/client'

// Инициализация Prisma (если в проекте уже есть глобальный хелпер, можно использовать его)
const prisma = new PrismaClient()

export interface DeviceConfig {
  deviceId: number
  deviceName: string
  ip: string
  port: number
  login?: string | null
  password?: string | null
  addressId: number
}

/**
 * Получает конфигурацию устройства (IP, порт, креды) из базы данных по его ID
 */
export async function getDeviceConfig(deviceId: number): Promise<DeviceConfig | null> {
  try {
    const device = await prisma.devices.findUnique({
      where: { device_id: deviceId },
      select: {
        device_id: true,
        device_name: true,
        ip: true,
        port: true,
        login: true,
        password: true,
        address_id: true
      }
    })

    if (!device || !device.ip || !device.port) {
      return null
    }

    return {
      deviceId: device.device_id,
      deviceName: device.device_name,
      ip: device.ip,
      port: device.port,
      login: device.login,
      password: device.password,
      addressId: device.address_id
    }
  } catch (error) {
    console.error(`[DB Error] Не удалось загрузить конфигурацию устройства #${deviceId}:`, error)
    return null
  }
}
