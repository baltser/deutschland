import { passRepository } from '#server/repositories/redis/pass.repository'

export const passQueryService = {
  /**
   * Получение и группировка активных пропусков для отображения клиенту
   */
  async getActivePassesGrouped() {
    const activePasses = await passRepository.getAllActivePasses()

    interface GroupRecord {
      id: string | number
      deviceId: number
      status: string
      errorMessage?: string
    }

    interface SessionGroup {
      carNumber: string
      comment: string | null
      expiresAt: string
      records: GroupRecord[]
    }

    const sessionsMap = new Map<string, SessionGroup>()

    for (const item of activePasses) {
      const data = item.data
      if (!data || data.status === 'deleting') continue

      const groupKey = `${data.carNumber}_${data.recordId || data.expiresAt}`

      if (!sessionsMap.has(groupKey)) {
        sessionsMap.set(groupKey, {
          carNumber: data.carNumber,
          comment: data.comment || null,
          expiresAt: data.expiresAt,
          records: []
        })
      }

      const sessionItem = sessionsMap.get(groupKey)!
      sessionItem.records.push({
        id: data.id,
        deviceId: data.deviceId,
        status: data.status,
        errorMessage: data.errorMessage
      })
    }

    return Array.from(sessionsMap.values())
  }
}
