// server/services/client-logger.ts
import { join } from 'node:path'
import fs from 'node:fs'
import pino from 'pino'

const logDir = join(process.cwd(), 'logs')
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true })
}

// Настраиваем независимый транспорт с ротацией для клиентов
const clientTransport = pino.transport({
  target: 'pino-roll',
  options: {
    file: join(logDir, 'client-passes'),
    size: '10m',          // Ротация по достижении 10 МБ
    mkdir: true,
    limit: { count: 7 }   // Хранить только последние 7 файлов (автоочистка старых)
  }
})

const clientBaseLogger = pino({ level: 'info' }, clientTransport)

export interface ClientHistoryRecord {
  userId: number | string
  carNumber: string
  deviceId: number
  addressId?: number | null
  action: string
  status: string
  label: string
  comment?: string | null
  recordId?: string | number | null
  error?: string
}

export const clientLogger = {
  logEvent: (record: ClientHistoryRecord) => {
    clientBaseLogger.info(
      {
        userId: Number(record.userId),
        carNumber: String(record.carNumber).toUpperCase(),
        deviceId: Number(record.deviceId),
        addressId: record.addressId ? Number(record.addressId) : null,
        action: record.action,
        status: record.status,
        label: record.label,
        comment: record.comment || null,
        recordId: record.recordId ?? null,
        ...(record.error && { error: record.error })
      },
      `Client pass event: ${record.action} for ${record.carNumber}`
    )
  }
}
