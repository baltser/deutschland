import { z } from 'zod'
import { profileService } from '#server/services/profile/profile.service'
import type { UserProfile } from '#server/types/profile'

const updateProfileSchema = z.object({
  user_name: z.string().min(2, 'Имя должно содержать не менее 2 символов').optional(),
  email: z
    .email('Введите корректный email')
    .optional()
    .nullable()
    .transform((val) => (val === '' ? null : val)),
  password: z
    .string()
    .min(6, 'Пароль должен быть не менее 6 символов')
    .optional()
    .nullable()
    .transform((val) => (val === '' ? null : val))
})

export default defineEventHandler(async (event): Promise<UserProfile> => {
  const user = event.context.user
  const body = await readValidatedBody(event, (b) => updateProfileSchema.parse(b))

  const updatedUser = await profileService.updateProfile(user.user_id, body)

  await setUserSession(event, {
    user: {
      user_id: updatedUser.user_id,
      role_name: updatedUser.role_name,
      user_name: updatedUser.user_name || null,
      avatar_path: updatedUser.avatar_path || null
    }
  })

  return updatedUser
})
