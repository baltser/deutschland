import { getRedisClient } from '~~/server/utils/redis'
import { ensureBucket } from '~~/server/utils/minio'
import { logger } from '~~/server/utils/logger'
import {ensureDefaultRoles} from "#server/utils/roles.ts";
import {ensureDefaultEmailTemplate} from "#server/utils/emailTemplates.ts";

export default defineNitroPlugin(async () => {
  const log = logger.withTag('startup')
  log.success('🚀 Запуск сервера... Проверяем критические сервисы:')

  // 1. Проверка PostgreSQL
  try {
    await prisma.$connect()
    log.info('PostgreSQL (База данных): Подключено успешно')
  } catch (err) {
    log.error('❌ Критическая ошибка: Не удалось подключиться к PostgreSQL.', err)
    throw new Error('Не удалось выполнить действие', { cause: err });
  }

  try {
    await ensureDefaultRoles()
  } catch (err) {
    log.error('❌ Критическая ошибка при инициализации ролей:', { cause: err })
    throw new Error('Startup aborted: Failed to seed roles', { cause: err })
  }

  try {
    await ensureDefaultEmailTemplate()
    log.info('Шаблоны писем: Проверены / инициализированы успешно')
  } catch (err) {
    log.error('❌ Критическая ошибка при инициализации шаблонов писем:', { cause: err })
    throw new Error('Startup aborted: Failed to seed email templates', { cause: err })
  }
  // 2. Проверка Redis
  try {
    const redis = getRedisClient()
    const pong = await redis.ping()
    if (pong === 'PONG') {
      log.info('Redis (Кэш / Токены): Подключено успешно')
    }
  } catch (err) {
    log.error('❌ Критическая ошибка: Не удалось подключиться к Redis.', err)
    throw new Error('Не удалось выполнить действие', { cause: err });
  }

  // 3. Проверка MinIO
  try {
    await ensureBucket()
    log.info('MinIO (Хранилище файлов): Доступно, бакет проверен')
  } catch (err) {
    log.error('❌ Критическая ошибка: Не удалось подключиться к MinIO.', err)
    throw new Error('Не удалось выполнить действие', { cause: err });
  }

  log.success('🎉 Все внешние сервисы запущены и готовы к работе!')
})
