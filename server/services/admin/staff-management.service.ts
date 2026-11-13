import { userRepository } from '#server/repositories/prisma/user.repository'
import { normalizeAndValidatePhone } from '#server/utils/phone'
import type { UserRole } from '@prisma/client'

const log = logger.withTag('services:admin:staff')

export const staffManagementService = {
  /** Получение списка всех сотрудников (все, у кого роль не 'client') */
  async getStaffList() {
    try {
      const staff = await userRepository.findUserList()
      log.info(`Запрошен список сотрудников. Всего найдено: ${staff.length}`)
      return staff
    } catch (err: unknown) {
      log.error('Ошибка при получении списка сотрудников:', { cause: err })
      throw createError({
        statusCode: 500,
        message: 'Не удалось получить список сотрудников',
        cause: err
      })
    }
  },

  /** Создание нового сотрудника или повышение существующего клиента до сотрудника */
  async createOrPromoteStaff(adminUserId: number, rawPhone: string, roleName: UserRole, rawUserName?: string | null) {
    const phone = normalizeAndValidatePhone(rawPhone)
    const userName = rawUserName?.trim() || undefined

    // 1. Проверяем, существует ли пользователь в базе
    const existingUser = await userRepository.findByPhone(phone)

    if (existingUser) {
      // Если это уже сотрудник — выдаем ошибку
      if (['admin', 'installer', 'manager'].includes(existingUser.role_name)) {
        throw createError({
          statusCode: 409,
          message: 'Сотрудник с таким номером телефона уже зарегистрирован в системе'
        })
      }

      // Если это был клиент — «повышаем» его до сотрудника
      const updatedUser = await userRepository.update(
        existingUser.user_id,
        {
          role_name: roleName,
          ...(userName ? { user_name: userName } : {})
        },
        { user_id: true, user_name: true, phone: true, role_name: true }
      )

      log.success(`Администратор #${adminUserId} назначил существующего клиента ${updatedUser.phone} сотрудником (${roleName})`)
      return updatedUser
    }

    // 2. Если пользователя не было — создаем нового сотрудника с нуля
    const newUser = await userRepository.create({
      phone,
      user_name: userName || 'Сотрудник',
      role_name: roleName,
      password: null,
      activated_at: null
    })

    log.success(`Администратор #${adminUserId} создал сотрудника ${newUser.phone} (${roleName})`)
    return {
      user_id: newUser.user_id,
      user_name: newUser.user_name,
      phone: newUser.phone,
      role_name: newUser.role_name
    }
  }
}
