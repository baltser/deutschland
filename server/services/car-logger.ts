// server/services/car-logger.ts
import { join } from 'node:path'
import fs from 'fs'
import pino from 'pino'

const logDir = join(process.cwd(), 'logs')
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true })
}

const isDev = process.env.NODE_ENV === 'development'
const logLevel = isDev ? 'debug' : 'info'

const transports = pino.transport({
  targets: [
    ...(isDev ? [{
      target: 'pino-pretty',
      level: logLevel,
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname'
      }
    }] : []),
    {
      target: 'pino-roll',
      level: logLevel,
      options: {
        file: join(logDir, 'car-numbers'),
        size: '10m',
        mkdir: true,
        limit: { count: 7 }
      }
    }
  ]
})

const baseLogger = pino({ level: logLevel }, transports)

// Расширяем типы recordId и userId, чтобы они могли принимать string или number
export interface CarAuditMeta {
  userId?: number | string | null
  recordId?: number | string | null
  deviceId?: number | null
  addressId?: number | null
  carNumber?: string | null
  comment?: string | null
  hours?: number
  [key: string]: unknown // Убрали any по нашему договору!
}

export const carLogger = {
  audit: (action: 'add' | 'delete' | 'expire' | 'system', message: string, meta: CarAuditMeta) => {
    baseLogger.info(
      {
        action,
        userId: meta.userId != null ? Number(meta.userId) : undefined,
        recordId: meta.recordId != null ? meta.recordId : undefined,
        deviceId: meta.deviceId != null ? Number(meta.deviceId) : undefined,
        addressId: meta.addressId != null ? Number(meta.addressId) : undefined,
        carNumber: meta.carNumber ? String(meta.carNumber).toUpperCase() : undefined,
        comment: meta.comment || undefined,
        ...meta
      },
      message
    )
  },

  info: (message: string, meta?: CarAuditMeta) => {
    baseLogger.info(meta || {}, message)
  },

  warn: (message: string, meta?: CarAuditMeta) => {
    baseLogger.warn(meta || {}, message)
  },

  debug: (message: string, meta?: CarAuditMeta) => {
    baseLogger.debug(meta || {}, message)
  },

  error: (message: string, error?: Error | string, meta?: CarAuditMeta) => {
    const errorMeta = {
      ...meta,
      ...(error && { error: error instanceof Error ? error.message : error }),
      ...(error instanceof Error && error.stack && { stack: error.stack })
    }
    baseLogger.error(errorMeta, message)
  },

  withTag: (tag: string) => {
    const child = baseLogger.child({ tag })
    return {
      info: (msg: string, meta?: CarAuditMeta) => child.info(meta || {}, msg),
      success: (msg: string, meta?: CarAuditMeta) => child.info(meta || {}, msg),
      warn: (msg: string, meta?: CarAuditMeta) => child.warn(meta || {}, msg),
      debug: (msg: string, meta?: CarAuditMeta) => child.debug(meta || {}, msg),
      error: (msg: string, error?: Error | string, meta?: CarAuditMeta) => {
        const errorMeta = {
          ...meta,
          ...(error && { error: error instanceof Error ? error.message : error }),
          ...(error instanceof Error && error.stack && { stack: error.stack })
        }
        child.error(errorMeta, msg)
      }
    }
  }
}
