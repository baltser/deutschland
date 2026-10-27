import type { addresses, devices } from '@prisma/client'

// Адрес клиента, содержащий массив доступных ему устройств
export type ClientAddressWithDevices = addresses & {
  devices: devices[]
}

// Ответ эндпоинта загрузки объектов (адресов) клиента
export interface ClientAddressesResponse {
  success: boolean
  addresses: ClientAddressWithDevices[]
}
