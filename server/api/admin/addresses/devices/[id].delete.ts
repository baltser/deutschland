import { deviceService } from '#server/services/devices/device.service'

export default defineEventHandler(async (event) => {
  const deviceId = Number(getRouterParam(event, 'id'))
  if (isNaN(deviceId)) {
    throw createError({ statusCode: 400, message: 'Некорректный ID устройства' })
  }

  const actorUserId = event.context.user?.user_id || 0

  await deviceService.deleteDevice(deviceId, actorUserId)

  return {
    success: true,
    message: 'Устройство успешно удалено'
  }
})
