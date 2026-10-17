export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const addressId = Number(id)

  if (isNaN(addressId)) {
    throw createError({
      statusCode: 400,
      message: 'Некорректный ID адреса'
    })
  }

  const address = await prisma.addresses.findUnique({
    where: { address_id: addressId },
    include: {
      clients: {
        include: {
          user: {
            select: {
              user_id: true,
              user_name: true,
              phone: true,
              email: true,
              role_id: true
            }
          }
        }
      }
    }
  })

  if (!address) {
    throw createError({
      statusCode: 404,
      message: 'Адрес не найден'
    })
  }

  return { address }
})
