import { addressRepository } from '#server/repositories/prisma/address.repository'
import { deviceRepository } from '#server/repositories/prisma/device.repository'
import { callDeviceEndpoint } from '#server/utils/devices/device-api.ts'
import { logger } from '#server/utils/logger'
import type { DeviceType } from '@prisma/client'
import {detectDeviceVendor} from "#server/utils/devices/device-detector.ts";

const log = logger.withTag('services:device')

export const deviceService = {
  /** Создание нового устройства (камеры/панели) для указанного адреса */

  async createDeviceForAddress(
    addressId: number,
    actorUserId: number,
    data: {
      device_name: string
      device_type?: string
      ip?: string | null
      port?: number | null
      login?: string | null
      password?: string | null
    }
  ) {
    if (!data.device_name || !data.device_name.trim()) {
      throw createError({
        statusCode: 400,
        message: 'Укажите название устройства',
      })
    }

    // Проверяем существование адреса через репозиторий
    const address = await addressRepository.findById(addressId)
    if (!address) {
      throw createError({
        statusCode: 404,
        message: 'Адрес не найден',
      })
    }

    try {
      const newDevice = await deviceRepository.create({
        device_name: data.device_name.trim(),
        device_type: (data.device_type as DeviceType) || 'CAMERA',
        ip: data.ip ? data.ip.trim() : null,
        port: data.port ? Number(data.port) : null,
        login: data.login ? data.login.trim() : null,
        password: data.password ? data.password.trim() : null,
        address: {
          connect: { address_id: addressId }
        }
      })

      log.success(`Пользователь #${actorUserId} создал устройство "${newDevice.device_name}" для адреса #${addressId}`)
      return newDevice
    } catch (err: unknown) {
      log.error(`Ошибка при создании устройства для адреса #${addressId}:`, err)
      throw createError({
        statusCode: 500,
        message: 'Не удалось сохранить устройство в базу данных',
      })
    }
  },

  /** Пинг физического устройства (камеры/панели) через драйвер */

  async pingDevice(deviceId: number) {
    // 1. Автоматически определяем вендора (через Redis-кэш или зондирование)
    const vendor = await detectDeviceVendor(deviceId)

    // 2. Выбираем правильный эндпоинт в зависимости от вендора
    let endpoint = 'cgi-bin__ping_cgi~action=status' // по умолчанию бевард
    if (vendor === 'dahua') {
      endpoint = 'cgi-bin__magicBox.cgi~action=getSystemInfo'
    }

    const result = await callDeviceEndpoint(deviceId, endpoint)

    if (result.status === null || result.status !== 200) {
      log.warn(`Ошибка пинга устройства #${deviceId} (вендор: ${vendor})`, {
        deviceId,
        vendor,
        status: result.status,
        error: result.error,
      })
    } else {
      log.info(`Успешный пинг устройства #${deviceId}. Вендор: ${vendor}`, { deviceId, vendor })
    }

    // Возвращаем результат вместе с информацией о вендоре, если это полезно клиенту
    return {
      ...result,
      vendor
    }
  }
}
