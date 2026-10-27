import type { addresses, devices } from '@prisma/client'

// Адрес со списком устройств (результат include из Prisma)
export type AddressWithDevices = addresses & {
  devices: devices[]
}

// Ответ эндпоинта загрузки устройств для монтажника
export interface InstallerDevicesResponse {
  success: boolean
  addresses: AddressWithDevices[]
}
