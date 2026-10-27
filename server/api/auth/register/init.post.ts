import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { getRedisClient } from '#server/utils/redis'
import { logger } from '#server/utils/logger'
import { normalizeAndValidatePhone } from '#server/utils/phone'
import type { RegisterInitResponse } from '#server/types/auth'

const initSchema = z.object({
  phone: z.string().min(10, 'Введите номер телефона'),
  password: z.string().min(6, 'Пароль должен быть не менее 6 символов')
})

export default defineEventHandler(async (event): Promise<RegisterInitResponse> => {
  const log = logger.withTag('auth:register:init')
  const body = await readValidatedBody(event, (b) => initSchema.parse(b))
  const phone = normalizeAndValidatePhone(body.phone)
  const { password } = body

  const existingUser = await prisma.users.findUnique({
    where: { phone }
  })

  if (!existingUser) {
    log.warn(`Попытка регистрации с не зарегистрированным в базе номером: ${phone}`)
    throw createError({
      statusCode: 403,
      message: 'Номер телефона не найден в системе. Обратитесь к администратору.'
    })
  }

  if (existingUser.activated_at !== null) {
    log.warn(`Попытка повторной регистрации уже активированного аккаунта: ${phone}`)
    throw createError({
      statusCode: 409,
      message: 'Этот аккаунт уже активирован. Пожалуйста, выполните вход.'
    })
  }

  const secretKey = process.env.UCALLER_SECRET_KEY
  const serviceId = process.env.UCALLER_SERVICE_ID

  let res
  try {
    res = await $fetch<{ status?: boolean; code?: string; error?: string; ucaller_id?: string }>('https://api.ucaller.ru/v1.0/initCall', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${secretKey}.${serviceId}`
      },
      params: { phone }
    })
  } catch (err) {
    log.error(`Ошибка связи с uCaller для ${phone}:`, err)
    throw createError({
      statusCode: 502,
      message: 'Ошибка связи с сервисом звонков uCaller'
    })
  }

  if (!res || res.status === false) {
    const errorMsg = res?.error || 'Не удалось инициировать звонок'
    log.error(`uCaller отклонил запрос для ${phone}: ${errorMsg}`)
    throw createError({
      statusCode: 400,
      message: errorMsg
    })
  }

  const hashedPassword = await bcrypt.hash(password, 10)
  const redis = getRedisClient()

  const registrationPayload = JSON.stringify({
    code: res.code,
    phone,
    password: hashedPassword,
    user_id: existingUser.user_id
  })

  await redis.set(`pending_reg:${phone}`, registrationPayload, 'EX', 360)

  log.success(`Черновик регистрации успешно создан для клиента ${phone}`)

  return {
    success: true,
    message: 'Звонок отправлен',
    ucallerId: res.ucaller_id
  }
})
