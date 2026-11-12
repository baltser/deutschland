import { prisma } from '#server/utils/prisma'
import type { Prisma } from '@prisma/client'

export const addressRepository = {
  /** Загрузка всех адресов со списком связанных клиентов и устройств   */

  async findAllWithDevicesAndClients() {
    return prisma.addresses.findMany({
      include: {
        clients: {
          include: {
            user: {
              select: {
                user_id: true,
                user_name: true,
                phone: true,
                email: true
              }
            }
          }
        },
        devices: true
      },
      orderBy: { address_id: 'desc' }
    })
  },

  /** Загрузка объектов (адресов) конкретного клиента вместе с камерами   */

  async findClientAddresses(userId: number) {
    const clientAddresses = await prisma.clients_x_addresses.findMany({
      where: { user_id: userId },
      include: {
        address: {
          include: {
            devices: {
              where: {
                device_type: 'CAMERA',
              },
            },
          },
        },
      },
    })

    return clientAddresses.map((item) => item.address)
  },

  /**
   * Поиск адреса по ID
   */
  async findById(addressId: number) {
    return prisma.addresses.findUnique({
      where: { address_id: addressId },
      include: {
        devices: true
      }
    })
  },


  /** ✨ Поиск адреса по ID со всеми клиентами и устройствами (для детальной страницы) */

  async findByIdWithClientsAndDevices(addressId: number) {
    return prisma.addresses.findUnique({
      where: { address_id: addressId },
      include: {
        clients: {
          include: {
            user: true,
          },
        },
        devices: true,
      },
    })
  },

  /** Привязка клиента к адресу (управление таблицей clients_x_addresses)   */

  async linkClientToAddress(userId: number, addressId: number) {
    return prisma.clients_x_addresses.create({
      data: {
        user_id: userId,
        address_id: addressId
      }
    })
  },
  /** Создание нового физического адреса  */

  async create(data: Prisma.addressesCreateInput) {
    return prisma.addresses.create({
      data
    })
  },

  /** ✨ Обновление данных физического адреса  */

  async update(addressId: number, data: Prisma.addressesUpdateInput) {
    return prisma.addresses.update({
      where: { address_id: addressId },
      data
    })
  },

  /** ✨ Удаление адреса из базы данных   */

  async delete(addressId: number) {
    return prisma.addresses.delete({
      where: { address_id: addressId }
    })
  },

  /** Отвязка клиента от адреса   */

  async unlinkClientFromAddress(userId: number, addressId: number) {
    return prisma.clients_x_addresses.delete({
      where: {
        user_id_address_id: {
          user_id: userId,
          address_id: addressId
        }
      }
    })
  }
}
