import { getMinioClient } from '~~/server/utils/minio'

export default defineEventHandler(async (event) => {
  const { client, bucket } = getMinioClient()

  const userId = getRouterParam(event, 'id')
  if (!userId) {
    throw createError({ statusCode: 400, statusMessage: 'Не указан ID пользователя' })
  }

  // Считываем multipart/form-data
  const formData = await readMultipartFormData(event)
  const file = formData?.find(item => item.name === 'avatar')

  if (!file || !file.data) {
    throw createError({ statusCode: 400, statusMessage: 'Файл аватара не найден в запросе' })
  }

  // Проверка типа файла на сервере
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!file.type || !allowedMimeTypes.includes(file.type)) {
    throw createError({ statusCode: 400, statusMessage: 'Недопустимый формат файла' })
  }

  // Формируем имя файла в MinIO (например: avatars/user_123_1728421000.jpg)
  const extension = file.type.split('/')[1] || 'jpg'
  const objectName = `avatars/user_${userId}_${Date.now()}.${extension}`

  try {
    // Убедимся, что бакет существует (если у вас есть такая утилита)
    if (typeof ensureBucket === 'function') {
      await ensureBucket()
    }

    // Загружаем буфер файла в MinIO
    await client.putObject(
      bucket,
      objectName,
      file.data,
      file.data.length,
      { 'Content-Type': file.type }
    )

    // ИСПРАВЛЕНИЕ: Сохраняем имя файла в базу данных через Prisma
    // (учитывая, что ID у вас String/UUID, передаем userId как есть)
    await prisma.user.update({
      where: { id: userId },
      data: { avatar: objectName }
    })

    // Формируем URL для фронтенда
    const avatarUrl = `/api/files/${objectName}`

    return {
      success: true,
      avatarUrl
    }
  } catch (error) {
    console.error('[MinIO Upload Error]:', error)
    throw createError({
      statusCode: 500,
      statusMessage: `Ошибка сохранения аватара в MinIO: ${error}`
    })
  }
})
