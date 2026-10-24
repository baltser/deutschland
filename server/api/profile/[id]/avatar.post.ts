import { uploadFileToMinio, getMinioClient } from '#server/utils/minio.ts'
import { logger } from '#server/utils/logger.ts'

export default defineEventHandler(async (event) => {
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

  // 2. Проверяем права: пользователь может менять только свой аватар, если он не администратор
  const isAdmin = session.user.role_name === 'admin'
  const isSelf = Number(session.user.user_id) === userIdNum

  if (!isSelf && !isAdmin) {
    throw createError({
      statusCode: 403,
      message: 'Недостаточно прав для изменения аватара этого пользователя'
    })
  }

  // 3. Читаем multipart/form-data
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

  // Валидация формата
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(avatarPart.type)) {
    throw createError({
      statusCode: 400,
      message: 'Поддерживаются только форматы JPEG, PNG и WEBP'
    })
  }

  // Валидация размера (до 2 МБ)
  if (avatarPart.data.length > 2 * 1024 * 1024) {
    throw createError({
      statusCode: 400,
      message: 'Максимальный размер файла — 2 МБ'
    })
  }

  // 4. Находим пользователя в БД
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

  // 5. Загружаем новый файл в MinIO
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

  // 6. Удаляем старый файл из MinIO (если он существовал)
  if (targetUser.avatar_path) {
    try {
      const { client, bucket } = getMinioClient()
      await client.removeObject(bucket, targetUser.avatar_path)
      log.info(`[MinIO] Старый аватар удален: ${targetUser.avatar_path}`)
    } catch (err: unknown) {
      log.warn('Не удалось удалить старый файл аватара из MinIO:', { cause: err })
    }
  }

  // 7. Обновляем путь в базе данных (теперь role_name берется напрямую из users)
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

  // 8. Если пользователь менял аватар себе — обновляем активную сессию
  if (isSelf) {
    await setUserSession(event, {
      user: {
        ...session.user,
        avatar_path: updatedUser.avatar_path
      }
    })
  }

  log.success(`✅ Аватар успешно обновлен для пользователя ID: ${targetUserId}`)

  return {
    success: true,
    avatarUrl: updatedUser.avatar_path ? `/api/files/${updatedUser.avatar_path}` : null
  }
})
