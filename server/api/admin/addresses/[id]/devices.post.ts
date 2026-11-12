import { deviceService } from '#server/services/devices/device.service'
import type { CreateDeviceResponse } from '#server/types/admin'

export default defineEventHandler(async (event): Promise<CreateDeviceResponse> => {
  const user = event.context.user
  const idParam = getRouterParam(event, 'id')

  if (!idParam) {
    throw createError({
      statusCode: 400,
      message: 'Не указан ID адреса',
    })
  }

  const addressId = Number(idParam)

  if (isNaN(addressId)) {
    throw createError({
      statusCode: 400,
      message: 'Некорректный ID адреса',
    })
  }

  const body = await readBody(event)

  const newDevice = await deviceService.createDeviceForAddress(
    addressId,
    user.user_id,
    body
  )

  return {
    success: true,
    device: newDevice,
  }
})
