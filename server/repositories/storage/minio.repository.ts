import { randomUUID } from 'node:crypto'
import { getMinioClient, ensureBucket } from '#server/utils/minio'
import { logger } from '#server/utils/logger'

const log = logger.withTag('repository:minio')

export const minioRepository = {
  async upload(fileBuffer: Buffer, originalFilename: string, mimeType: string, folder = 'avatars'): Promise<string> {
    await ensureBucket()
    const { client, bucket } = getMinioClient()

    const fileExt = originalFilename.split('.').pop() || 'jpg'
    const objectName = `${folder}/${randomUUID()}.${fileExt}`

    await client.putObject(bucket, objectName, fileBuffer, fileBuffer.length, { 'Content-Type': mimeType })
    log.success(`Файл сохранен в MinIO: ${objectName}`)
    return objectName
  },

  async remove(objectName: string): Promise<void> {
    if (!objectName) return
    try {
      const { client, bucket } = getMinioClient()
      await client.removeObject(bucket, objectName)
    } catch (err: unknown) {
      log.warn(`Не удалось удалить файл ${objectName}:`, err)
    }
  },

  async getFileStream(filePath: string) {
    const { client, bucket } = getMinioClient()
    const stat = await client.statObject(bucket, filePath)
    const stream = await client.getObject(bucket, filePath)
    return { stat, stream }
  }
}
