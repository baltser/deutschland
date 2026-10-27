import { uploadFileToMinio, getMinioClient } from '#server/utils/minio.ts'
import { logger } from '#server/utils/logger.ts'
import type { AvatarUploadResponse } from '#server/types/profile'

export default defineEventHandler(async (event): Promise<AvatarUploadResponse> => {
  const session = await requireUserSession(event)
  const targetUserId = getRouterParam(event, 'id')

  if (!targetUserId) {
    throw createError({
      statusCode: 400,
      message: 'ID пользователя не указан'
    })
  }

  const userIdNum = Number(targetUserId)
  const log = logger.withTag('users:avatar')

  const isAdmin = session.user.role_name === 'admin'
  const isSelf = Number(session.user.user_id) === userIdNum

  if (!isSelf && !isAdmin) {
    throw createError({
      statusCode: 403,
      message: 'Недостаточно прав для изменения аватара этого пользователя'
    })
  }

  const parts = await readMultipartFormData(event)
  if (!parts || parts.length === 0) {
    throw createError({
      statusCode: 400,
      message: 'Файл не передан'
    })
  }

  let avatarPart: { filename: string; type: string; data: Buffer } | null = null

  for (const part of parts) {
    if (part.name === 'avatar' && part.filename && part.data.length > 0) {
      avatarPart = {
        filename: part.filename,
        type: part.type || 'image/jpeg',
        data: part.data
      }
      break
    }
  }

  if (!avatarPart) {
    throw createError({
      statusCode: 400,
      message: 'Поле "avatar" обязательно'
    })
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(avatarPart.type)) {
    throw createError({
      statusCode: 400,
      message: 'Поддерживаются только форматы JPEG, PNG и WEBP'
    })
  }

  if (avatarPart.data.length > 2 * 1024 * 1024) {
    throw createError({
      statusCode: 400,
      message: 'Максимальный размер файла — 2 МБ'
    })
  }

  const targetUser = await prisma.users.findUnique({
    where: { user_id: userIdNum },
    select: { user_id: true, avatar_path: true }
  })

  if (!targetUser) {
    throw createError({
      statusCode: 404,
      message: 'Пользователь не найден'
    })
  }

  let newAvatarPath: string
  try {
    newAvatarPath = await uploadFileToMinio(
      avatarPart.data,
      avatarPart.filename,
      avatarPart.type,
      'avatars'
    )
    log.info(`[MinIO] Новый аватар успешно загружен: ${newAvatarPath}`)
  } catch (err: unknown) {
    log.error('Ошибка загрузки аватара в MinIO:', { cause: err })
    throw createError({
      statusCode: 500,
      message: 'Не удалось сохранить файл в хранилище'
    })
  }

  if (targetUser.avatar_path) {
    try {
      const { client, bucket } = getMinioClient()
      await client.removeObject(bucket, targetUser.avatar_path)
      log.info(`[MinIO] Старый аватар удален: ${targetUser.avatar_path}`)
    } catch (err: unknown) {
      log.warn('Не удалось удалить старый файл аватара из MinIO:', { cause: err })
    }
  }

  const updatedUser = await prisma.users.update({
    where: { user_id: userIdNum },
    data: { avatar_path: newAvatarPath },
    select: {
      user_id: true,
      user_name: true,
      email: true,
      avatar_path: true,
      role_name: true
    }
  })

  if (isSelf) {
    await setUserSession(event, {
      user: {
        user_id: updatedUser.user_id,
        role_name: updatedUser.role_name,
        user_name: updatedUser.user_name || null,
        avatar_path: updatedUser.avatar_path || null
      }
    })
  }

  log.success(`✅ Аватар успешно обновлен для пользователя ID: ${targetUserId}`)

  return {
    success: true,
    avatarUrl: updatedUser.avatar_path ? `/api/files/${updatedUser.avatar_path}` : null
  }
})
