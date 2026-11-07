// server/utils/device-api.ts
import { getDeviceConfig } from '~~/server/utils/db/device-config'

export interface DeviceApiOptions {
  method?: 'GET' | 'POST'
  body?: Record<string, unknown> | BodyInit | null | undefined
}

export interface DeviceApiResponse<T = unknown> {
  status: number
  data?: T
  error?: string
}

interface FetchErrorResponse {
  message?: string
  response?: {
    status?: number
  }
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

  // Убираем случайный префикс api/proxy/, если он где-то остался
  endpoint = endpoint.replace(/^api\/proxy\//, '')

  if (endpoint.startsWith('/')) {
    endpoint = endpoint.slice(1)
  }

  // Получаем конфигурацию устройства исключительно из базы данных PostgreSQL
  const device = await getDeviceConfig(deviceId)

  if (!device || !device.ip || !device.port) {
    const errorMsg = `Устройство #${deviceId} не найдено в базе данных или для него не заданы IP/порт`
    console.error(`[Device API] ${errorMsg}`)
    return {
      status: 404,
      error: errorMsg
    }
  }

  const targetUrl = `http://${device.ip}:${device.port}/${endpoint}`

  // Формируем заголовки авторизации (Basic Auth), если они указаны в базе
  const headers: Record<string, string> = {}
  if (device.login && device.password) {
    headers['Authorization'] = 'Basic ' + Buffer.from(`${device.login}:${device.password}`).toString('base64')
  }

  try {
    const response = await $fetch(targetUrl, {
      method,
      body: options.body,
      headers: Object.keys(headers).length > 0 ? headers : undefined,
    })

    return {
      status: 200,
      data: response
    }
  } catch (error: unknown) {
    const err = error as FetchErrorResponse
    const errorMessage = err.message || 'Ошибка соединения с физическим устройством'
    const errorStatus = err.response?.status || 500

    console.error(`[Device API] Ошибка запроса к устройству #${deviceId} по адресу (${targetUrl}):`, errorMessage)
    return {
      status: errorStatus,
      error: errorMessage
    }
  }
}
