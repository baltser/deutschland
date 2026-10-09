import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { randomUUID } from 'node:crypto'
import {getMinioClient} from "#server/utils/minio.ts";
// import { getMinioClient, ensureBucket } from '~/server/utils/minio'

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

  // 2. Извлекаем текстовые поля и файл
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

  // 3. Валидируем текстовые поля через Zod
  const parseResult = bodySchema.safeParse(rawFields)
  if (!parseResult.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parseResult.error.issues[0]?.message || 'Ошибка валидации данных'
    })
  }

  const body = parseResult.data

  logger.info(`Попытка регистрации: ${body.email}`, { ip: clientIp, userAgent })

  // 4. Проверяем существование пользователя
  const existingUser = await prisma.user.findUnique({
    where: { email: body.email }
  })

  if (existingUser) {
    logger.warn(`Неудачная регистрация: email ${body.email} уже зарегистрирован`, { ip: clientIp })

    throw createError({
      statusCode: 409,
      statusMessage: 'Пользователь с таким email уже существует'
    })
  }

  // 5. Сохраняем аватар в MinIO (если загружен)
  let avatarPath: string | null = null

  if (avatarPart) {
    try {
      await ensureBucket()
      // Деструктуризируем client и bucket из утилиты
      const { client, bucket } = getMinioClient()

      const fileExt = avatarPart.filename.split('.').pop() || 'jpg'
      const objectName = `avatars/${randomUUID()}.${fileExt}`

      // Вызываем client.putObject (а не minioClient.putObject)
      await client.putObject(
        bucket,
        objectName,
        avatarPart.data,
        avatarPart.data.length,
        { 'Content-Type': avatarPart.type }
      )

      avatarPath = objectName
      logger.info(`[MinIO] Аватар успешно загружен: ${objectName}`)
    } catch (err) {
      console.error('[MinIO Upload Error]:', err)
    }
  }

  // 6. Хешируем пароль и создаем пользователя в БД
  const hashedPassword = await bcrypt.hash(body.password, 10)

  const user = await prisma.user.create({
    data: {
      name: body.name,
      email: body.email,
      password: hashedPassword,
      ruleName: 'user',
      ...(avatarPath && { avatar: avatarPath }) // Замените на имя поля в вашей модели Prisma (avatar или avatarUrl)
    }
  })

  // 7. Авторизуем пользователя в сессии
  await setUserSession(event, {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      rule_name: user.ruleName,
      created_at: user.createdAt.toISOString()
    }
  })

  logger.info(`✅ Успешная регистрация: ${user.email}`, { userId: user.id })

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
