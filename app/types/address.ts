import type { ClientUser } from './user'
import type { DeviceItem } from './device'

export interface AddressItem {
  address_id: number
  address_name: string
  created_at?: string | Date
  clients?: ClientUser[]
  devices?: DeviceItem[]
}
