import { prisma } from '#server/utils/prisma'

export default defineEventHandler(async (event) => {
  // Проверяем сессию администратора
  await requireUserSession(event)

  const idParam = event.context.params?.id
  const addressId = Number(idParam)

  if (isNaN(addressId)) {
    throw createError({
      statusCode: 400,
      message: 'Некорректный ID адреса',
    })
  }

  const body = await readBody(event)
  const { device_name, device_type, ip, port, login, password } = body

  if (!device_name || !device_name.trim()) {
    throw createError({
      statusCode: 400,
      message: 'Укажите название устройства',
    })
  }

  // Проверяем, существует ли указанный адрес
  const address = await prisma.addresses.findUnique({
    where: { address_id: addressId },
  })

  if (!address) {
    throw createError({
      statusCode: 404,
      message: 'Адрес не найден',
    })
  }

  try {
    // Создаем устройство в базе данных и привязываем к адресу
    const newDevice = await prisma.devices.create({
      data: {
        device_name: device_name.trim(),
        device_type: device_type || 'CAMERA',
        ip: ip ? ip.trim() : null,
        port: port ? Number(port) : null,
        login: login ? login.trim() : null,
        password: password ? password.trim() : null,
        address_id: addressId,
      },
    })

    return {
      success: true,
      device: newDevice,
    }
  } catch (err: unknown) {
    console.error('Ошибка при создании устройства:', err)
    throw createError({
      statusCode: 500,
      message: 'Не удалось сохранить устройство в базу данных',
    })
  }
})
