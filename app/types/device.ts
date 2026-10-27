import type { AddressItem } from "~/types/address.ts"

export type DeviceType = 'CAMERA' | 'PANEL' | 'BARRIER' | string

export interface DeviceItem {
  device_id: number
  device_name: string
  device_type: DeviceType
  ip: string | null
  port: number | null
  login: string | null
  password?: string | null
  address_id: number
}

// Ответ эндпоинта /api/installer/devices.get.ts
export interface InstallerDevicesResponse {
  success: boolean
  addresses: AddressItem[]
}
