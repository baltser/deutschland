// server/api/client/camera-anpr/numbers.get.ts
interface PassRedisRecord {
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

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const storage = useStorage('redis')
  const keys = await storage.getKeys('pass:')

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

  for (const key of keys) {
    const data = await storage.getItem<PassRedisRecord>(key)
    if (!data) continue

    if (data.status === 'deleting') continue

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

  return {
    active: Array.from(sessionsMap.values())
  }
})
