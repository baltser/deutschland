import bcrypt from 'bcryptjs'
import { getRedisClient } from '#server/utils/redis'
import { logger } from '#server/utils/logger'
import { normalizeAndValidatePhone } from '#server/utils/phone'

interface UCallerResponse {
  status?: boolean
  code?: string
  error?: string
  ucaller_id?: string
}

interface HttpError {
  statusCode?: number
  [key: string]: unknown
}

export default defineEventHandler(async (event) => {
  const log = logger.withTag('auth:send-code')
  const body = await readBody(event)
  const { password, email } = body

  if (!password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Введите пароль'
    })
  }

  const phone = normalizeAndValidatePhone(body.phone)

  const existingUser = await prisma.users.findUnique({
    where: { phone }
  })

  if (!existingUser) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Номер телефона не найден в системе. Обратитесь к администратору.'
    })
  }

  if (existingUser.activated_at !== null) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Этот аккаунт уже активирован. Пожалуйста, выполните вход.'
    })
  }

  const secretKey = process.env.UCALLER_SECRET_KEY
  const serviceId = process.env.UCALLER_SERVICE_ID

  try {
    const res = await $fetch<UCallerResponse>('https://api.ucaller.ru/v1.0/initCall', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${secretKey}.${serviceId}`
      },
      params: { phone }
    })

    if (!res || res.status === false) {
      throw createError({
        statusCode: 400,
        statusMessage: res?.error || 'Не удалось инициировать звонок'
      })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const redis = getRedisClient()
    const registrationPayload = JSON.stringify({
      code: res.code,
      phone,
      email: email || null,
      password: hashedPassword,
      user_id: existingUser.user_id
    })

    await redis.set(`pending_reg:${phone}`, registrationPayload, 'EX', 180)

    log.success(`Черновик регистрации и код uCaller сохранены для предзаписанного клиента ${phone}`)

    return {
      success: true,
      message: 'Звонок отправлен',
      ucallerId: res.ucaller_id
    }
  } catch (err: unknown) {
    log.error(`Ошибка отправки кода на ${phone}:`, { cause: err })
    const error = err as HttpError
    if (error.statusCode) {
      throw err
    }
    throw createError({
      statusCode: 502,
      statusMessage: 'Ошибка связи с сервисом звонков uCaller'
    })
  }
})
