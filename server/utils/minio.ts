import * as Minio from 'minio'
import { randomUUID } from 'node:crypto'

let clientInstance: Minio.Client | null = null

export function getMinioClient() {
  const config = useRuntimeConfig()

  if (!clientInstance) {
    clientInstance = new Minio.Client({
      endPoint: config.minio.endpoint,
      port: Number(config.minio.port) || 9000,
      useSSL: false,
      accessKey: config.minio.accessKey,
      secretKey: config.minio.secretKey,
      pathStyle: true
    })
  }

  return {
    client: clientInstance,
    bucket: config.minio.bucket || 'dnz-uploads'
  }
}

export async function ensureBucket() {
  try {
    const { client, bucket } = getMinioClient()
    const exists = await client.bucketExists(bucket)
    if (!exists) {
      await client.makeBucket(bucket)
      console.log(`[MinIO] Бакет "${bucket}" успешно создан.`)
    }
  } catch (err) {
    console.error('[MinIO] Ошибка проверки/создания бакета:', err)
  }
}

/**
 * Универсальная функция загрузки файла в MinIO
 */
export async function uploadFileToMinio(
  fileBuffer: Buffer,
  originalFilename: string,
  mimeType: string,
  folder = 'avatars'
): Promise<string> {
  await ensureBucket()
  const { client, bucket } = getMinioClient()

  const fileExt = originalFilename.split('.').pop() || 'jpg'
  const objectName = `${folder}/${randomUUID()}.${fileExt}`

  await client.putObject(
    bucket,
    objectName,
    fileBuffer,
    fileBuffer.length,
    { 'Content-Type': mimeType }
  )

  return objectName
}
