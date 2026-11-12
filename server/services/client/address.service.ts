import { addressRepository } from '#server/repositories/prisma/address.repository.ts'
import { logger } from '#server/utils/logger.ts'

const log = logger.withTag('services:client:address')

export const addressService = {
  async getClientAddresses(userId: number) {
    try {
      const addresses = await addressRepository.findClientAddresses(userId)
      log.info(`Загружено объектов для клиента ID ${userId}: ${addresses.length}`)
      return addresses
    } catch (err: unknown) {
      log.error(`Ошибка при загрузке объектов для клиента ID ${userId}:`, err)
      throw createError({
        statusCode: 500,
        message: 'Не удалось загрузить ваши объекты',
      })
    }
  }
}
