import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { randomBytes } from 'node:crypto'
import { uploadFileToMinio } from '#server/utils/minio'
import { getRedisClient } from '#server/utils/redis'
import { logger } from '#server/utils/logger'
import { sendVerificationEmail } from '#server/utils/mail'

const bodySchema = z.object({
  name: z.string().min(1, 'Имя обязательно'),
  email: z.email('Некорректный формат email'),
  password: z.string().min(6, 'Пароль должен быть не менее 6 символов')
})

export default defineEventHandler(async (event) => {
  const log = logger.withTag('auth:register')

  const parts = await readMultipartFormData(event)
  if (!parts || parts.length === 0) {
    throw createError({
      statusCode: 400,
      message: 'Форма не содержит данных'
    })
  }

  const rawFields: Record<string, string> = {}
  let avatarPart: { filename: string; type: string; data: Buffer } | null = null

  for (const part of parts) {
    if (!part.name) continue

    if (part.name === 'avatar' && part.filename && part.data.length > 0) {
      avatarPart = {
        filename: part.filename,
        type: part.type || 'image/jpeg',
        data: part.data
      }
    } else if (!part.filename) {
      rawFields[part.name] = part.data.toString('utf-8')
    }
  }

  const parseResult = bodySchema.safeParse(rawFields)
  if (!parseResult.success) {
    throw createError({
      statusCode: 400,
      message: parseResult.error.issues[0]?.message || 'Ошибка валидации данных'
    })
  }

  const body = parseResult.data

  // Проверка существования пользователя
  const existingUser = await prisma.users.findUnique({
    where: { email: body.email }
  })

  if (existingUser) {
    throw createError({
      statusCode: 409,
      message: 'Пользователь с таким email уже существует'
    })
  }

  // Находим роль "user" по умолчанию в таблице roles
  const defaultRole = await prisma.roles.findUnique({
    where: { role_name: 'user' }
  })

  if (!defaultRole) {
    throw createError({
      statusCode: 500,
      message: 'Системная ошибка: роль по умолчанию не найдена'
    })
  }

  // Загрузка аватара
  let avatarPath: string | null = null
  if (avatarPart) {
    try {
      avatarPath = await uploadFileToMinio(
        avatarPart.data,
        avatarPart.filename,
        avatarPart.type,
        'avatars'
      )
    } catch (err: unknown) {
      log.error('Ошибка загрузки аватара при регистрации:', { cause: err })
    }
  }

  const hashedPassword = await bcrypt.hash(body.password, 10)

  // 1. Создаем пользователя с явно неактивным статусом (is_active: false)
  const user = await prisma.users.create({
    data: {
      user_name: body.name,
      email: body.email,
      password: hashedPassword,
      role_id: defaultRole.role_id,
      is_active: false, // 👈 Аккаунт заблокирован до подтверждения почты
      ...(avatarPath && { avatar_path: avatarPath })
    },
    include: { role: true }
  })

  // 2. Генерируем токен и сохраняем в Redis на 24 часа
  const verificationToken = randomBytes(32).toString('hex')
  const redis = getRedisClient()
  await redis.set(`verify:${verificationToken}`, user.user_id, 'EX', 86400)

  // 3. Отправляем письмо с подтверждением
  try {
    await sendVerificationEmail(user.email, verificationToken)
  } catch (err: unknown) {
    log.error(`Не удалось отправить письмо для ${user.email}, но аккаунт создан:`, { cause: err })
  }

  setResponseStatus(event, 201)
  return {
    success: true,
    message: 'Регистрация прошла успешно. Пожалуйста, проверьте почту для подтверждения.',
    redirectUrl: '/auth/verify-pending' // Подсказка фронтенду, куда перенаправить
  }
})
