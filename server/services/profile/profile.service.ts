import bcrypt from 'bcryptjs'
import { Prisma } from '@prisma/client'
import { userRepository } from '#server/repositories/prisma/user.repository'
import { minioRepository } from '#server/repositories/storage/minio.repository'
import { logger } from '#server/utils/logger'

const log = logger.withTag('services:profile')

export interface UpdateProfileInput {
  user_name?: string
  email?: string | null
  password?: string | null
}

export const profileService = {
  /** Получение профиля пользователя по ID */

  async getProfile(userId: number) {
    const user = await userRepository.findById(userId)
    if (!user) {
      throw createError({
        statusCode: 404,
        message: 'Пользователь не найден'
      })
    }
    return user
  },

  /**
   * Обновление данных профиля (имя, email, хэширование нового пароля)
   */
  async updateProfile(userId: number, input: UpdateProfileInput) {
    try {
      const currentUser = await userRepository.findById(userId)
      if (!currentUser) {
        throw createError({
          statusCode: 404,
          message: 'Пользователь не найден'
        })
      }

      const updateData: Record<string, unknown> = {}

      if (input.user_name !== undefined && input.user_name !== currentUser.user_name) {
        updateData.user_name = input.user_name
      }

      // Если email изменился — обновляем его И сбрасываем подтверждение в null
      if (input.email !== undefined && input.email !== currentUser.email) {
        updateData.email = input.email
        updateData.email_verified_at = null
      }

      if (input.password) {
        updateData.password = await bcrypt.hash(input.password, 10)
      }

      const selectFields = {
        user_id: true,
        user_name: true,
        phone: true,
        email: true,
        email_verified_at: true,
        avatar_path: true,
        activated_at: true,
        role_name: true
      }

      // Если изменений нет — возвращаем текущие данные
      if (Object.keys(updateData).length === 0) {
        return await userRepository.update(userId, {}, selectFields)
      }

      const updatedUser = await userRepository.update(userId, updateData, selectFields)

      log.success(`Профиль успешно обновлен для пользователя ID: ${userId}`)
      return updatedUser
    } catch (err: unknown) {
      log.error(`Ошибка при обновлении профиля пользователя ID ${userId}:`, err)

      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw createError({
          statusCode: 400,
          message: 'Этот адрес электронной почты уже используется другим пользователем.'
        })
      }

      if ((err as { statusCode?: number }).statusCode) {
        throw err
      }

      throw createError({
        statusCode: 500,
        message: 'Не удалось обновить профиль в базе данных'
      })
    }
  },

  /** Загрузка нового аватара через minioRepository, удаление старого файла и обновление БД */

  async uploadAvatar(targetUserId: number, avatarPart: { filename: string; type: string; data: Buffer }) {
    const targetUser = await userRepository.findById(targetUserId)
    if (!targetUser) {
      throw createError({
        statusCode: 404,
        message: 'Пользователь не найден'
      })
    }

    let newAvatarPath: string
    try {
      newAvatarPath = await minioRepository.upload(
        avatarPart.data,
        avatarPart.filename,
        avatarPart.type,
        'avatars'
      )
    } catch (err: unknown) {
      log.error('Ошибка загрузки аватара в MinIO:', { cause: err })
      throw createError({
        statusCode: 500,
        message: 'Не удалось сохранить файл в хранилище'
      })
    }

    // Удаляем старый файл из MinIO через репозиторий, если он существовал
    if (targetUser.avatar_path) {
      await minioRepository.remove(targetUser.avatar_path)
    }

    const updatedUser = await userRepository.update(
      targetUserId,
      { avatar_path: newAvatarPath },
      {
        user_id: true,
        user_name: true,
        email: true,
        avatar_path: true,
        role_name: true
      }
    )

    log.success(`✅ Аватар успешно обновлен для пользователя ID: ${targetUserId}`)
    return updatedUser
  }
}
