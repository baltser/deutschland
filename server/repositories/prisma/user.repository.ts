import { prisma } from '#server/utils/prisma'
import type { Prisma, UserRole } from '@prisma/client'

export interface FindClientsParams {
  page?: number
  limit?: number
  search?: string
  addressId?: number | null
}

export const userRepository = {
  /** Поиск пользователя по ID */

  async findById(userId: number) {
    return prisma.users.findUnique({
      where: { user_id: userId }
    })
  },

  /** Поиск пользователя по номеру телефона */
  async findByPhone(phone: string) {
    return prisma.users.findUnique({
      where: { phone }
    })
  },

  async findByEmail(email: string) {
    return prisma.users.findUnique({
      where: { email }
    })
  },
  /** Универсальный метод получения списка пользователей (сотрудников или по ролям) */

  async findUserList(roles?: UserRole[]) {
    const whereCondition = roles && roles.length > 0
      ? { role_name: { in: roles } }
      : { role_name: { not: 'client' as UserRole } }

    return prisma.users.findMany({
      where: whereCondition,
      select: {
        user_id: true,
        user_name: true,
        email: true,
        phone: true,
        avatar_path: true,
        activated_at: true,
        role_name: true
      },
      orderBy: {
        user_id: 'desc',
      },
    })
  },

  /** Получение списка клиентов с пагинацией, поиском и фильтрацией по адресу (перенесено из clients.get.ts) */

  async findClientsPaginated(params: FindClientsParams) {
    const page = params.page || 1
    const limit = params.limit || 20
    const search = params.search ? params.search.trim() : ''
    const addressId = params.addressId || null

    // Исправленный расчет skip с правильным умножением
    const skip = (page - 1) * limit

    const where: Prisma.usersWhereInput = {
      role_name: 'client',
    }

    if (search) {
      where.OR = [
        { user_name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (addressId) {
      where.addresses = {
        some: {
          address_id: addressId
        }
      }
    }

    const [clients, total] = await Promise.all([
      prisma.users.findMany({
        where,
        skip,
        take: limit,
        orderBy: { user_id: 'desc' },
        select: {
          user_id: true,
          user_name: true,
          phone: true,
          email: true,
          avatar_path: true,
          activated_at: true,
          addresses: {
            select: {
              address: {
                select: { address_id: true, address_name: true }
              }
            }
          }
        }
      }),
      prisma.users.count({ where })
    ])

    return {
      clients,
      total
    }
  },

  /** Создание нового пользователя в базе данных (сотрудники / клиенты) */
  async create(data: Prisma.usersCreateInput) {
    return prisma.users.create({
      data
    })
  },

  /** Универсальное обновление данных пользователя с возможностью настройки select */

  async update(userId: number, data: Prisma.usersUpdateInput, select?: Prisma.usersSelect) {
    return prisma.users.update({
      where: { user_id: userId },
      data,
      ...(select ? { select } : {})
    })
  },

  async delete(userId: number) {
    return prisma.users.delete({
      where: { user_id: userId }
    })
  }
}

