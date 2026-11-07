import { callDeviceEndpoint } from '~~/server/utils/device-api'
import { logger } from '~~/server/utils/logger'

export default defineEventHandler(async (event) => {
  // Точная проверка сессии по твоему стандарту
  const session = await getUserSession(event)
  if (!session || !session.user) {
    throw createError({
      statusCode: 401,
      message: 'Необходима авторизация',
    })
  }

  const { user_id, role_name } = session.user

  if (!user_id) {
    throw createError({
      statusCode: 400,
      message: 'Не удалось определить ID пользователя в сессии',
    })
  }

  const idParam = getRouterParam(event, 'id')
  if (!idParam) {
    return { status: 400, error: 'Некорректные параметры устройства' }
  }

  const id = Number(idParam)
  if (isNaN(id)) {
    return { status: 400, error: 'Некорректный ID устройства' }
  }

  // Запрос к физическому устройству через драйвер
  const result = await callDeviceEndpoint(id, 'cgi-bin__ping_cgi~action=status')

  // Логируем только в случае сбоя связи с железом
  if (result.status === null || result.status !== 200) {
    logger.warn(`Пользователь ID:${user_id} (${role_name}) — ошибка пинга устройства ${id}`, {
      deviceId: id,
      status: result.status,
      error: result.error,
      userId: user_id,
      roleName: role_name
    })
  }

  return result
})
