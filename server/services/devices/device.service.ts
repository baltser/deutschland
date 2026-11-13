import { addressRepository } from '#server/repositories/prisma/address.repository'
import { deviceRepository } from '#server/repositories/prisma/device.repository'
import { callDeviceEndpoint } from '#server/utils/devices/device-api.ts'
import { logger } from '#server/utils/logger'
import type { Prisma, DeviceType} from '@prisma/client';
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
          connect: {address_id: addressId}
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
  /** Частичное обновление устройства */
  async updateDevice(
    deviceId: number,
    actorUserId: number,
    data: {
      device_name?: string
      device_type?: string
      ip?: string | null
      port?: number | null
      login?: string | null
      password?: string | null
    }
  ) {
    // 1. Проверяем, существует ли устройство
    const existingDevice = await deviceRepository.findById(deviceId)
    if (!existingDevice) {
      throw createError({
        statusCode: 404,
        message: 'Устройство не найдено',
      })
    }

    try {
      // 2. Подготавливаем данные для апдейта (очищаем от лишних пробелов, если они есть)
      const updateData: Prisma.devicesUpdateInput = {}

      if (data.device_name !== undefined) {
        if (!data.device_name.trim()) {
          throw createError({statusCode: 400, message: 'Название устройства не может быть пустым'})
        }
        updateData.device_name = data.device_name.trim()
      }

      if (data.device_type !== undefined) {
        updateData.device_type = data.device_type as DeviceType
      }

      if (data.ip !== undefined) {
        updateData.ip = data.ip ? data.ip.trim() : null
      }

      if (data.port !== undefined) {
        updateData.port = data.port ? Number(data.port) : null
      }

      if (data.login !== undefined) {
        updateData.login = data.login ? data.login.trim() : null
      }

      // Пароль обновляем только если он передан и не пустой (либо явно сбрасывается)
      if (data.password !== undefined) {
        updateData.password = data.password ? data.password.trim() : null
      }

      // 3. Вызываем репозиторий
      const updatedDevice = await deviceRepository.update(deviceId, updateData)

      log.success(`Пользователь #${actorUserId} обновил устройство #${deviceId} ("${updatedDevice.device_name}")`)
      return updatedDevice
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'statusCode' in err) {
        throw err
      }
      log.error(`Ошибка при обновлении устройства #${deviceId}:`, err)
      throw createError({
        statusCode: 500,
        message: 'Не удалось обновить устройство в базе данных',
      })
    }
  },

  /** Удаление устройства */
  async deleteDevice(deviceId: number, actorUserId: number) {
    const existingDevice = await deviceRepository.findById(deviceId)
    if (!existingDevice) {
      throw createError({
        statusCode: 404,
        message: 'Устройство не найдено',
      })
    }

    try {
      await deviceRepository.delete(deviceId)
      log.success(`Пользователь #${actorUserId} удалил устройство #${deviceId} ("${existingDevice.device_name}")`)
      return {success: true}
    } catch (err: unknown) {
      log.error(`Ошибка при удалении устройства #${deviceId}:`, err)
      throw createError({
        statusCode: 500,
        message: 'Не удалось удалить устройство из базы данных',
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
