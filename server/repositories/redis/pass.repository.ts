export interface PassRedisRecord {
  id: string | number
  recordId?: number | string
  deviceId: number
  addressId?: number | null
  userId?: number
  carNumber: string
  comment?: string | null
  expiresAt: string
  status: string
  errorMessage?: string
}

export const passRepository = {
  /**
   * Получить конкретный пропуск из Redis по ключу устройства и номера
   */
  async getPass(deviceId: number, carNumber: string): Promise<PassRedisRecord | null> {
    const storage = useStorage('redis')
    const key = `pass:${deviceId}:${carNumber.toUpperCase()}`
    return await storage.getItem<PassRedisRecord>(key)
  },

  /**
   * Сохранить пропуск в Redis
   */
  async savePass(deviceId: number, carNumber: string, data: PassRedisRecord) {
    const storage = useStorage('redis')
    const key = `pass:${deviceId}:${carNumber.toUpperCase()}`
    await storage.setItem(key, data)
  },

  /**
   * Удалить пропуск из Redis
   */
  async removePass(deviceId: number, carNumber: string) {
    const storage = useStorage('redis')
    const key = `pass:${deviceId}:${carNumber.toUpperCase()}`
    await storage.removeItem(key)
  },

  /**
   * Удалить пропуск по прямому ключу (если ключ уже известен)
   */
  async removeByKey(key: string) {
    const storage = useStorage('redis')
    await storage.removeItem(key)
  },

  /**
   * Получить все активные ключи пропусков для отрисовки списка
   */
  async getAllActivePasses(): Promise<{ key: string; data: PassRedisRecord }[]> {
    const storage = useStorage('redis')
    const keys = await storage.getKeys('pass:')

    const results: { key: string; data: PassRedisRecord }[] = []

    for (const key of keys) {
      const data = await storage.getItem<PassRedisRecord>(key)
      if (data) {
        results.push({ key, data })
      }
    }

    return results
  }
}
