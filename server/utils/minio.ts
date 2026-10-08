import * as Minio from 'minio'

const config = useRuntimeConfig()

export const minioClient = new Minio.Client({
  endPoint: config.minio.endpoint,
  port: config.minio.port,
  useSSL: config.minio.useSSL,
  accessKey: config.minio.accessKey,
  secretKey: config.minio.secretKey
})

export const BUCKET_NAME = config.minio.bucket

export async function ensureBucket() {
  const exists = await minioClient.bucketExists(BUCKET_NAME)
  if (!exists) {
    await minioClient.makeBucket(BUCKET_NAME)
    console.log(`[MinIO] Бакет "${BUCKET_NAME}" успешно создан.`)
  }
}
