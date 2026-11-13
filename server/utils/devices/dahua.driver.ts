import crypto from 'node:crypto'
import { deviceRepository } from '#server/repositories/prisma/device.repository'
import { carLogger } from '#server/services/car-logger'

const log = carLogger.withTag('dahua:driver')

function md5Upper(text: string): string {
  return crypto.createHash('md5').update(text).digest('hex').toUpperCase()
}

export async function getDahuaSession(deviceId: number) {
  const device = await deviceRepository.findById(deviceId)
  if (!device || !device.ip || !device.port) return null

  const baseUrl = `http://${device.ip}:${device.port}`
  const username = device.login || 'admin'
  const password = device.password || ''

  try {
    const loginRes = await fetch(`${baseUrl}/RPC2_Login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 1,
        method: 'global.login',
        params: { userName: username, password: '', clientType: 'Web3.0' }
      })
    })

    if (!loginRes.ok) return null
    const loginData = await loginRes.json()
    const realm = loginData?.params?.realm
    const tempSession = loginData?.session

    if (!realm || !tempSession) return null

    const passwordHash = md5Upper(`${username}:${realm}:${password}`)
    const authRes = await fetch(`${baseUrl}/RPC2_Login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 2,
        method: 'global.login',
        params: { userName: username, password: passwordHash, clientType: 'Web3.0' },
        session: tempSession
      })
    })

    if (!authRes.ok) return null
    const authData = await authRes.json()
    const sessionId = authData?.session

    if (!sessionId) return null

    return { sessionId, baseUrl }
  } catch {
    return null
  }
}

/** Добавление пропуска на Dahua */
export async function addDahuaPass(
  deviceId: number,
  carNumber: string,
  beginTime: string,
  cancelTime: string,
  masterName = 'system'
): Promise<{ success: boolean; recno?: number | string; error?: string }> {
  const session = await getDahuaSession(deviceId)
  if (!session) return { success: false, error: 'Не удалось получить сессию Dahua' }

  const url = `${session.baseUrl}/RPC2`
  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64)',
    'Referer': `${session.baseUrl}/`
  }

  try {
    // 1. Создание фабрики для TrafficRedList
    const factoryRes = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        method: 'RecordUpdater.factory.instance',
        params: { name: 'TrafficRedList' },
        id: 143,
        session: session.sessionId
      })
    })
    const factoryData = await factoryRes.json()
    const objId = factoryData?.result

    if (objId === undefined) {
      return { success: false, error: 'Ошибка фабрики Dahua' }
    }

    // 2. Вставка записи
    const insertRes = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        method: 'RecordUpdater.insert',
        params: {
          record: {
            PlateNumber: carNumber,
            MasterOfCar: masterName,
            CardID: '',
            BeginTime: beginTime,
            CancelTime: cancelTime,
            Department: ' ',
            TelephoneNumber: ' '
          }
        },
        id: 144,
        session: session.sessionId,
        object: objId
      })
    })
    const insertData = await insertRes.json()

    // 3. Обязательное уничтожение объекта фабрики
    await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        method: 'RecordUpdater.destroy',
        params: null,
        id: 145,
        session: session.sessionId,
        object: objId
      })
    })

    if (insertData.error) {
      return { success: false, error: insertData.error.message || 'Ошибка вставки на Dahua' }
    }

    // Точное извлечение recno из params
    const recno = insertData?.params?.recno

    if (recno === undefined) {
      log.warn(`[Dahua #${deviceId}] Запись добавлена, но камера не вернула recno в params:`, { insertData })
    }

    log.info(`[Dahua #${deviceId}] Успешно добавлен номер ${carNumber}, получен recno: ${recno}`)

    return { success: true, recno }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    log.error(`[Dahua #${deviceId}] Ошибка в addDahuaPass: ${errorMsg}`)
    return { success: false, error: errorMsg }
  }
}

/** Удаление пропуска с Dahua по recno */
export async function removeDahuaPass(deviceId: number, recno: number | string): Promise<{ success: boolean; error?: string }> {
  const session = await getDahuaSession(deviceId)
  if (!session) return { success: false, error: 'Не удалось получить сессию Dahua' }

  const url = `${session.baseUrl}/RPC2`
  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64)',
    'Referer': `${session.baseUrl}/`
  }

  try {
    // 1. Создание фабрики для удаления
    const factoryRes = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        method: 'RecordUpdater.factory.instance',
        params: { name: 'TrafficRedList' },
        id: 118,
        session: session.sessionId
      })
    })
    const factoryData = await factoryRes.json()
    const objId = factoryData?.result

    if (objId === undefined) {
      return { success: false, error: 'Ошибка фабрики Dahua при удалении' }
    }

    // 2. Удаление записи по точному recno (как в дампе Burp Suite)
    const removeRes = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        method: 'RecordUpdater.remove',
        params: { recno: Number(recno) },
        id: 119,
        session: session.sessionId,
        object: objId
      })
    })
    const removeData = await removeRes.json()

    // 3. Уничтожение объекта фабрики
    await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        method: 'RecordUpdater.destroy',
        params: null,
        id: 120,
        session: session.sessionId,
        object: objId
      })
    })

    if (removeData.error) {
      log.error(`[Dahua #${deviceId}] Камера вернула ошибку при удалении:`, removeData.error)
      return { success: false, error: removeData.error.message || 'Ошибка удаления на Dahua' }
    }

    log.info(`[Dahua #${deviceId}] Успешно удалена запись с recno: ${recno}`)
    return { success: true }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    log.error(`[Dahua #${deviceId}] Ошибка в removeDahuaPass: ${errorMsg}`)
    return { success: false, error: errorMsg }
  }
}
