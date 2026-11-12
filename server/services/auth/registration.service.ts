import bcrypt from 'bcryptjs'
import { userRepository } from '#server/repositories/prisma/user.repository'
import { tokenRepository } from '#server/repositories/redis/token.repository'
import { normalizeAndValidatePhone } from '#server/utils/phone'
import { logger } from '#server/utils/logger'

const log = logger.withTag('services:auth:registration')

export const registrationService = {
  /**
   * Инициализация звонка подтверждения через uCaller
   */
  async initRegistration(rawPhone: string, passwordPlain: string) {
    const phone = normalizeAndValidatePhone(rawPhone)

    // 1. Проверяем, существует ли сотрудник/клиент в базе, заведен ли админом
    const existingUser = await userRepository.findByPhone(phone)

    if (!existingUser) {
      log.warn(`Попытка регистрации с незарегистрированным номером: ${phone}`)
      throw createError({
        statusCode: 403,
        message: 'Номер телефона не найден в системе. Обратитесь к администратору.'
      })
    }

    if (existingUser.activated_at !== null) {
      log.warn(`Попытка повторной активации уже активного аккаунта: ${phone}`)
      throw createError({
        statusCode: 409,
        message: 'Этот аккаунт уже активирован. Пожалуйста, выполните вход.'
      })
    }

    const secretKey = process.env.UCALLER_SECRET_KEY
    const serviceId = process.env.UCALLER_SERVICE_ID

    // 2. Запрос к uCaller API
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

    // 3. Хэшируем пароль и сохраняем черновик в Redis через наш tokenRepository
    const hashedPassword = await bcrypt.hash(passwordPlain, 10)

    const registrationPayload = {
      code: res.code,
      phone,
      password: hashedPassword,
      user_id: existingUser.user_id
    }

    await tokenRepository.setPendingRegistration(phone, registrationPayload, 360) // живет 6 минут

    log.success(`Черновик регистрации успешно создан для клиента ${phone}`)

    return {
      success: true,
      message: 'Звонок отправлен',
      ucallerId: res.ucaller_id
    }
  },

  /**
   * Подтверждение кода из звонка и активация пользователя
   */
  async verifyRegistration(rawPhone: string, code: string) {
    const phone = normalizeAndValidatePhone(rawPhone)
    const cleanCode = code.trim()

    // 1. Достаем черновик из Redis через репозиторий
    interface PendingRegData {
      code: string
      phone: string
      password: string
      user_id: number
    }

    const pendingData = await tokenRepository.getPendingRegistration<PendingRegData>(phone)

    if (!pendingData) {
      throw createError({
        statusCode: 400,
        message: 'Время действия кода истекло. Запросите звонок повторно.'
      })
    }

    if (String(pendingData.code) !== cleanCode) {
      throw createError({
        statusCode: 400,
        message: 'Неверный код подтверждения из звонка'
      })
    }

    // 2. Удаляем использованный токен из Redis
    await tokenRepository.deletePendingRegistration(phone)

    // 3. Проверяем пользователя в БД
    const existingUser = await userRepository.findById(pendingData.user_id)
    if (!existingUser) {
      throw createError({
        statusCode: 404,
        message: 'Пользователь не найден в системе'
      })
    }

    // 4. Активируем пользователя (сохраняем пароль и дату активации) через userRepository
    const updatedUser = await userRepository.update(
      existingUser.user_id,
      {
        password: pendingData.password,
        activated_at: new Date()
      },
      {
        user_id: true,
        user_name: true,
        role_name: true,
        avatar_path: true
      }
    )

    log.success(`✅ Аккаунт успешно активирован для пользователя ID: ${updatedUser.user_id} -- ${updatedUser.user_name}`)

    return {
      success: true,
      message: 'Регистрация прошла успешно!',
      user: {
        user_id: updatedUser.user_id,
        user_name: updatedUser.user_name || null,
        role_name: updatedUser.role_name,
        avatar_path: updatedUser.avatar_path || null
      }
    }
  }
}
