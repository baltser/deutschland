import Redis from 'ioredis'
import {logger} from "#server/utils/logger.ts";

let redisClient: Redis | null = null
const log = logger.withTag('redis')

export function getRedisClient(): Redis {
  const config = useRuntimeConfig()

  if (!redisClient) {
    redisClient = new Redis({
      host: config.redis.host,
      port: Number(config.redis.port),
      retryStrategy(times) {
        // Экспоненциальная задержка при переподключении (максимум 2 секунды)
        return Math.min(times * 50, 2000)
      }
    })

    redisClient.on('connect', () => {
      log.info('Успешное подключение к серверу')
    })

    redisClient.on('error', (err) => {
      log.error('[Redis Error]:', err)
    })
  }

  return redisClient
}
