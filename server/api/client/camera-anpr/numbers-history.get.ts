// server/api/client/camera-anpr/numbers-history.ts
import fs from 'node:fs'
import path from 'node:path'
import readline from 'node:readline'

interface RawLogEvent {
  time: number
  carNumber: string
  deviceId: number
  addressId?: number
  action?: string
  status?: string
  label?: string
  comment?: string | null
  recordId?: number | string
  userId?: number | string
}

interface ParsedLogLine {
  time?: number
  carNumber?: string
  deviceId?: number
  addressId?: number
  action?: string
  status?: string
  label?: string
  comment?: string | null
  recordId?: number | string
  userId?: number | string
  msg?: string
  [key: string]: unknown
}

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const userId = Number(session.user.user_id)
  if (!userId) {
    throw createError({ statusCode: 400, statusMessage: 'Bad Request: userId not found' })
  }

  const logsDir = path.resolve(process.cwd(), 'logs')
  if (!fs.existsSync(logsDir)) {
    return { logs: [] }
  }

  const logFiles = fs.readdirSync(logsDir)
    .filter(file => file.startsWith('client-passes'))
    .map(file => path.join(logsDir, file))

  const rawEvents: RawLogEvent[] = []

  for (const filePath of logFiles) {
    if (!fs.statSync(filePath).isFile()) continue

    const fileStream = fs.createReadStream(filePath)
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity })

    for await (const line of rl) {
      try {
        if (!line.trim()) continue
        const entry = JSON.parse(line) as ParsedLogLine

        const logData = entry.msg?.includes('Client pass event') ? entry : (entry.userId ? entry : entry)
        const targetUserId = logData.userId || entry.userId

        if (targetUserId && Number(targetUserId) === userId) {
          rawEvents.push({
            time: Number(logData.time || entry.time || Date.now()),
            carNumber: String(logData.carNumber || entry.carNumber || ''),
            deviceId: Number(logData.deviceId || entry.deviceId || 0),
            addressId: logData.addressId || entry.addressId ? Number(logData.addressId || entry.addressId) : undefined,
            action: String(logData.action || entry.action || ''),
            status: String(logData.status || entry.status || ''),
            label: String(logData.label || entry.label || ''),
            comment: (logData.comment || entry.comment || null) as string | null,
            recordId: logData.recordId || entry.recordId
          })
        }
      } catch {
        // Игнорируем невалидные строки
      }
    }
  }

  interface SessionItem {
    time: number
    createdAt: number
    expiresAt: number
    carNumber: string
    comment: string | null
    addressId: number | null
    devicesStatus: Record<string, { status: string; label: string }>
  }

  const sessionsMap = new Map<string, SessionItem>()

  rawEvents.sort((a, b) => a.time - b.time)

  for (const ev of rawEvents) {
    const carNum = ev.carNumber
    const deviceId = ev.deviceId
    if (!carNum || !deviceId) continue

    let rawRecordId = ev.recordId || ev.time || undefined
    if (typeof rawRecordId === 'string' && rawRecordId.includes('_')) {
      rawRecordId = rawRecordId.split('_')[0]
    }

    const timeBucket = Math.floor(Number(rawRecordId) / 60000)
    const sessionKey = `${carNum}_${timeBucket}`

    if (!sessionsMap.has(sessionKey)) {
      const baseRecordId = String(rawRecordId)
      const createdAt = Number(baseRecordId.split('_')[0]) || ev.time

      sessionsMap.set(sessionKey, {
        time: ev.time,
        createdAt,
        expiresAt: ev.time,
        carNumber: carNum,
        comment: ev.comment || null,
        addressId: ev.addressId ? Number(ev.addressId) : null,
        devicesStatus: {}
      })
    }

    const currentSession = sessionsMap.get(sessionKey)!

    if (ev.time > currentSession.expiresAt) {
      currentSession.expiresAt = ev.time
    }
    if (ev.time > currentSession.time) {
      currentSession.time = ev.time
    }

    currentSession.devicesStatus[deviceId] = {
      status: ev.status || 'success',
      label: ev.label || 'Обработано'
    }
  }

  const historyLogs = Array.from(sessionsMap.values())
    .sort((a, b) => b.time - a.time)

  return {
    logs: historyLogs
  }
})
