import type { Worker, Queue } from 'bullmq'
import { logger } from './logger'

const log = logger.withTag('bullmq:core')

// Реестр всех активных воркеров и очередей для graceful shutdown
const activeWorkers: Worker[] = []
const activeQueues: Queue[] = []

// Единая конфигурация подключения к Redis для BullMQ (обязательно maxRetriesPerRequest: null)
export function getBullMQConnection() {
  return {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: Number(process.env.REDIS_PORT) || 6379,
    maxRetriesPerPoint: 10,
    maxRetriesPerRequest: null,
  }
}

// Регистрация воркера для автоматического закрытия при остановке сервера
export function registerWorker(worker: Worker) {
  activeWorkers.push(worker)
}

// Регистрация очереди
export function registerQueue(queue: Queue) {
  activeQueues.push(queue)
}

// Глобальная функция остановки (вызывается из startup-плагина)
export async function closeAllBullMQ() {
  log.info('🛑 Остановка всех очередей и воркеров BullMQ...')

  for (const worker of activeWorkers) {
    await worker.close().catch((err) => log.error('Ошибка закрытия воркера:', err))
  }

  for (const queue of activeQueues) {
    await queue.close().catch((err) => log.error('Ошибка закрытия очереди:', err))
  }

  log.success('Все соединения BullMQ успешно закрыты')
}
