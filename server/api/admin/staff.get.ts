import { staffManagementService } from '#server/services/admin/staff-management.service.ts'
import type { StaffListResponse } from '~/types/admin.ts'
import type { StaffUser } from '~/types/user.ts'

export default defineEventHandler(async (): Promise<StaffListResponse> => {
  const staff = await staffManagementService.getStaffList()

  return {
    success: true,
    users: staff as StaffUser[]
  }
})
