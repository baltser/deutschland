import { getMinioClient } from '~~/server/utils/minio'

export default defineEventHandler(async (event) => {
  const { client, bucket } = getMinioClient()

  const path = getRouterParam(event, 'path')
  if (!path) {
    throw createError({ statusCode: 400, statusMessage: 'Имя файла не указано' })
  }

  try {
    const dataStream = await client.getObject(bucket, path)
    const stat = await client.statObject(bucket, path)

    setResponseHeader(event, 'Content-Type', stat.metaData['content-type'] || 'image/jpeg')
    setResponseHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable')

    return sendStream(event, dataStream)
  } catch {
    throw createError({ statusCode: 404, statusMessage: 'Файл не найден' })
  }
})
