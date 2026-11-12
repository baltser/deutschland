import { profileService } from '#server/services/profile/profile.service'
import type { UserProfile } from '#server/types/profile'

export default defineEventHandler(async (event): Promise<UserProfile> => {
  const user = event.context.user
  return await profileService.getProfile(user.user_id)
})
