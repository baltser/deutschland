import {addressManagementService} from "#server/services/admin/address-management.service.ts";

export default defineEventHandler(async (event) => {
  const idParam = getRouterParam(event, 'id')
  const addressId = Number(idParam)

  if (!addressId || Number.isNaN(addressId)) {
    throw createError({
      statusCode: 400,
      message: 'Некорректный ID адреса'
    })
  }

  try {
    await addressManagementService.deleteAddress(addressId)

    return {
      success: true,
      message: 'Адрес успешно удален'
    }
  } catch (err: unknown) {
    // Если это уже созданная через createError ошибка Nuxt/Nitro, просто пробрасываем её дальше
    if (err && typeof err === 'object' && 'statusCode' in err) {
      throw err
    }

    throw createError({
      statusCode: 500,
      message: 'Внутренняя ошибка сервера при удалении адреса'
    })
  }
})
