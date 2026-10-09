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
    await ensureBucket()

    // Загружаем буфер файла в MinIO
    await client.putObject(
      bucket,
      objectName,
      file.data,
      file.data.length,
      { 'Content-Type': file.type }
    )

    // Формируем публичный URL или внутренний API-маршрут для выдачи изображения
    const avatarUrl = `/api/files/${objectName}`

    // await db.user.update({ where: { id: Number(userId) }, data: { avatarUrl } })

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
