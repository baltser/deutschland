import DigestFetch from 'digest-fetch'
import { deviceRepository } from '#server/repositories/prisma/device.repository.ts'

export interface DeviceApiOptions {
  method?: 'GET' | 'POST'
  body?: Record<string, unknown> | BodyInit | null | undefined
}

export interface DeviceApiResponse<T = unknown> {
  status: number
  data?: T
  error?: string
}

export async function callDeviceEndpoint(
  deviceId: number,
  endpointParam: string,
  options: DeviceApiOptions = {}
): Promise<DeviceApiResponse> {
  const method = options.method || 'GET'

  // Восстанавливаем слэши и знаки вопроса из символов __ и ~
  let endpoint = endpointParam
    .replace(/__/g, '/')
    .replace(/~/g, '?')

  endpoint = endpoint.replace(/^api\/proxy\//, '')

  if (endpoint.startsWith('/')) {
    endpoint = endpoint.slice(1)
  }

  // Получаем конфигурацию устройства напрямую из репозитория Prisma
  const device = await deviceRepository.findById(deviceId)

  if (!device || !device.ip || !device.port) {
    const errorMsg = `Устройство #${deviceId} не найдено в базе данных или для него не заданы IP/порт`
    console.error(`[Device API] ${errorMsg}`)
    return {
      status: 404,
      error: errorMsg
    }
  }

  const targetUrl = `http://${device.ip}:${device.port}/${endpoint}`

  try {
    // Используем Digest Authentication, как в рабочем старом коде
    const username = device.login || 'admin'
    const password = device.password || ''

    const client = new DigestFetch(username, password, { basic: false })

    const headers: Record<string, string> = {}
    let requestBody: string | undefined = undefined

    // Если передано тело, формируем urlencoded запрос
    if (options.body && typeof options.body === 'object') {
      headers['Content-Type'] = 'application/x-www-form-urlencoded'
      const params = new URLSearchParams()
      for (const [key, value] of Object.entries(options.body)) {
        if (value !== undefined && value !== null) {
          params.append(key, String(value))
        }
      }
      requestBody = params.toString()
    }

    console.log(`[Device API] Запрос к камере #${deviceId} (${targetUrl}) методом ${method}`);

    const response = await client.fetch(targetUrl, {
      method,
      headers,
      body: requestBody
    })

    const responseText = await response.text()

    if (!response.ok) {
      throw new Error(`Камера вернула статус ${response.status}: ${responseText}`)
    }

    return {
      status: 200,
      data: responseText
    }
  } catch (error: unknown) {
    const err = error as Error
    const errorMessage = err.message || 'Ошибка соединения с физическим устройством'

    console.error(`[Device API] Ошибка запроса к устройству #${deviceId} по адресу (${targetUrl}):`, errorMessage)
    return {
      status: 500,
      error: errorMessage
    }
  }
}
