import { minioRepository } from '#server/repositories/storage/minio.repository'
import { logger } from '#server/utils/logger'

const log = logger.withTag('services:file-storage')

const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_AVATAR_SIZE = 2 * 1024 * 1024 // 2 МБ

export const fileStorageService = {
  /** Валидация и загрузка аватара в хранилище  */

  async uploadAvatar(avatarPart: { filename: string; type: string; data: Buffer }) {
    if (!ALLOWED_AVATAR_TYPES.includes(avatarPart.type)) {
      throw createError({
        statusCode: 400,
        message: 'Поддерживаются только форматы JPEG, PNG и WEBP'
      })
    }

    if (avatarPart.data.length > MAX_AVATAR_SIZE) {
      throw createError({
        statusCode: 400,
        message: 'Максимальный размер файла — 2 МБ'
      })
    }

    try {
      return await minioRepository.upload(
        avatarPart.data,
        avatarPart.filename,
        avatarPart.type,
        'avatars'
      )
    } catch (err: unknown) {
      log.error('Ошибка загрузки аватара в хранилище:', err)
      throw createError({
        statusCode: 500,
        message: 'Не удалось сохранить файл в хранилище'
      })
    }
  },

  /** Удаление файла по пути */

  async removeFile(path: string | null) {
    if (!path) return
    await minioRepository.remove(path)
  },

  /** Получение файла для отдачи клиенту (стриминг) */

  async getFileStream(pathParam: string | string[]) {
    const filePath = Array.isArray(pathParam) ? pathParam.join('/') : pathParam

    try {
      return await minioRepository.getFileStream(filePath)
    } catch (err: unknown) {
      const error = err as { code?: string }
      if (error.code === 'NotFound' || error.code === 'NoSuchKey') {
        throw createError({ statusCode: 404, statusMessage: 'Файл не найден' })
      }
      throw createError({ statusCode: 500, statusMessage: 'Ошибка при чтении файла из хранилища' })
    }
  }
}
