import { z } from 'zod'
import { addressManagementService } from '#server/services/admin/address-management.service'

const importClientItemSchema = z.object({
  phone: z.string().min(10, 'Введите корректный номер телефона'),
  name: z.string().optional().nullable()
})

const importSchema = z.object({
  clients: z.array(importClientItemSchema).min(1, 'Список клиентов пуст')
})

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (isNaN(id)) {
    throw createError({ statusCode: 400, message: 'Некорректный ID адреса' })
  }

  const body = await readBody(event)
  const parseResult = importSchema.safeParse(body)

  if (!parseResult.success) {
    throw createError({
      statusCode: 400,
      message: parseResult.error.issues[0]?.message || 'Неверные данные для импорта'
    })
  }

  try {
    const importedCount = await addressManagementService.importClientsToAddress(
      id,
      parseResult.data.clients
    )

    return {
      success: true,
      message: `Успешно импортировано клиентов: ${importedCount}`,
      count: importedCount
    }
  } catch (err: unknown) {
    console.error('Ошибка при массовом импорте клиентов:', err)
    throw createError({
      statusCode: 500,
      message: 'Произошла ошибка при сохранении данных в базу'
    })
  }
})
