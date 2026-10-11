import { uploadFileToMinio, getMinioClient } from '~~/server/utils/minio'

export default defineEventHandler(async (event) => {
  // 1. Проверяем авторизацию сессии
  // const session = await requireUserSession(event)
  const targetUserId = getRouterParam(event, 'id')

  if (!targetUserId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID пользователя не указан'
    })
  }

  // 2. Проверяем права: пользователь может менять только свой аватар, если он не администратор
  // const isAdmin = session.user.ruleName === 'admin'
  // const isSelf = String(session.user.id) === String(targetUserId)
  //
  // if (!isSelf && !isAdmin) {
  //   throw createError({
  //     statusCode: 403,
  //     statusMessage: 'Недостаточно прав для изменения аватара этого пользователя'
  //   })
  // }

  const log = logger.withTag('users')

  // 3. Читаем multipart/form-data
  const parts = await readMultipartFormData(event)
  if (!parts || parts.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Файл не передан'
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
      statusMessage: 'Поле "avatar" обязательно'
    })
  }

  // Валидация формата
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(avatarPart.type)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Поддерживаются только форматы JPEG, PNG и WEBP'
    })
  }

  // Валидация размера (2 МБ)
  if (avatarPart.data.length > 2 * 1024 * 1024) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Максимальный размер файла — 2 МБ'
    })
  }

  // 4. Находим пользователя в БД, чтобы узнать путь к старому аватарки
  const targetUser = await prisma.user.findUnique({
    where: { id: String(targetUserId) },
    select: { id: true, avatar: true }
  })

  if (!targetUser) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Пользователь не найден'
    })
  }

  // 5. Загружаем новый файл в MinIO через общую утилиту
  let newAvatarPath: string
  try {
    newAvatarPath = await uploadFileToMinio(
      avatarPart.data,
      avatarPart.filename,
      avatarPart.type,
      'avatars'
    )
    log.info(`[MinIO] Новый аватар успешно загружен: ${newAvatarPath}`)
  } catch (err) {
    log.error('Ошибка загрузки аватара в MinIO:', err)
    throw createError({
      statusCode: 500,
      statusMessage: 'Не удалось сохранить файл в хранилище'
    })
  }

  // 6. Удаляем старый файл из MinIO (если он существовал), чтобы не забивать диск
  if (targetUser.avatar) {
    try {
      const { client, bucket } = getMinioClient()
      await client.removeObject(bucket, targetUser.avatar)
      log.info(`[MinIO] Старый аватар удален: ${targetUser.avatar}`)
    } catch (err) {
      log.warn('Не удалось удалить старый файл аватара из MinIO:', err)
    }
  }

  // 7. Обновляем путь в базе данных PostgreSQL
  const updatedUser = await prisma.user.update({
    where: { id: String(targetUserId) },
    data: { avatar: newAvatarPath },
    select: {
      id: true,
      name: true,
      email: true,
      ruleName: true,
      avatar: true
    }
  })

  // 8. Если пользователь менял аватар себе — обновляем активную сессию
  // if (isSelf) {
  //   await setUserSession(event, {
  //     user: {
  //       ...session.user,
  //       avatar: updatedUser.avatar
  //     }
  //   })
  // }

  log.info(`✅ Аватар успешно обновлен для пользователя ID: ${targetUserId}`)

  return {
    success: true,
    avatarUrl: updatedUser.avatar ? `/api/files/${updatedUser.avatar}` : null
  }
})
