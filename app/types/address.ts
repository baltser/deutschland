import type { AddressClientRelation } from './user'
import type { DeviceItem } from './device'

export interface AddressItem {
  address_id: number
  address_name: string
  created_at?: string | Date
  clients?: AddressClientRelation[]
  devices?: DeviceItem[]
}
