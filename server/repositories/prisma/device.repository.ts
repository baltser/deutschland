import { prisma } from '#server/utils/prisma'
import type { Prisma } from '@prisma/client'

export const deviceRepository = {
  /**
   * Получение конфигурации устройства по ID (IP, порт, доступы)
   * (заменяет старые прямые вызовы getDeviceConfig)
   */
  async findById(deviceId: number) {
    return prisma.devices.findUnique({
      where: { device_id: deviceId },
      include: {
        address: {
          select: {
            address_id: true,
            address_name: true
          }
        }
      }
    })
  },

  /**
   * Получение списка всех устройств на конкретном физическом объекте (адресе)
   */
  async findByAddressId(addressId: number) {
    return prisma.devices.findMany({
      where: { address_id: addressId },
      orderBy: { device_id: 'asc' }
    })
  },

  /**
   * Создание нового устройства (камеры или панели) в системе
   */
  async create(data: Prisma.devicesCreateInput) {
    return prisma.devices.create({
      data
    })
  },

  /**
   * Обновление конфигурации или параметров устройства
   */
  async update(deviceId: number, data: Prisma.devicesUpdateInput) {
    return prisma.devices.update({
      where: { device_id: deviceId },
      data
    })
  },

  /**
   * Удаление устройства из базы данных
   */
  async delete(deviceId: number) {
    return prisma.devices.delete({
      where: { device_id: deviceId }
    })
  }
}
