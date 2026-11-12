import { deviceService } from '#server/services/devices/device.service'

export default defineEventHandler(async (event) => {
  // 🔥 Сессия и user_id уже гарантированно есть благодаря нашему middleware!

  const idParam = getRouterParam(event, 'id')
  const id = Number(idParam)

  if (isNaN(id)) {
    throw createError({
      statusCode: 400,
      message: 'Некорректный ID устройства'
    })
  }

  return await deviceService.pingDevice(id)
})
