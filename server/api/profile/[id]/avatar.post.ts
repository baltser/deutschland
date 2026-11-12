import { profileService } from '#server/services/profile/profile.service'
import type { AvatarUploadResponse } from '#server/types/profile'

export default defineEventHandler(async (event): Promise<AvatarUploadResponse> => {
  const user = event.context.user
  const targetUserId = getRouterParam(event, 'id')

  if (!targetUserId) {
    throw createError({ statusCode: 400, message: 'ID пользователя не указан' })
  }

  const userIdNum = Number(targetUserId)
  const isAdmin = user.role_name === 'admin'
  const isSelf = user.user_id === userIdNum

  if (!isSelf && !isAdmin) {
    throw createError({
      statusCode: 403,
      message: 'Недостаточно прав для изменения аватара этого пользователя'
    })
  }

  const parts = await readMultipartFormData(event)
  if (!parts || parts.length === 0) {
    throw createError({ statusCode: 400, message: 'Файл не передан' })
  }

  const avatarPart = parts.find(p => p.name === 'avatar' && p.filename && p.data.length > 0)

  if (!avatarPart) {
    throw createError({ statusCode: 400, message: 'Поле "avatar" обязательно' })
  }

  // Вся бизнес-логика (валидация, удаление старого, загрузка нового в MinIO и апдейт БД) — внутри сервиса!
  const updatedUser = await profileService.uploadAvatar(userIdNum, {
    filename: avatarPart.filename!,
    type: avatarPart.type || 'image/jpeg',
    data: avatarPart.data
  })

  if (isSelf) {
    await setUserSession(event, {
      user: {
        user_id: updatedUser.user_id,
        role_name: updatedUser.role_name,
        user_name: updatedUser.user_name || null,
        avatar_path: updatedUser.avatar_path || null
      }
    })
  }

  return {
    success: true,
    avatarUrl: updatedUser.avatar_path
  }
})
