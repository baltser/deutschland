import { prisma } from '#server/utils/prisma'
import type { SingleAddressResponse } from '#server/types/admin'

export default defineEventHandler(async (event): Promise<SingleAddressResponse> => {
  await requireUserSession(event)

  const id = Number(event.context.params?.id)
  if (isNaN(id)) {
    throw createError({ statusCode: 400, message: 'Некорректный ID' })
  }

  const address = await prisma.addresses.findUnique({
    where: { address_id: id },
    include: {
      clients: {
        include: {
          user: true,
        },
      },
      devices: true,
    },
  })

  if (!address) {
    throw createError({ statusCode: 404, message: 'Адрес не найден' })
  }

  return {
    success: true,
    address,
  }
})
