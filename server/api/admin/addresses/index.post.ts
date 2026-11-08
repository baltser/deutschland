import { z } from 'zod'
import { prisma } from '#server/utils/prisma'
import type { CreateAddressResponse } from '#server/types/admin'

const createAddressSchema = z.object({
  address_name: z.string().min(3, 'Адрес слишком короткий (минимум 3 символа)')
})

export default defineEventHandler(async (event): Promise<CreateAddressResponse> => {

  const body = await readValidatedBody(event, createAddressSchema.parse)
  const { address_name } = body

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
    if (prismaErr.code === 'P2002') {
      throw createError({
        statusCode: 400,
        message: 'Такой адрес уже существует в системе'
      })
    }
    throw e
  }
})
