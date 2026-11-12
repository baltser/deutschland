import * as Minio from 'minio'
import { logger } from '#server/utils/logger'

let clientInstance: Minio.Client | null = null

export function getMinioClient() {
  const config = useRuntimeConfig()
  const log = logger.withTag('minio:client')

  if (!clientInstance) {
    clientInstance = new Minio.Client({
      endPoint: config.minio.endpoint,
      port: Number(config.minio.port) || 9000,
      useSSL: false,
      accessKey: config.minio.accessKey,
      secretKey: config.minio.secretKey,
      pathStyle: true
    })
    log.info('MinIO клиент успешно инициализирован')
  }

  return {
    client: clientInstance,
    bucket: config.minio.bucket || 'dnz-uploads'
  }
}

export async function ensureBucket() {
  const log = logger.withTag('minio:ensureBucket')

  try {
    const { client, bucket } = getMinioClient()
    const exists = await client.bucketExists(bucket)
    if (!exists) {
      await client.makeBucket(bucket)
      log.info(`[MinIO] Бакет "${bucket}" успешно создан.`)
    }
  } catch (err) {
    log.error('[MinIO] Ошибка проверки/создания бакета:', err)
    throw err
  }
}
