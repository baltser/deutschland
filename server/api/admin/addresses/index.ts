import { z } from 'zod'

const createAddressSchema = z.object({
  address_name: z.string().min(3, 'Адрес слишком короткий (минимум 3 символа)')
})

export default defineEventHandler(async (event) => {
  const method = getMethod(event)

  // 1. GET: Получение всех адресов
  if (method === 'GET') {
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
  }

  // 2. POST: Создание нового адреса
  if (method === 'POST') {
    const body = await readBody(event)
    const parseResult = createAddressSchema.safeParse(body)

    if (!parseResult.success) {
      throw createError({
        statusCode: 400,
        message: parseResult.error.issues[0]?.message || 'Неверный формат адреса'
      })
    }

    // 👈 Извлекаем правильное поле address_name
    const { address_name } = parseResult.data

    try {
      const newAddress = await prisma.addresses.create({
        data: { address_name }
      })

      return {
        success: true,
        address: newAddress
      }
    } catch (e: unknown) {
      const prismaErr = e as { code?: string }
      // Ошибка уникальности (если такой адрес уже есть)
      if (prismaErr.code === 'P2002') {
        throw createError({
          statusCode: 400,
          message: 'Такой адрес уже существует в системе'
        })
      }
      throw e
    }
  }

  throw createError({ statusCode: 405, message: 'Method Not Allowed' })
})
