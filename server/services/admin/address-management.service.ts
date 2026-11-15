import { addressRepository } from '#server/repositories/prisma/address.repository'
import { userRepository } from '#server/repositories/prisma/user.repository'
import { normalizeAndValidatePhone } from '#server/utils/phone'
import { logger } from '#server/utils/logger'
import { prisma } from '#server/utils/prisma'

const log = logger.withTag('services:admin:address')

export const addressManagementService = {
  async getAllAddresses() {
    try {
      const addresses = await addressRepository.findAllWithDevicesAndClients()
      log.info(`Администратор запросил список адресов. Всего найдено: ${addresses.length}`)
      return addresses
    } catch (err: unknown) {
      log.error('Ошибка при получении списка адресов:', err)
      throw createError({ statusCode: 500, message: 'Не удалось загрузить список адресов' })
    }
  },

  /** Получение детальной информации об адресе через репозиторий */
  async getAddressById(addressId: number) {
    const address = await addressRepository.findByIdWithClientsAndDevices(addressId)
    if (!address) {
      throw createError({ statusCode: 404, message: 'Адрес не найден' })
    }
    return address
  },

  async createAddress(addressName: string, adminUserId: number) {
    try {
      const newAddress = await addressRepository.create({ address_name: addressName })
      log.success(`Администратор #${adminUserId} создал новый адрес: "${addressName}" (ID: ${newAddress.address_id})`)
      return newAddress
    } catch (e: unknown) {
      const prismaErr = e as { code?: string }
      if (prismaErr.code === 'P2002') {
        throw createError({ statusCode: 400, message: 'Такой адрес уже существует в системе' })
      }
      throw e
    }
  },

  /** Привязка клиента к адресу с использованием методов репозитория */
  async addClientToAddress(addressId: number, rawPhone: string, rawUserName?: string) {
    const phone = normalizeAndValidatePhone(rawPhone)
    const userName = rawUserName?.trim() || 'Клиент'

    const address = await addressRepository.findById(addressId)
    if (!address) {
      throw createError({ statusCode: 404, message: 'Адрес не найден' })
    }

    let user = await userRepository.findByPhone(phone)
    if (!user) {
      user = await userRepository.create({
        phone,
        user_name: userName,
        password: null,
        role_name: 'client',
        activated_at: null
      })
    }

    try {
      // Используем готовый метод из addressRepository вместо прямого prisma
      await addressRepository.linkClientToAddress(user.user_id, addressId)
    } catch (e: unknown) {
      const err = e as { code?: string }
      if (err.code !== 'P2002') {
        throw e
      }
    }

    return user
  },

  async importClientsToAddress(addressId: number, clientsData: Array<{ phone: string; name?: string | null }>) {
    const address = await addressRepository.findById(addressId)
    if (!address) {
      throw createError({ statusCode: 404, message: 'Адрес не найден' })
    }

    let importedCount = 0

    await prisma.$transaction(async (tx) => {
      for (const item of clientsData) {
        let phone: string
        try {
          phone = normalizeAndValidatePhone(item.phone)
        } catch {
          continue
        }

        const userName = item.name?.trim() && item.name !== 'Без имени'
          ? item.name.trim()
          : 'Клиент'

        let user = await tx.users.findUnique({ where: { phone } })

        if (!user) {
          user = await tx.users.create({
            data: {
              phone,
              user_name: userName,
              password: null,
              role_name: 'client',
              activated_at: null
            }
          })
        } else if (user.user_name === 'Клиент' && userName !== 'Клиент') {
          user = await tx.users.update({
            where: { user_id: user.user_id },
            data: { user_name: userName }
          })
        }

        await tx.clients_x_addresses.upsert({
          where: {
            user_id_address_id: {
              user_id: user.user_id,
              address_id: addressId
            }
          },
          update: {},
          create: {
            user_id: user.user_id,
            address_id: addressId
          }
        })

        importedCount++
      }
    })

    return importedCount
  },
  
  /** Удаление адреса и всех связанных данных */
  async deleteAddress(addressId: number, adminUserId?: number) {
    const address = await addressRepository.findById(addressId)
    if (!address) {
      throw createError({ statusCode: 404, message: 'Адрес не найден' })
    }

    try {
      // Вызываем готовый метод репозитория
      const deleted = await addressRepository.delete(addressId)
      log.success(`Администратор ${adminUserId ? '#' + adminUserId : ''} удалил объект: "${address.address_name}" (ID: ${addressId})`)
      return deleted
    } catch (err: unknown) {
      log.error(`Ошибка при удалении адреса #${addressId}:`, err)
      throw createError({ statusCode: 500, message: 'Не удалось удалить объект и связанные данные' })
    }
  }
}
