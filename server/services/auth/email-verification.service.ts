import { getRedisClient } from '#server/utils/redis'
import { userRepository } from '#server/repositories/prisma/user.repository'
import { sendVerificationEmail } from '#server/utils/mail'
import { ensureDefaultEmailTemplate } from '#server/utils/emailTemplates'
import { logger } from '#server/utils/logger'

const log = logger.withTag('services:auth:email-verification')

export const emailVerificationService = {
  /**
   * Подтверждение email пользователя по токену из письма
   */
  async verifyEmail(token: string) {
    if (!token) {
      throw createError({ statusCode: 400, message: 'Токен подтверждения не передан' })
    }

    const redis = getRedisClient()
    const userIdStr = await redis.get(`verify-email:${token}`)

    if (!userIdStr) {
      throw createError({
        statusCode: 400,
        message: 'Ссылка подтверждения недействительна или срок её действия истёк'
      })
    }

    const userId = Number(userIdStr)

    // Используем репозиторий вместо прямой работы с Prisma
    await userRepository.update(userId, { email_verified_at: new Date() })

    await redis.del(`verify-email:${token}`)

    log.success(`✅ Email успешно подтвержден для пользователя ID: ${userId}`)
    return userId
  },

  /**
   * Запрос на привязку/изменение email с отправкой письма подтверждения
   */
  async requestEmailVerification(userId: number, newEmail: string) {
    // Проверяем через userRepository
    const existingUser = await userRepository.findByEmail(newEmail)
    if (existingUser && existingUser.user_id !== userId) {
      throw createError({
        statusCode: 409,
        message: 'Этот email уже используется другим пользователем'
      })
    }

    const updatedUser = await userRepository.update(
      userId,
      {
        email: newEmail,
        email_verified_at: null
      },
      {
        user_id: true,
        user_name: true
      }
    )

    log.success(`Email успешно обновлен для пользователя ID: ${updatedUser.user_id}`)

    await ensureDefaultEmailTemplate()
    const redis = getRedisClient()
    const token = crypto.randomUUID()
    await redis.set(`verify-email:${token}`, String(userId), 'EX', 86400)

    try {
      await sendVerificationEmail(newEmail, token, updatedUser.user_name || undefined)
    } catch (err) {
      log.error(`Не удалось отправить письмо с подтверждением для ID ${userId}:`, err)
      throw createError({
        statusCode: 500,
        message: 'Не удалось отправить письмо с подтверждением',
        cause: err
      })
    }

    return { success: true, message: 'Ссылка с подтверждением отправлена на ваш email' }
  },

  /**
   * Запрос на сброс пароля
   */
  async requestPasswordReset(email: string) {
    const redis = getRedisClient()
    await ensureDefaultEmailTemplate()

    // Используем userRepository
    const user = await userRepository.findByEmail(email)

    if (!user || !user.email_verified_at || !user.email) {
      return { success: true, message: 'Если такой email зарегистрирован и подтвержден, инструкция отправлена.' }
    }

    const token = crypto.randomUUID()
    await redis.set(`reset-password:${token}`, String(user.user_id), 'EX', 3600)

    return { success: true, message: 'Если такой email зарегистрирован и подтвержден, инструкция отправлена.' }
  }
}
