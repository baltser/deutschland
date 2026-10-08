export default defineEventHandler(async () => {
  try {
    await ensureBucket()
    const buckets = await minioClient.listBuckets()

    return {
      status: 'ok',
      message: 'Подключение к MinIO успешно установлено',
      bucket: BUCKET_NAME,
      allBuckets: buckets.map(b => b.name)
    }
  } catch (error) {
    // Безопасное извлечение сообщения без явного any
    const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка'

    throw createError({
      statusCode: 500,
      statusMessage: `Ошибка подключения к MinIO: ${errorMessage}`
    })
  }
})
