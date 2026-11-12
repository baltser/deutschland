import { fileStorageService } from '#server/services/storage/file-storage.service'

export default defineEventHandler(async (event) => {
  const pathParam = getRouterParam(event, 'path')

  if (!pathParam) {
    throw createError({ statusCode: 400, statusMessage: 'Путь к файлу не указан' })
  }

  const { stat, stream } = await fileStorageService.getFileStream(pathParam)

  setResponseHeaders(event, {
    'Content-Type': stat.metaData['content-type'] || 'application/octet-stream',
    'Content-Length': stat.size.toString(),
    'Cache-Control': 'public, max-age=31536000, immutable'
  })

  return sendStream(event, stream)
})
