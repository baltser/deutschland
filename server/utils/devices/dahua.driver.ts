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

/** Добавление пропуска на Dahua с полным логированием ответа */
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
    // 1. Фабрика
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
    if (objId === undefined) return { success: false, error: 'Ошибка фабрики Dahua' }

    // 2. Вставка
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

    // 💡 Пишем в системный логгер, чтобы точно увидеть JSON ответа камеры при вставке
    log.info(`[Dahua #${deviceId}] РЕЗУЛЬТАТ ВСТАВКИ (RAW):`, { insertData: JSON.stringify(insertData) })

    // 3. Уничтожение объекта фабрики
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

    // 💡 Исправленное извлечение recno (сначала проверяем params, где камера реально отдает recno)
    const resParams = insertData?.params
    const resObj = insertData?.result
    let recno: number | string | undefined = undefined

    if (typeof resParams === 'object' && resParams !== null) {
      recno = resParams.recno ?? resParams.RecNo ?? resParams.ID ?? resParams.id
    }

    if (recno === undefined && typeof resObj === 'object' && resObj !== null) {
      recno = resObj.RecNo ?? resObj.recno ?? resObj.ID ?? resObj.id ?? resObj.Index ?? resObj.index
    }

    if (recno === undefined && typeof resObj !== 'boolean') {
      recno = resObj
    }

    log.info(`[Dahua #${deviceId}] Распознанный recno для номера ${carNumber}: ${recno}`, { recno, type: typeof recno })

    return { success: true, recno }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    log.error(`[Dahua #${deviceId}] Ошибка в addDahuaPass: ${errorMsg}`)
    return { success: false, error: errorMsg }
  }
}

/** Удаление пропуска с Dahua по recno с логированием ответа */
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
    // 1. Фабрика
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
    if (objId === undefined) return { success: false, error: 'Ошибка фабрики Dahua при удалении' }

    log.info(`[Dahua #${deviceId}] Отправка запроса удаления для recno: ${recno} (тип: ${typeof recno})`)

    // 2. Удаление по recno (принудительно приводим к Number)
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

    // 💡 Логируем ответ камеры на удаление
    log.info(`[Dahua #${deviceId}] РЕЗУЛЬТАТ УДАЛЕНИЯ (RAW):`, { removeData: JSON.stringify(removeData) })

    // 3. Уничтожение объекта
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
      log.error(`[Dahua #${deviceId}] Камера вернула ошибку при удалении: ${removeData.error}`)
      return { success: false, error: removeData.error.message || 'Ошибка удаления на Dahua' }
    }

    return { success: true }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    log.error(`[Dahua #${deviceId}] Ошибка в removeDahuaPass: ${errorMsg}`)
    return { success: false, error: errorMsg }
  }
}
