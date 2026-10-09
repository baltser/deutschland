import { ensureBucket } from '~~/server/utils/minio'

export default defineEventHandler(async () => {
  try {
    await ensureBucket()
    return {
      status: 'ok',
      message: 'Подключение к MinIO успешно установлено'
    }
  } catch (err: unknown) {
    const error = err as Error
    console.error('[MinIO Health Error]:', error)
    throw createError({
      statusCode: 500,
      statusMessage: `Ошибка подключения к MinIO: ${error.message}`
    })
  }
})
