import bcrypt from 'bcryptjs'
import { z } from 'zod'
import {uploadFileToMinio} from "#server/utils/minio.ts";

const bodySchema = z.object({
  name: z.string().min(1, 'Имя обязательно'),
  email: z.email('Некорректный формат email'),
  password: z.string().min(6, 'Пароль должен быть не менее 6 символов')
})

export default defineEventHandler(async (event) => {
  const clientIp = getRequestIP(event) || 'unknown'
  const userAgent = getRequestHeader(event, 'user-agent') || 'unknown'

  // 1. Читаем multipart/form-data
  const parts = await readMultipartFormData(event)

  if (!parts || parts.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Форма не содержит данных'
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

  // 2. Валидация полей
  const parseResult = bodySchema.safeParse(rawFields)
  if (!parseResult.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parseResult.error.issues[0]?.message || 'Ошибка валидации данных'
    })
  }

  const body = parseResult.data
  const log = logger.withTag('auth')
  log.info(`Попытка регистрации: ${body.email}`, { ip: clientIp, userAgent })

  // 3. Проверка существования пользователя
  const existingUser = await prisma.user.findUnique({
    where: { email: body.email }
  })

  if (existingUser) {
    log.warn(`Неудачная регистрация: email ${body.email} уже зарегистрирован`, { ip: clientIp })
    throw createError({
      statusCode: 409,
      statusMessage: 'Пользователь с таким email уже существует'
    })
  }

  // 4. Загрузка аватара через чистый хелпер
  let avatarPath: string | null = null

  if (avatarPart) {
    try {
      avatarPath = await uploadFileToMinio(
        avatarPart.data,
        avatarPart.filename,
        avatarPart.type,
        'avatars'
      )
      log.info(`[MinIO] Аватар успешно загружен: ${avatarPath}`)
    } catch (err) {
      console.error('[MinIO Upload Error]:', err)
      // Решаем: прерывать ли регистрацию при сбое загрузки аватара,
      // или просто оставить аватар null. Обычно безопаснее продолжить без аватара или вернуть ошибку.
    }
  }

  // 5. Создание пользователя в БД
  const hashedPassword = await bcrypt.hash(body.password, 10)

  const user = await prisma.user.create({
    data: {
      name: body.name,
      email: body.email,
      password: hashedPassword,
      ruleName: 'user',
      ...(avatarPath && { avatar: avatarPath })
    }
  })

  // 6. Установка сессии
  await setUserSession(event, {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      rule_name: user.ruleName,
      avatar: user.avatar || null
    }
  })

  log.info(`✅ Успешная регистрация: ${user.email}`, { userId: user.id })
  setResponseStatus(event, 201)

  return {
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      rule_name: user.ruleName,
      avatar: user.avatar || null
    }
  }
})
