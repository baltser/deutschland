import { getRedisClient } from '#server/utils/redis'

export const tokenRepository = {
  // --- Регистрация / uCaller (pending_reg) ---
  async setPendingRegistration(phone: string, data: object, ttlSeconds: number = 360) {
    const redis = getRedisClient()
    await redis.set(`pending_reg:${phone}`, JSON.stringify(data), 'EX', ttlSeconds)
  },

  async getPendingRegistration<T>(phone: string): Promise<T | null> {
    const redis = getRedisClient()
    const raw = await redis.get(`pending_reg:${phone}`)
    return raw ? JSON.parse(raw) as T : null
  },

  async deletePendingRegistration(phone: string) {
    const redis = getRedisClient()
    await redis.del(`pending_reg:${phone}`)
  },

  // --- Подтверждение Email (verify-email) ---
  async setEmailVerificationToken(token: string, userId: number, ttlSeconds: number = 86400) {
    const redis = getRedisClient()
    await redis.set(`verify-email:${token}`, String(userId), 'EX', ttlSeconds)
  },

  async getUserIdByEmailToken(token: string): Promise<number | null> {
    const redis = getRedisClient()
    const userIdStr = await redis.get(`verify-email:${token}`)
    return userIdStr ? Number(userIdStr) : null
  },

  async deleteEmailVerificationToken(token: string) {
    const redis = getRedisClient()
    await redis.del(`verify-email:${token}`)
  },

  // --- Сброс пароля (reset-password) ---
  async setPasswordResetToken(token: string, userId: number, ttlSeconds: number = 3600) {
    const redis = getRedisClient()
    await redis.set(`reset-password:${token}`, String(userId), 'EX', ttlSeconds)
  },

  async getUserIdByResetToken(token: string): Promise<number | null> {
    const redis = getRedisClient()
    const userIdStr = await redis.get(`reset-password:${token}`)
    return userIdStr ? Number(userIdStr) : null
  }
}
