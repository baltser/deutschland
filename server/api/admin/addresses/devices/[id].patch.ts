import { deviceService } from '#server/services/devices/device.service'

export default defineEventHandler(async (event) => {
  const deviceId = Number(getRouterParam(event, 'id'))
  if (isNaN(deviceId)) {
    throw createError({ statusCode: 400, message: 'Некорректный ID устройства' })
  }

  // Получаем ID текущего админа (если у тебя прописан хелпер авторизации, например event.context.user)
  const actorUserId = event.context.user?.user_id || 0

  const body = await readBody(event)

  const updatedDevice = await deviceService.updateDevice(deviceId, actorUserId, body)

  return {
    success: true,
    device: updatedDevice
  }
})
