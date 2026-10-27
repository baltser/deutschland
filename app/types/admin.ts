import type { UserRole } from './auth'
import type { AddressItem } from './address'
import type { StaffUser, ClientUser } from './user'
import type { DeviceItem } from './device'
import type { EmailTemplate } from './template'

// --- ОТВЕТЫ СПИСКОВ ДЛЯ АДМИНА ---

export interface StaffListResponse {
  success: boolean
  users: StaffUser[]
}

export interface ClientsListResponse {
  success: boolean
  clients: ClientUser[]
}

// --- УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ ([id].patch.ts) ---

export interface UpdateUserBody {
  user_name?: string
  role_name?: UserRole | string
  avatar_path?: string | null
}

export interface AdminUserUpdateResponse {
  success: boolean
  user: StaffUser | ClientUser
}

// --- СОЗДАНИЕ СОТРУДНИКА (index.post.ts) ---

export interface CreateStaffBody {
  phone: string
  user_name?: string
  role_name: 'admin' | 'installer'
}

export interface CreateStaffResponse {
  success: boolean
  user: {
    user_id: number
    user_name: string | null
    phone: string
    role_name: UserRole | string
  }
}

// --- УПРАВЛЕНИЕ АДРЕСАМИ И ОБЪЕКТАМИ ---

export interface AddressesListResponse {
  addresses: AddressItem[]
}

export interface SingleAddressResponse {
  success: boolean
  address: AddressItem
}

export interface CreateAddressBody {
  address_name: string
}

export interface CreateAddressResponse {
  success: boolean
  address: AddressItem
}

export interface AddClientToAddressBody {
  phone: string
  user_name?: string
}

export interface AddClientToAddressResponse {
  success: boolean
  user: ClientUser
}

export interface CreateDeviceBody {
  device_name: string
  device_type?: 'CAMERA' | 'PANEL' | 'BARRIER' | string
  ip?: string | null
  port?: number | null
  login?: string | null
  password?: string | null
}

export interface CreateDeviceResponse {
  success: boolean
  device: DeviceItem
}

// --- EMAIL ШАБЛОНЫ ---

export interface EmailTemplatesListResponse {
  success: boolean
  templates: EmailTemplate[]
}

export interface UpdateEmailTemplateBody {
  title: string
  subject: string
  body_html: string
}

export interface EmailTemplateUpdateResponse {
  success: boolean
  message: string
  template: EmailTemplate
}
