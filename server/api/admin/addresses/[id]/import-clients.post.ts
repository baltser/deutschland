import { z } from 'zod'
import { normalizeAndValidatePhone } from '#server/utils/phone'
import { prisma } from '#server/utils/prisma'

// Схема валидации для одного клиента в массиве
const importClientItemSchema = z.object({
  phone: z.string().min(10, 'Введите корректный номер телефона'),
  name: z.string().optional().nullable()
})

const importSchema = z.object({
  clients: z.array(importClientItemSchema).min(1, 'Список клиентов пуст')
})

export default defineEventHandler(async (event) => {

  // 2. Получение и валидация ID адреса
  const id = getRouterParam(event, 'id')
  const addressId = Number(id)
  if (isNaN(addressId)) {
    throw createError({ statusCode: 400, message: 'Некорректный ID адреса' })
  }

  // 3. Проверка существования адреса в базе
  const address = await prisma.addresses.findUnique({
    where: { address_id: addressId }
  })
  if (!address) {
    throw createError({ statusCode: 404, message: 'Адрес не найден' })
  }

  // 4. Валидация тела запроса с помощью Zod
  const body = await readBody(event)
  const parseResult = importSchema.safeParse(body)

  if (!parseResult.success) {
    throw createError({
      statusCode: 400,
      message: parseResult.error.issues[0]?.message || 'Неверные данные для импорта'
    })
  }

  const clientsData = parseResult.data.clients
  let importedCount = 0

  try {
    // 5. Массовая обработка в рамках единой транзакции Prisma
    await prisma.$transaction(async (tx) => {
      for (const item of clientsData) {
        // Нормализуем телефон с помощью твоей серверной утилиты
        let phone: string
        try {
          phone = normalizeAndValidatePhone(item.phone)
        } catch {
          // Если номер совсем битый, пропускаем эту итерацию
          continue
        }

        const userName = item.name?.trim() && item.name !== 'Без имени'
          ? item.name.trim()
          : 'Клиент'

        // Ищем или создаем пользователя
        let user = await tx.users.findUnique({
          where: { phone }
        })

        if (!user) {
          user = await tx.users.create({
            data: {
              phone,
              user_name: userName,
              password: null,
              role_name: 'client',
              activated_at: null
            }
          })
        } else if (user.user_name === 'Клиент' && userName !== 'Клиент') {
          // Обновляем имя, если раньше было дефолтное, а теперь появилось нормальное
          user = await tx.users.update({
            where: { user_id: user.user_id },
            data: { user_name: userName }
          })
        }

        // Привязываем к адресу через upsert (чтобы избежать дубликатов ключей)
        await tx.clients_x_addresses.upsert({
          where: {
            user_id_address_id: {
              user_id: user.user_id,
              address_id: addressId
            }
          },
          update: {},
          create: {
            user_id: user.user_id,
            address_id: addressId
          }
        })

        importedCount++
      }
    })

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
