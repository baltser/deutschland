import Redis from 'ioredis'
import { logger } from '#server/utils/logger'

let redisClient: Redis | null = null
const log = logger.withTag('redis')

export function getRedisClient(): Redis {
  const config = useRuntimeConfig()

  if (!redisClient) {
    const host = config.redis?.host || process.env.REDIS_HOST || 'redis'
    const port = Number(config.redis?.port || process.env.REDIS_PORT || 6379)

    redisClient = new Redis({
      host,
      port,
      retryStrategy(times) {
        // Экспоненциальная задержка при переподключении (максимум 2 секунды)
        return Math.min(times * 50, 2000)
      }
    })

    redisClient.on('connect', () => {
      log.info(`Успешное подключение к серверу (${host}:${port})`)
    })

    redisClient.on('error', (err) => {
      log.error('[Redis Error]:', err)
    })
  }

  return redisClient
}
