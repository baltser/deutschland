import bcrypt from 'bcryptjs'
import { z } from 'zod'

const profileSchema = z.object({
  name: z.string().min(1, 'Имя обязательно').optional(),
  email: z.email('Некорректный формат email').optional(),
  password: z.string().min(6, 'Пароль должен быть не менее 6 символов').optional()
})

export default defineEventHandler(async (event) => {
  // 1. Проверяем сессию авторизованного пользователя
  const session = await requireUserSession(event)
  const userId = session.user.id

  const body = await readBody(event)
  const parseResult = profileSchema.safeParse(body)

  if (!parseResult.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parseResult.error.issues[0]?.message || 'Ошибка валидации данных'
    })
  }

  const { name, email, password } = parseResult.data
  const updateData: { name?: string; email?: string; password?: string } = {}

  if (name) updateData.name = name

  if (email) {
    // Проверяем, не занят ли email кем-то другим
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser && String(existingUser.id) !== String(userId)) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Этот email уже используется другим пользователем'
      })
    }
    updateData.email = email
  }

  if (password) {
    updateData.password = await bcrypt.hash(password, 10)
  }

  // 2. Обновляем данные в базе
  try {
    const updatedUser = await prisma.user.update({
      where: { id: String(userId) },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        ruleName: true,
        avatar: true,
        createdAt: true
      }
    })

    // 3. Синхронизируем изменения с текущей сессией
    await setUserSession(event, {
      user: {
        ...session.user,
        name: updatedUser.name,
        email: updatedUser.email,
        avatar: updatedUser.avatar || null
      }
    })

    return {
      success: true,
      user: updatedUser
    }
  } catch (err: unknown) {
    console.error('[Profile Update Error]:', err)
    throw createError({
      statusCode: 500,
      statusMessage: 'Не удалось обновить профиль в базе данных'
    })
  }
})
