import { minioClient, BUCKET_NAME } from '~~/server/utils/minio'

export default defineEventHandler(async (event) => {
  const path = getRouterParam(event, 'path')
  if (!path) {
    throw createError({ statusCode: 400, statusMessage: 'Имя файла не указано' })
  }

  try {
    const dataStream = await minioClient.getObject(BUCKET_NAME, path)
    const stat = await minioClient.statObject(BUCKET_NAME, path)

    setResponseHeader(event, 'Content-Type', stat.metaData['content-type'] || 'image/jpeg')
    setResponseHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable')

    return sendStream(event, dataStream)
  } catch (err: any) {
    throw createError({ statusCode: 404, statusMessage: 'Файл не найден' })
  }
})
