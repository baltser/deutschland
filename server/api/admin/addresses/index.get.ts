import { prisma } from '#server/utils/prisma'
import type { AddressesListResponse } from '#server/types/admin'

export default defineEventHandler(async (): Promise<AddressesListResponse> => {
  const addresses = await prisma.addresses.findMany({
    include: {
      clients: {
        include: {
          user: {
            select: {
              user_id: true,
              user_name: true,
              phone: true,
              email: true
            }
          }
        }
      }
    },
    orderBy: { address_id: 'desc' }
  })

  return { addresses }
})
