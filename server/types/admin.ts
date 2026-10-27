import type { UserRole } from './auth'
import type { addresses, devices, users, email_templates } from '@prisma/client'

// ==========================================
// 1. БАЗОВЫЕ ПОЛЬЗОВАТЕЛЬСКИЕ ТИПЫ
// ==========================================

/** Базовый профиль пользователя, возвращаемый в админских списках */
export interface AdminUser {
  user_id: number
  user_name: string | null
  email: string | null
  phone: string
  avatar_path: string | null
  activated_at: Date | string | null
  role_name: UserRole | string
}

/** Клиент со списком привязанных адресов (наследует AdminUser) */
export interface AdminClient extends AdminUser {
  addresses: {
    address: addresses
  }[]
}

/** Алиас для сотрудника (использует базовую структуру AdminUser) */
export type AdminStaffMember = AdminUser
export type AdminUserDetail = AdminUser

/** Краткая карточка пользователя (Pick из AdminUser) */
export type AddressClientUser = Pick<AdminUser, 'user_id' | 'user_name' | 'phone' | 'email'>

/** Карточка только что созданного сотрудника (Pick из AdminUser) */
export type CreatedStaffUser = Pick<AdminUser, 'user_id' | 'user_name' | 'phone' | 'role_name'>


// ==========================================
// 2. ТИПЫ АДРЕСОВ И СВЯЗЕЙ (PRISMA HELPER)
// ==========================================

export interface AddressClientRelation {
  user: AddressClientUser
}

/** Адрес со списком клиентов (для общего списка /api/admin/addresses) */
export type AddressWithClients = addresses & {
  clients: AddressClientRelation[]
}

/** Полная структура адреса со всеми привязанными клиентами и устройствами */
export type AddressWithClientsAndDevices = addresses & {
  clients: {
    user: AdminUser
  }[]
  devices: devices[]
}


// ==========================================
// 3. ТЕЛА ЗАПРОСОВ (BODY PAYLOADS)
// ==========================================

export interface UpdateUserBody {
  user_name?: string
  role_name?: UserRole | string
  avatar_path?: string | null
}


// ==========================================
// 4. ТИПЫ ОТВЕТОВ СЕРВЕРА (API RESPONSES)
// ==========================================

export interface ClientsListResponse {
  success: boolean
  clients: AdminClient[]
}

export interface StaffListResponse {
  success: boolean
  users: AdminStaffMember[]
}

export interface AdminUserUpdateResponse {
  success: boolean
  user: AdminUserDetail
}

export interface CreateStaffResponse {
  success: boolean
  user: CreatedStaffUser
}

export interface AddressesListResponse {
  addresses: AddressWithClients[]
}

export interface SingleAddressResponse {
  success: boolean
  address: AddressWithClientsAndDevices
}

export interface CreateAddressResponse {
  success: boolean
  address: addresses
}

export interface CreateDeviceResponse {
  success: boolean
  device: devices
}

export interface AddClientToAddressResponse {
  success: boolean
  user: users
}
export interface EmailTemplatesListResponse {
  success: boolean
  templates: email_templates[]
}

export interface UpdateEmailTemplateBody {
  title: string
  subject: string
  body_html: string
}

export interface EmailTemplateUpdateResponse {
  success: boolean
  message: string
  template: email_templates
}
