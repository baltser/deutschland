import * as Minio from 'minio'

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
  const { client, bucket } = getMinioClient()
  const exists = await client.bucketExists(bucket)
  if (!exists) {
    await client.makeBucket(bucket)
    console.log(`[MinIO] Бакет "${bucket}" успешно создан.`)
  }
}
