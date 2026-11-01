import { prisma } from '#server/utils/prisma'
import type {Prisma} from "@prisma/client";

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session || !session.user || session.user.role_name !== 'admin') {
    throw createError({ statusCode: 403, message: 'Доступ запрещен' })
  }

  const query = getQuery(event)
  const page = Number(query.page) || 1
  const limit = Number(query.limit) || 20
  const search = query.search ? String(query.search).trim() : ''
  const addressId = query.addressId ? Number(query.addressId) : null

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
    success: true,
    clients,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1
    }
  }
})
