import bcrypt from 'bcryptjs'
import { userRepository } from '#server/repositories/prisma/user.repository'

export const authService = {
  /**
   * Аутентификация пользователя по телефону и паролю
   */
  async login(phone: string, passwordPlain: string) {
    const cleanPhone = phone.trim()

    // Используем наш репозиторий вместо прямого prisma.users.findUnique
    const user = await userRepository.findByPhone(cleanPhone)

    if (!user || !user.password) {
      throw createError({
        statusCode: 401,
        message: 'Неверный номер телефона или пароль'
      })
    }

    const isPasswordValid = await bcrypt.compare(passwordPlain, user.password)
    if (!isPasswordValid) {
      throw createError({
        statusCode: 401,
        message: 'Неверный номер телефона или пароль'
      })
    }

    // Возвращаем объект для сессии
    return {
      user_id: user.user_id,
      role_name: user.role_name,
      user_name: user.user_name || null,
      avatar_path: user.avatar_path || null
    }
  }
}
