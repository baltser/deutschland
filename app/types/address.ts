import type { DeviceItem } from './device'

export interface AddressItem {
  address_id: number
  address_name: string
  created_at?: string | Date
  devices?: Array<DeviceItem>
  _count?: {
    clients: number
    devices: number
  }
}
