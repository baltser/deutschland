import { LRUCache } from 'lru-cache'

interface QueueOptions {
  maxConcurrent?: number // Максимум одновременных запросов (по умолчанию 3)
  ttlMs?: number         // Время жизни кэша в миллисекундах (по умолчанию 30 секунд)
  maxCacheSize?: number  // Максимум элементов в кэше (по умолчанию 100)
}

export class DeviceQueueManager {
  private queue: Array<() => void> = []
  private activeCount = 0
  private readonly maxConcurrent: number
  // Используем any для LRUCache, чтобы обертка оставалась полностью гибкой для любых типов T
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private cache: LRUCache<string, any>

  constructor(options: QueueOptions = {}) {
    this.maxConcurrent = options.maxConcurrent ?? 3
    this.cache = new LRUCache({
      max: options.maxCacheSize ?? 100,
      ttl: options.ttlMs ?? 30 * 1000 // 30 секунд по умолчанию
    })
  }

  /**
   * Выполнить задачу с учетом лимита параллелизма и кэширования
   */
  async run<T>(cacheKey: string, fn: () => Promise<T>): Promise<T> {
    // 1. Проверяем кэш
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey) as T
    }

    // 2. Ограничиваем параллелизм («светофор»)
    if (this.activeCount >= this.maxConcurrent) {
      await new Promise<void>((resolve) => {
        this.queue.push(resolve)
      })
    }

    this.activeCount++

    try {
      // Выполняем саму функцию (например, запрос к камере)
      const result = await fn()

      // Сохраняем успешный или неудачный результат в кэш
      this.cache.set(cacheKey, result)
      return result
    } finally {
      this.activeCount--
      if (this.queue.length > 0) {
        const next = this.queue.shift()
        if (next) next()
      }
    }
  }

  /**
   * Принудительно очистить кэш (например, если пользователь нажал кнопку «Обновить»)
   */
  clearCache(): void {
    this.cache.clear()
  }
}

// Экспортируем готовый синглтон для работы с устройствами
export const deviceQueue = new DeviceQueueManager({
  maxConcurrent: 3, // Не более 3 запросов к камерам одновременно
  ttlMs: 30 * 1000  // Кэшируем статус на 30 секунд
})
