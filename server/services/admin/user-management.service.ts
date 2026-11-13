import { userRepository } from '#server/repositories/prisma/user.repository'
import type { UserRole } from '@prisma/client'

const log = logger.withTag('services:admin:user-management')

export const userManagementService = {
  /** Универсальное обновление пользователя (и сотрудника, и клиента) */
  async updateUser(adminUserId: number, userId: number, updateData: { user_name?: string; role_name?: UserRole; avatar_path?: string | null }) {
    try {
      const updatedUser = await userRepository.update(userId, updateData, {
        user_id: true,
        user_name: true,
        email: true,
        phone: true,
        role_name: true,
        avatar_path: true,
        activated_at: true
      })

      log.success(`Администратор #${adminUserId} обновил пользователя ID: ${userId}`)
      return updatedUser
    } catch (err: unknown) {
      log.error(`Не удалось обновить пользователя ID: ${userId}`, { cause: err })
      throw createError({
        statusCode: 500,
        message: 'Ошибка сервера при обновлении пользователя',
        cause: err
      })
    }
  },

  /** Универсальное удаление пользователя (удаляет каскадно из базы) */
  async deleteUser(adminUserId: number, userId: number) {
    try {
      // Проверяем, существует ли пользователь
      const targetUser = await userRepository.findById(userId)
      if (!targetUser) {
        throw createError({ statusCode: 404, message: 'Пользователь не найден' })
      }

      await userRepository.delete(userId)

      log.success(`Администратор #${adminUserId} удалил пользователя ID: ${userId} (${targetUser.phone})`)
      return { success: true, message: 'Пользователь успешно удален' }
    } catch (err: unknown) {
      log.error(`Не удалось удалить пользователя ID: ${userId}`, { cause: err })
      if (err && typeof err === 'object' && 'statusCode' in err) throw err

      throw createError({
        statusCode: 500,
        message: 'Не удалось удалить пользователя из системы',
        cause: err
      })
    }
  }
}
